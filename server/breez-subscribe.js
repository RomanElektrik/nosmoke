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
// Возврат денег — НЕ самообслуживанием (как в App Store / Netflix / Spotify):
// отмена не возвращает текущий период, возврат только по запросу на поддержку и
// вручную. Но если возврат всё-таки одобрен (через ЮKassa/банк) — премиум снимаем
// автоматически (reverify ниже). Кнопки «вернуть деньги» в приложении нет.
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

// ── Аккаунты (вход через Apple/Google) ──────────────────────────────────────
// Платёж по-прежнему привязан к устройству, НО если устройство вошло в аккаунт,
// подписка живёт на аккаунте (apple:<sub> / google:<sub>), а устройства — лишь
// «окна» в него. Это даёт восстановление на любом устройстве в один вход.
const STORE_ACC = path.join(__dirname, 'data', 'briz-accounts.json');
function loadAcc() {
  for (const f of [STORE_ACC, STORE_ACC + '.bak']) {
    try {
      const o = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (o && typeof o === 'object') return { accounts: o.accounts || {}, devLink: o.devLink || {} };
    } catch (e) { if (fs.existsSync(f)) console.error('[briz] acc parse:', f, e.message); }
  }
  return { accounts: {}, devLink: {} };
}
function saveAcc() {
  try {
    fs.mkdirSync(path.dirname(STORE_ACC), { recursive: true });
    if (fs.existsSync(STORE_ACC)) { try { fs.copyFileSync(STORE_ACC, STORE_ACC + '.bak'); } catch {} }
    const tmp = STORE_ACC + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({ accounts, devLink }));
    fs.renameSync(tmp, STORE_ACC);
  } catch (e) { console.error('[briz] acc write:', e.message); }
}
let { accounts, devLink } = loadAcc();

// Куда смотрит устройство: в свой аккаунт (если вошло) или в собственную запись.
function holder(deviceId) {
  const a = devLink[deviceId];
  if (a && accounts[a]) return { acct: true, key: a };
  return { acct: false, key: deviceId };
}
function getRec(deviceId) { const h = holder(deviceId); return h.acct ? accounts[h.key] : subs[h.key]; }
function putRec(deviceId, rec) {
  const h = holder(deviceId);
  if (h.acct) { accounts[h.key] = rec; saveAcc(); }
  else { subs[h.key] = rec; saveStore(subs); }
}

function statusOf(deviceId) {
  const h = holder(deviceId);
  const s = h.acct ? accounts[h.key] : subs[h.key];
  const premium = !!(s && (s.lifetime || s.paidUntil > Date.now()));
  return {
    premium,
    until: s ? (s.lifetime ? LIFETIME_UNTIL : s.paidUntil) : 0,
    plan: s ? s.plan : null,
    card: (s && s.paymentMethodId && s.card) ? s.card : null, // привязанная карта для автопродления
    autopay: !!(s && s.paymentMethodId),
    account: h.acct ? ((s && s.email) || h.key) : null, // вошёл ли в аккаунт и под кем
  };
}

// Идемпотентно по paymentId: повторное применение того же платежа — no-op.
function grant(deviceId, plan, paymentId, paymentMethodId, email, card) {
  const p = PLANS[plan];
  if (!p || !isDevice(deviceId)) return;
  const now = Date.now();
  const cur = getRec(deviceId); // запись аккаунта, если устройство вошло — иначе устройства
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
    lastPaymentId: paymentId || (cur && cur.lastPaymentId) || null, // для авто-перепроверки и возврата
    applied: (paymentId ? [...applied, paymentId] : applied).slice(-50),
    updatedAt: now,
  };
  putRec(deviceId, next);
}

