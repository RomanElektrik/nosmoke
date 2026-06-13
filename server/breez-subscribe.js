// Бриз — подписка «Премиум» через ЮKassa (тот же магазин, что у донатов Свечи).
// Wire-up: в svecha server.js добавить  require('./subscribe')(app);  после express.json().
//
// Аккаунтов нет → привязка по анонимному deviceId. Поток:
//   app → POST /api/briz/pay/create {deviceId, plan, email?} → confirmation_url
//   юзер платит в браузере → возвращается → app → POST /api/briz/confirm {deviceId, paymentId}
//   сервер спрашивает ЮKassa статус → если оплачено, выдаёт премиум этому deviceId.
//   GET /api/briz/sub/:deviceId — проверка статуса. /webhook — резервное подтверждение.
//   /restore {deviceId, email} — перенос активной подписки на новое устройство.
//
// ENV (уже есть на сервере от донатов):
//   YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Отдельный магазин Бриза (не Свечи). shopId публичный; секрет — только из .env.
const SHOP_ID = process.env.BRIZ_YOOKASSA_SHOP_ID || '1382668';
const SECRET_KEY = process.env.BRIZ_YOOKASSA_SECRET_KEY || '';
const YK_URL = 'https://api.yookassa.ru/v3/payments';
const STORE = path.join(__dirname, 'data', 'briz-subs.json');
const RETURN_URL = process.env.BRIZ_RETURN_URL || 'https://breezapp.ru/pay-ok.html';

const PLANS = {
  monthly:  { amount: 399,  days: 30,    title: 'Бриз Премиум — месяц' },
  yearly:   { amount: 1990, days: 365,   title: 'Бриз Премиум — год' },
  lifetime: { amount: 3990, days: 36500, title: 'Бриз Премиум — навсегда' },
};

function basicAuth() {
  return 'Basic ' + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');
}

function loadStore() {
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch { return {}; }
}
function saveStore(o) {
  try { fs.mkdirSync(path.dirname(STORE), { recursive: true }); fs.writeFileSync(STORE, JSON.stringify(o)); }
  catch (e) { console.error('[briz] store write:', e.message); }
}

// { [deviceId]: { plan, paidUntil, paymentMethodId, email, updatedAt } }
let subs = loadStore();

function statusOf(deviceId) {
  const s = subs[deviceId];
  const premium = !!(s && s.paidUntil > Date.now());
  return { premium, until: s ? s.paidUntil : 0, plan: s ? s.plan : null };
}

function grant(deviceId, plan, paymentMethodId, email) {
  const p = PLANS[plan];
  if (!p || !deviceId) return;
  const now = Date.now();
  const cur = subs[deviceId];
  // Extend from the current paid-until if still active (stacking renewals).
  const base = cur && cur.paidUntil > now ? cur.paidUntil : now;
  subs[deviceId] = {
    plan,
    paidUntil: base + p.days * 86400_000,
    paymentMethodId: paymentMethodId || (cur && cur.paymentMethodId) || null,
    email: email || (cur && cur.email) || null,
    updatedAt: now,
  };
  saveStore(subs);
}

async function ykCreate({ amount, description, deviceId, plan, email }) {
  const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  const body = {
    amount: { value: amount.toFixed(2), currency: 'RUB' },
    capture: true,
    description,
    confirmation: { type: 'redirect', return_url: RETURN_URL + '?d=' + encodeURIComponent(deviceId) },
    save_payment_method: plan !== 'lifetime', // сохраняем способ для автопродления (не для разового)
    metadata: { kind: 'briz-sub', deviceId, plan, email: validEmail || '' },
  };
  if (validEmail) {
    body.receipt = {
      customer: { email: validEmail },
      items: [{
        description: description.slice(0, 128),
        quantity: '1.00',
        amount: { value: amount.toFixed(2), currency: 'RUB' },
        vat_code: 1,               // НДС не облагается (самозанятый)
        payment_mode: 'full_payment',
        payment_subject: 'service',
      }],
    };
  }
  const r = await fetch(YK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': crypto.randomUUID(),
      'Authorization': basicAuth(),
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!r.ok) {
    const e = new Error('YK: ' + String((json && json.description) || text).slice(0, 300));
    e.status = r.status; throw e;
  }
  return json;
}

