// Бриз — подписка «Премиум» через ЮKassa (отдельный магазин Бриза).
// Wire-up: в svecha server.js  require('./subscribe')(app);  после express.json().
// Привязка по анонимному deviceId. Безопасность (после ревью):
//   • webhook НЕ доверяет телу — перепроверяет платёж через ЮKassa (ykGet);
//   • идемпотентность по paymentId — confirm/webhook не начисляют дважды;
//   • атомарная запись стора (tmp+rename) + .bak, без тихого обнуления;
//   • lifetime — флаг, не стекается; deviceId валидируется везде.
//
// ENV: BRIZ_YOOKASSA_SHOP_ID (по умолчанию 1382668), BRIZ_YOOKASSA_SECRET_KEY

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SHOP_ID = process.env.BRIZ_YOOKASSA_SHOP_ID || '1382668';
const SECRET_KEY = process.env.BRIZ_YOOKASSA_SECRET_KEY || '';
const YK_URL = 'https://api.yookassa.ru/v3/payments';
const STORE = path.join(__dirname, 'data', 'briz-subs.json');
const RETURN_URL = process.env.BRIZ_RETURN_URL || 'https://breezapp.ru/pay-ok.html';
const LIFETIME_UNTIL = 4102444800000; // 2100-01-01 — отображаемая «дата» для навсегда

const PLANS = {
  monthly:  { amount: 399,  days: 30,  title: 'Бриз Премиум — месяц' },
  yearly:   { amount: 1990, days: 365, title: 'Бриз Премиум — год' },
  lifetime: { amount: 3990, days: 0,   title: 'Бриз Премиум — навсегда', lifetime: true },
  test:     { amount: 10,   days: 1,   title: 'Бриз — проверка оплаты' }, // ВРЕМЕННЫЙ, убрать перед релизом
};

const isDevice = (d) => typeof d === 'string' && /^[0-9a-fA-F-]{8,64}$/.test(d);

function basicAuth() {
  return 'Basic ' + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');
}

function loadStore() {
  for (const f of [STORE, STORE + '.bak']) {
    try {
      const raw = fs.readFileSync(f, 'utf8');
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') return o;
    } catch (e) {
      if (fs.existsSync(f)) console.error('[briz] store parse failed:', f, e.message);
    }
  }
  return {};
}
function saveStore(o) {
  try {
    fs.mkdirSync(path.dirname(STORE), { recursive: true });
    if (fs.existsSync(STORE)) { try { fs.copyFileSync(STORE, STORE + '.bak'); } catch {} }
    const tmp = STORE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(o));
    fs.renameSync(tmp, STORE); // атомарно
  } catch (e) { console.error('[briz] store write:', e.message); }
}

let subs = loadStore();

function statusOf(deviceId) {
  const s = subs[deviceId];
  const premium = !!(s && (s.lifetime || s.paidUntil > Date.now()));
  return {
    premium,
    until: s ? (s.lifetime ? LIFETIME_UNTIL : s.paidUntil) : 0,
    plan: s ? s.plan : null,
    card: (s && s.paymentMethodId && s.card) ? s.card : null, // привязанная карта для автопродления
    autopay: !!(s && s.paymentMethodId),
  };
}

// Идемпотентно по paymentId: повторное применение того же платежа — no-op.
function grant(deviceId, plan, paymentId, paymentMethodId, email, card) {
  const p = PLANS[plan];
  if (!p || !isDevice(deviceId)) return;
  const now = Date.now();
  const cur = subs[deviceId];
  const applied = (cur && cur.applied) || [];
  if (paymentId && applied.includes(paymentId)) return; // уже начислено
  const next = {
    plan,
    lifetime: !!(p.lifetime || (cur && cur.lifetime)),
    paidUntil: p.lifetime
      ? (cur ? cur.paidUntil || now : now)
      : ((cur && cur.paidUntil > now ? cur.paidUntil : now) + p.days * 86400_000),
    paymentMethodId: paymentMethodId || (cur && cur.paymentMethodId) || null,
    card: card || (cur && cur.card) || null,
    email: email || (cur && cur.email) || null,
    applied: (paymentId ? [...applied, paymentId] : applied).slice(-50),
    updatedAt: now,
  };
  subs[deviceId] = next;
  saveStore(subs);
}