// Возврат платежа → снимаем премиум (с аккаунта, если вошёл — иначе с устройства).
function revoke(deviceId) {
  const s = getRec(deviceId);
  if (!s) return;
  s.paidUntil = Date.now() - 1000;
  s.lifetime = false;
  s.paymentMethodId = null;
  s.card = null;
  s.updatedAt = Date.now();
  putRec(deviceId, s);
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

// Id платежа для перепроверки/возврата: новое поле, иначе — последний из applied
// (бэк-совместимость со старыми записями до появления lastPaymentId).
function lastPaymentOf(s) {
  if (!s) return null;
  if (s.lastPaymentId) return s.lastPaymentId;
  if (Array.isArray(s.applied) && s.applied.length) return s.applied[s.applied.length - 1];
  return null;
}

// Сколько уже возвращено по платежу (руб). >0 → возврат был.
function refundedValue(pay) {
  const v = pay && pay.refunded_amount && pay.refunded_amount.value;
  const n = v ? parseFloat(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

// При опросе статуса перепроверяем в ЮKassa, не отрефанжен ли платёж, — чтобы
// премиум снимался САМ после возврата, даже если вебхук не настроен. Троттлинг
// 10 мин/устройство, ошибки сети глушим (премиум не трогаем).
async function reverify(deviceId) {
  const s = getRec(deviceId);
  const pid = lastPaymentOf(s);
  if (!s || !pid) return;
  if (!(s.lifetime || s.paidUntil > Date.now())) return; // не премиум — нечего проверять
  const now = Date.now();
  if (s.lastVerify && now - s.lastVerify < 10 * 60_000) return;
  try {
    const pay = await ykGet(pid);
    if (refundedValue(pay) > 0) { revoke(deviceId); return; }
    s.lastVerify = now; putRec(deviceId, s);
  } catch { /* сеть/ЮKassa недоступны — не трогаем премиум */ }
}

// ── Вход через Apple ────────────────────────────────────────────────────────
// Проверяем identityToken по публичным ключам Apple (без секретов): подпись,
// издатель, аудитория (bundle id), срок. Возвращаем стабильный sub + email.
const APPLE_AUD = process.env.BRIZ_APPLE_BUNDLE || 'app.quitsmoke.client';
let appleKeys = { k: null, at: 0 };
async function getAppleKeys() {
  if (appleKeys.k && Date.now() - appleKeys.at < 3600_000) return appleKeys.k;
  const r = await fetch('https://appleid.apple.com/auth/keys');
  const j = await r.json();
  appleKeys = { k: (j && j.keys) || [], at: Date.now() };
  return appleKeys.k;
}
function b64urlBuf(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Buffer.from(s, 'base64'); }
function b64urlJson(s) { return JSON.parse(b64urlBuf(s).toString('utf8')); }
async function verifyApple(idToken) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('bad token');
  const header = b64urlJson(parts[0]);
  const payload = b64urlJson(parts[1]);
  const jwk = (await getAppleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('no key');
  const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), pub, b64urlBuf(parts[2]));
  if (!ok) throw new Error('bad signature');
  if (payload.iss !== 'https://appleid.apple.com') throw new Error('bad iss');
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(APPLE_AUD)) throw new Error('bad aud');
  if (payload.exp && Date.now() / 1000 > payload.exp + 60) throw new Error('expired');
  if (!payload.sub) throw new Error('no sub');
  return { sub: String(payload.sub), email: payload.email || null };
}