async function ykGet(id) {
  const r = await fetch(`${YK_URL}/${id}`, { headers: { 'Authorization': basicAuth() } });
  return r.json();
}

module.exports = function attach(app) {
  if (!SHOP_ID || !SECRET_KEY) {
    console.warn('[briz] YOOKASSA keys missing — /api/briz/* вернёт 503');
  }

  app.post('/api/briz/pay/create', async (req, res) => {
    try {
      if (!SHOP_ID || !SECRET_KEY) return res.status(503).json({ error: 'not configured' });
      const { deviceId, plan, email } = req.body || {};
      if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) return res.status(400).json({ error: 'bad deviceId' });
      const P = PLANS[plan]; if (!P) return res.status(400).json({ error: 'bad plan' });
      const payment = await ykCreate({ amount: P.amount, description: P.title, deviceId, plan, email });
      res.json({ id: payment.id, status: payment.status, confirmation_url: payment?.confirmation?.confirmation_url || null });
    } catch (e) {
      console.error('[briz] create:', e.message);
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // Primary unlock — the app calls this after the browser returns.
  app.post('/api/briz/confirm', async (req, res) => {
    try {
      if (!SHOP_ID || !SECRET_KEY) return res.status(503).json({ error: 'not configured' });
      const { deviceId, paymentId } = req.body || {};
      if (!deviceId || !paymentId) return res.status(400).json({ error: 'bad params' });
      const pay = await ykGet(String(paymentId).replace(/[^a-zA-Z0-9-]/g, ''));
      const m = pay && pay.metadata;
      if (pay && pay.status === 'succeeded' && pay.paid && m && m.kind === 'briz-sub' && m.deviceId === deviceId) {
        grant(deviceId, m.plan, pay.payment_method && pay.payment_method.id, m.email || undefined);
      }
      res.json(statusOf(deviceId));
    } catch (e) {
      console.error('[briz] confirm:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/briz/sub/:deviceId', (req, res) => {
    res.json(statusOf(String(req.params.deviceId)));
  });

  // Webhook backup — configure in ЮKassa dashboard → https://breezapp.ru/api/briz/webhook
  app.post('/api/briz/webhook', (req, res) => {
    try {
      const b = req.body || {}; const obj = b.object || {};
      if (b.event === 'payment.succeeded' && obj.metadata && obj.metadata.kind === 'briz-sub') {
        grant(obj.metadata.deviceId, obj.metadata.plan, obj.payment_method && obj.payment_method.id, obj.metadata.email || undefined);
        console.log('[briz] webhook grant:', obj.metadata.deviceId, obj.metadata.plan);
      }
      res.status(200).send('OK');
    } catch (e) {
      console.error('[briz] webhook:', e.message);
      res.status(200).send('OK');
    }
  });

  // Restore by email — rebind an active sub to the current device.
  app.post('/api/briz/restore', (req, res) => {
    try {
      const { deviceId, email } = req.body || {};
      if (!deviceId || !email) return res.status(400).json({ error: 'bad params' });
      const now = Date.now(); let best = null;
      for (const k of Object.keys(subs)) {
        const s = subs[k];
        if (s.email && s.email.toLowerCase() === String(email).toLowerCase() && s.paidUntil > now) {
          if (!best || s.paidUntil > best.paidUntil) best = s;
        }
      }
      if (best) { subs[deviceId] = { ...best, updatedAt: now }; saveStore(subs); }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[briz] mounted: POST /api/briz/pay/create · /confirm · /restore · GET /sub/:id · POST /webhook');
};