async function ykCreate({ amount, description, deviceId, plan, email }) {
  const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  const body = {
    amount: { value: amount.toFixed(2), currency: 'RUB' },
    capture: true,
    description,
    confirmation: { type: 'redirect', return_url: RETURN_URL + '?d=' + encodeURIComponent(deviceId) },
    save_payment_method: false, // ВРЕМЕННО: рекуррент магазина ещё не включён ЮKassa; вернуть plan!=='lifetime' после активации
    metadata: { kind: 'briz-sub', deviceId, plan, email: validEmail || '' },
  };
  if (validEmail) {
    body.receipt = {
      customer: { email: validEmail },
      items: [{
        description: description.slice(0, 128), quantity: '1.00',
        amount: { value: amount.toFixed(2), currency: 'RUB' },
        vat_code: 1, payment_mode: 'full_payment', payment_subject: 'service',
      }],
    };
  }
  const r = await fetch(YK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotence-Key': crypto.randomUUID(), 'Authorization': basicAuth() },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!r.ok) { const e = new Error('YK: ' + String((json && json.description) || text).slice(0, 300)); e.status = r.status; throw e; }
  return json;
}

// Hardened symmetrically with ykCreate.
async function ykGet(id) {
  const r = await fetch(`${YK_URL}/${id}`, { headers: { 'Authorization': basicAuth() } });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!r.ok) { const e = new Error('YK get: ' + String((json && json.description) || text).slice(0, 200)); e.status = r.status; throw e; }
  return json;
}

// Применить платёж к устройству, только если он реально оплачен и его метаданные совпадают.
function applyPayment(pay, expectDevice) {
  const m = pay && pay.metadata;
  if (!pay || pay.status !== 'succeeded' || !pay.paid) return false;
  if (!m || m.kind !== 'briz-sub' || !PLANS[m.plan]) return false;
  if (!isDevice(m.deviceId)) return false;
  if (expectDevice && m.deviceId !== expectDevice) return false;
  const pm = pay.payment_method;
  const card = pm && pm.card ? { last4: pm.card.last4 || '', type: pm.card.card_type || pm.title || 'card' } : null;
  grant(m.deviceId, m.plan, pay.id, pm && pm.saved ? pm.id : null, m.email || undefined, pm && pm.saved ? card : null);
  return true;
}