// Привязать устройство к аккаунту: при первом входе свернуть подписку устройства
// в аккаунт; при повторном — взять лучшее из аккаунта и устройства.
function linkDeviceToAccount(deviceId, acctId, email) {
  let acc = accounts[acctId];
  const dev = subs[deviceId];
  if (!acc) {
    acc = dev ? { ...dev } : { plan: null, lifetime: false, paidUntil: 0, paymentMethodId: null, card: null, applied: [], updatedAt: Date.now() };
    acc.email = acc.email || email || null;
  } else if (dev) {
    if (dev.lifetime) acc.lifetime = true;
    if ((dev.paidUntil || 0) > (acc.paidUntil || 0)) acc.paidUntil = dev.paidUntil;
    if (dev.paymentMethodId && !acc.paymentMethodId) { acc.paymentMethodId = dev.paymentMethodId; acc.card = dev.card; }
    if (dev.lastPaymentId && !acc.lastPaymentId) acc.lastPaymentId = dev.lastPaymentId;
    const ap = new Set([...(acc.applied || []), ...(dev.applied || [])]);
    acc.applied = [...ap].slice(-50);
    if (email && !acc.email) acc.email = email;
  } else if (email && !acc.email) { acc.email = email; }
  acc.updatedAt = Date.now();
  accounts[acctId] = acc;
  devLink[deviceId] = acctId;
  saveAcc();
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

  app.get('/api/briz/sub/:deviceId', async (req, res) => {
    const d = String(req.params.deviceId);
    if (isDevice(d) && SHOP_ID && SECRET_KEY) { try { await reverify(d); } catch {} }
    res.json(statusOf(d));
  });

  // Webhook — НЕ доверяет телу: берёт id и перепроверяет в ЮKassa.
  // payment.succeeded → начисляем; refund.succeeded → снимаем премиум.
  app.post('/api/briz/webhook', async (req, res) => {
    try {
      const event = req.body && req.body.event;
      const obj = (req.body && req.body.object) || {};
      if (event === 'payment.succeeded' && obj.id) {
        try {
          const pay = await ykGet(String(obj.id).replace(/[^a-zA-Z0-9-]/g, ''));
          if (applyPayment(pay, null)) console.log('[briz] webhook grant:', pay.metadata.deviceId, pay.metadata.plan);
        } catch (e) { console.error('[briz] webhook verify:', e.message); }
      } else if (event === 'refund.succeeded' && obj.payment_id) {
        try {
          const pay = await ykGet(String(obj.payment_id).replace(/[^a-zA-Z0-9-]/g, ''));
          const m = pay && pay.metadata;
          if (m && m.kind === 'briz-sub' && isDevice(m.deviceId)) {
            revoke(m.deviceId);
            console.log('[briz] webhook refund → revoke:', m.deviceId);
          }
        } catch (e) { console.error('[briz] webhook refund verify:', e.message); }
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
      const scan = (s) => {
        if (s && s.email && s.email.toLowerCase() === String(email).toLowerCase() && (s.lifetime || s.paidUntil > now)) {
          if (!best || (s.lifetime ? Infinity : s.paidUntil) > (best.lifetime ? Infinity : best.paidUntil)) best = s;
        }
      };
      for (const k of Object.keys(subs)) scan(subs[k]);
      for (const k of Object.keys(accounts)) scan(accounts[k]);
      if (best) { putRec(deviceId, { ...best, applied: [], updatedAt: now }); }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Отменить подписку НА СВОЁМ устройстве: снимает премиум (после возврата /
  // по желанию). Безопасно — затрагивает только своё устройство.
  app.post('/api/briz/forget', (req, res) => {
    try {
      const { deviceId } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      revoke(deviceId);
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
      const s = getRec(deviceId);
      if (s) { s.paymentMethodId = null; s.card = null; s.updatedAt = Date.now(); putRec(deviceId, s); }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Вход через Apple: приложение присылает identityToken (+ email при первом
  // входе). Сервер проверяет токен по ключам Apple, привязывает устройство к
  // аккаунту apple:<sub> и возвращает статус (восстановление подписки).
  app.post('/api/briz/auth/apple', async (req, res) => {
    try {
      const { deviceId, identityToken, email } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      if (!identityToken) return res.status(400).json({ error: 'no token' });
      let v;
      try { v = await verifyApple(identityToken); }
      catch (e) { return res.status(401).json({ error: 'apple verify failed: ' + e.message }); }
      linkDeviceToAccount(deviceId, 'apple:' + v.sub, v.email || email || null);
      console.log('[briz] apple sign-in → apple:' + v.sub.slice(0, 8) + '…');
      res.json(statusOf(deviceId));
    } catch (e) {
      console.error('[briz] auth/apple:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Выход: отвязать устройство от аккаунта (подписка остаётся на аккаунте).
  app.post('/api/briz/auth/signout', (req, res) => {
    try {
      const { deviceId } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      if (devLink[deviceId]) { delete devLink[deviceId]; saveAcc(); }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[briz] mounted: POST /api/briz/pay/create · /confirm · /restore · /unbind · /auth/apple · /auth/signout · GET /sub/:id · POST /webhook');
};