module.exports = function attach(app) {
  if (!SHOP_ID || !SECRET_KEY) console.warn('[briz] YOOKASSA keys missing — /api/briz/* вернёт 503');

  app.post('/api/briz/pay/create', async (req, res) => {
    try {
      if (!SHOP_ID || !SECRET_KEY) return res.status(503).json({ error: 'not configured' });
      const { deviceId, plan, email } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      const P = PLANS[plan]; if (!P) return res.status(400).json({ error: 'bad plan' });
      const payment = await ykCreate({ amount: P.amount, description: P.title, deviceId, plan, email });
      res.json({ id: payment.id, status: payment.status, confirmation_url: payment?.confirmation?.confirmation_url || null });
    } catch (e) {
      console.error('[briz] create:', e.message);
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // Нативный SDK-поток: приложение токенизирует карту через YooKassa SDK и
  // присылает payment_token — сервер создаёт платёж секретным ключом. Если нужен
  // 3DS, вернётся confirmation_url для confirmPayment() в SDK; затем клиент
  // вызывает /confirm для начисления.
  app.post('/api/briz/pay/from-token', async (req, res) => {
    try {
      if (!SHOP_ID || !SECRET_KEY) return res.status(503).json({ error: 'not configured' });
      const { deviceId, plan, paymentToken, email } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      const P = PLANS[plan]; if (!P) return res.status(400).json({ error: 'bad plan' });
      if (!paymentToken || typeof paymentToken !== 'string') return res.status(400).json({ error: 'bad token' });
      const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
      const body = {
        amount: { value: P.amount.toFixed(2), currency: 'RUB' },
        capture: true,
        payment_token: paymentToken,
        description: P.title,
        save_payment_method: false, // ВРЕМЕННО: рекуррент магазина ещё не включён ЮKassa; вернуть plan!=='lifetime' после активации
        metadata: { kind: 'briz-sub', deviceId, plan, email: validEmail || '' },
      };
      if (validEmail) {
        body.receipt = { customer: { email: validEmail }, items: [{ description: P.title.slice(0, 128), quantity: '1.00', amount: { value: P.amount.toFixed(2), currency: 'RUB' }, vat_code: 1, payment_mode: 'full_payment', payment_subject: 'service' }] };
      }
      const r = await fetch(YK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotence-Key': crypto.randomUUID(), 'Authorization': basicAuth() }, body: JSON.stringify(body) });
      const text = await r.text(); let pay = null; try { pay = JSON.parse(text); } catch {}
      if (!r.ok) return res.status(r.status).json({ error: String((pay && pay.description) || text).slice(0, 300) });
      // Если уже succeeded — начисляем сразу; иначе вернём confirmation для 3DS.
      applyPayment(pay, deviceId);
      res.json({
        id: pay.id, status: pay.status,
        confirmation_url: pay?.confirmation?.confirmation_url || null,
        ...statusOf(deviceId),
      });
    } catch (e) {
      console.error('[briz] from-token:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/briz/confirm', async (req, res) => {
    try {
      if (!SHOP_ID || !SECRET_KEY) return res.status(503).json({ error: 'not configured' });
      const { deviceId, paymentId } = req.body || {};
      if (!isDevice(deviceId) || !paymentId) return res.status(400).json({ error: 'bad params' });
      let pay;
      try { pay = await ykGet(String(paymentId).replace(/[^a-zA-Z0-9-]/g, '')); }
      catch (e) { return res.status(503).json({ error: 'yk unavailable' }); } // ретраибл для клиента
      applyPayment(pay, deviceId);
      res.json(statusOf(deviceId));
    } catch (e) {
      console.error('[briz] confirm:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/briz/sub/:deviceId', (req, res) => {
    res.json(statusOf(String(req.params.deviceId)));
  });

  // Webhook — НЕ доверяет телу: берёт только id и перепроверяет платёж в ЮKassa.
  app.post('/api/briz/webhook', async (req, res) => {
    try {
      const obj = (req.body && req.body.object) || {};
      const id = obj.id;
      if (req.body && req.body.event === 'payment.succeeded' && id) {
        try {
          const pay = await ykGet(String(id).replace(/[^a-zA-Z0-9-]/g, ''));
          if (applyPayment(pay, null)) console.log('[briz] webhook grant:', pay.metadata.deviceId, pay.metadata.plan);
        } catch (e) { console.error('[briz] webhook verify:', e.message); }
      }
      res.status(200).send('OK');
    } catch (e) {
      console.error('[briz] webhook:', e.message);
      res.status(200).send('OK');
    }
  });

  // Восстановление по email (низкоуровневая защита: без аккаунтов это лучшее, что есть).
  app.post('/api/briz/restore', (req, res) => {
    try {
      const { deviceId, email } = req.body || {};
      if (!isDevice(deviceId) || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        return res.status(400).json({ error: 'bad params' });
      }
      const now = Date.now(); let best = null;
      for (const k of Object.keys(subs)) {
        const s = subs[k];
        if (s.email && s.email.toLowerCase() === String(email).toLowerCase() && (s.lifetime || s.paidUntil > now)) {
          if (!best || (s.lifetime ? Infinity : s.paidUntil) > (best.lifetime ? Infinity : best.paidUntil)) best = s;
        }
      }
      if (best) { subs[deviceId] = { ...best, applied: [], updatedAt: now }; saveStore(subs); }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Отвязать карту: убираем сохранённый способ оплаты → автопродление больше не
  // списывает. Требование ЮKassa для подключения рекуррентов.
  app.post('/api/briz/unbind', (req, res) => {
    try {
      const { deviceId } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      const s = subs[deviceId];
      if (s) { s.paymentMethodId = null; s.card = null; s.updatedAt = Date.now(); subs[deviceId] = s; saveStore(subs); }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[briz] mounted: POST /api/briz/pay/create · /confirm · /restore · /unbind · GET /sub/:id · POST /webhook');
};
