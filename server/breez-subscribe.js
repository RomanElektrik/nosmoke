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
const DATA_DIR = path.join(__dirname, 'data');
const STORE = path.join(DATA_DIR, 'briz-subs.json');
const RETURN_URL = process.env.BRIZ_RETURN_URL || 'https://breezapp.ru/pay-ok.html';
const LIFETIME_UNTIL = 4102444800000; // 2100-01-01 — отображаемая «дата» для навсегда
const TRIAL_DAYS = 7; // пробный период: полный премиум бесплатно
const TRIAL_BIND_AMOUNT = 1; // ₽ — привязка карты под триал; сразу возвращается (триал бесплатный)

const PLANS = {
  monthly:  { amount: 399,  days: 30,  title: 'Бриз Премиум — месяц' },
  yearly:   { amount: 1990, days: 365, title: 'Бриз Премиум — год' },
  lifetime: { amount: 490,  days: 0,   title: 'Бриз Премиум — навсегда', lifetime: true },
};
// Белый список оплачиваемых планов — публичный API не должен принимать
// служебные ключи (раньше утекал тестовый план 10 ₽).
// Только lifetime: monthly/yearly убраны — модель без рекуррента. Их платежи
// сохраняли карту (save_payment_method), и «висячие» записи начали бы списываться,
// если когда-нибудь снова включить renewSweep.
const PAY_PLANS = ['lifetime'];
const RECUR_PLANS = ['monthly', 'yearly']; // только эти сохраняют способ для автопродления

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
    // lifetime перекрывает исторический plan записи: reverify докидывает флаг
    // lifetime к бывшему trial/monthly, и клиент иначе показывал
    // «Пробный период · осталось 26 800 дн.» (дни до 2100 года).
    plan: s ? (s.lifetime ? 'lifetime' : s.plan) : null,
    card: (s && s.paymentMethodId && s.card) ? s.card : null, // привязанная карта для автопродления
    autopay: !!(s && s.paymentMethodId),
    account: h.acct ? ((s && s.email) || h.key) : null, // вошёл ли в аккаунт и под кем
    trialUsed: !!(s && s.trialUsed), // пробный период уже брался (чтобы не выдать повторно)
    trialActive: !!(s && s.plan === 'trial'), // сейчас идёт пробный с привязанной картой
    renewPlan: (s && s.renewPlan) || null, // что спишется после триала (monthly/yearly)
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

// Снять премиум по ВЛАДЕЛЬЦУ записи (ownerKey из metadata.owner рекуррентного
// платежа). Для продлений deviceId в metadata нет — есть owner (ключ store:
// deviceId или accountId). Используется webhook'ом возврата.
function revokeByOwner(ownerKey) {
  const rec = accounts[ownerKey] || subs[ownerKey];
  if (!rec) return false;
  rec.paidUntil = Date.now() - 1000;
  rec.lifetime = false;
  rec.paymentMethodId = null;
  rec.card = null;
  rec.updatedAt = Date.now();
  if (accounts[ownerKey]) saveAcc(); else saveStore(subs);
  return true;
}

async function ykCreate({ amount, description, deviceId, plan, email }) {
  const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  const body = {
    amount: { value: amount.toFixed(2), currency: 'RUB' },
    capture: true,
    description,
    confirmation: { type: 'redirect', return_url: RETURN_URL + '?d=' + encodeURIComponent(deviceId) },
    save_payment_method: RECUR_PLANS.includes(plan), // сохраняем способ только для продлеваемых планов (monthly/yearly)
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

// Привязка карты под бесплатный триал: платёж на TRIAL_BIND_AMOUNT (1 ₽) с
// сохранением способа (save_payment_method) и форсированной картой — СБП для
// рекуррента ненадёжен, плюс так обходим падение привязки через СБП-банк.
// 1 ₽ возвращается сразу после подтверждения (applyTrialBind → ykRefund).
// renewPlan кладём в metadata — это что спишется ПОСЛЕ 7 дней (не сейчас).
async function ykBindTrial({ deviceId, renewPlan, email }) {
  const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  const body = {
    amount: { value: TRIAL_BIND_AMOUNT.toFixed(2), currency: 'RUB' },
    capture: true,
    save_payment_method: true,
    // Все методы (карта/СБП/SberPay) — пользователь выбирает на странице ЮKassa.
    // Если у метода нет сохранения для рекуррента (СБП-автоплатёж не активирован),
    // applyTrialBind вернёт 1 ₽ и не выдаст «висячий» триал без возможности списать.
    confirmation: { type: 'redirect', return_url: RETURN_URL + '?d=' + encodeURIComponent(deviceId) },
    description: 'Бриз — привязка карты для пробного периода',
    metadata: { kind: 'briz-trial-bind', deviceId, renewPlan, email: validEmail || '' },
  };
  if (validEmail) {
    body.receipt = {
      customer: { email: validEmail },
      items: [{ description: 'Привязка карты', quantity: '1.00', amount: { value: TRIAL_BIND_AMOUNT.toFixed(2), currency: 'RUB' }, vat_code: 1, payment_mode: 'full_payment', payment_subject: 'service' }],
    };
  }
  const r = await fetch(YK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotence-Key': crypto.randomUUID(), 'Authorization': basicAuth() },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!r.ok) { const e = new Error('YK bind: ' + String((json && json.description) || text).slice(0, 300)); e.status = r.status; throw e; }
  return json;
}

// Возврат платежа (для 1 ₽ привязки триала). Идемпотентность по ключу.
async function ykRefund(paymentId, amount) {
  const body = { payment_id: paymentId, amount: { value: Number(amount).toFixed(2), currency: 'RUB' } };
  const r = await fetch('https://api.yookassa.ru/v3/refunds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotence-Key': 'trial-refund-' + paymentId, 'Authorization': basicAuth() },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!r.ok) { const e = new Error('YK refund: ' + String((json && json.description) || text).slice(0, 200)); e.status = r.status; throw e; }
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

// Универсальный «сохранённый способ» из платежа — карта / СБП / SberPay / ЮMoney.
// Для карты есть last4; для СБП/SberPay — только понятное имя. paymentMethodId
// (для автосписания) одинаков для всех; UI показывает то, что есть.
function savedMethodOf(pm) {
  if (!pm || !pm.saved) return null;
  if (pm.card) return { last4: pm.card.last4 || '', type: pm.card.card_type || 'Карта' };
  const ty = pm.type === 'sbp' ? 'СБП'
    : pm.type === 'sber_pay' ? 'SberPay'
    : pm.type === 'yoo_money' ? 'ЮMoney'
    : (pm.title || 'Способ оплаты');
  return { last4: '', type: ty };
}

// Применить платёж к устройству, только если он реально оплачен и его метаданные совпадают.
function applyPayment(pay, expectDevice) {
  const m = pay && pay.metadata;
  if (!pay || pay.status !== 'succeeded' || !pay.paid) return false;
  if (!m || m.kind !== 'briz-sub' || !PLANS[m.plan]) return false;
  if (!isDevice(m.deviceId)) return false;
  if (expectDevice && m.deviceId !== expectDevice) return false;
  const pm = pay.payment_method;
  const method = savedMethodOf(pm);
  grant(m.deviceId, m.plan, pay.id, pm && pm.saved ? pm.id : null, m.email || undefined, method);
  return true;
}

// Применить ПРИВЯЗКУ КАРТЫ под триал (kind='briz-trial-bind'). Выдаёт 7 дней
// премиума на 7 дней. Модель «7 дней за 1 ₽»: 1 ₽ — это цена пробного, НЕ
// возвращаем (так нет возни с лимитами/правами на возврат). Если способ
// сохранился — после 7 дней спишется полная цена renewPlan; если нет — триал
// просто закончится. Идемпотентно по pay.id.
async function applyTrialBind(pay, expectDevice) {
  const m = pay && pay.metadata;
  if (!pay || pay.status !== 'succeeded' || !pay.paid) return false;
  if (!m || m.kind !== 'briz-trial-bind' || !PLANS[m.renewPlan]) return false;
  if (!isDevice(m.deviceId)) return false;
  if (expectDevice && m.deviceId !== expectDevice) return false;
  const cur = getRec(m.deviceId);
  // Уже применён этот платёж — выходим (без повторного начисления).
  if (cur && Array.isArray(cur.applied) && cur.applied.includes(pay.id)) return true;
  const pm = pay.payment_method;
  const saved = !!(pm && pm.saved && pm.id);
  const method = saved ? savedMethodOf(pm) : ((cur && cur.card) || null);
  const now = Date.now();
  putRec(m.deviceId, {
    ...(cur || {}),
    plan: 'trial',
    lifetime: false,
    paidUntil: now + TRIAL_DAYS * 86400_000,
    trialUsed: true,
    renewPlan: m.renewPlan,                 // что спишется ПОСЛЕ триала
    paymentMethodId: saved ? pm.id : ((cur && cur.paymentMethodId) || null),
    card: method,
    email: m.email || (cur && cur.email) || undefined,
    bindPaymentId: pay.id,
    applied: [...((cur && cur.applied) || []), pay.id].slice(-50),
    trialChargeDone: false,
    lastRenewAt: 0,
    updatedAt: now,
  });
  console.log('[briz] trial 1₽:', m.deviceId.slice(0, 8) + '… →', m.renewPlan, saved ? '+card' : '(no recur)');
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
  // Триал: единственный платёж — привязочный 1 ₽, который мы САМИ вернули.
  // Не проверяем его на возврат, иначе снимем честный премиум триала.
  if (s && s.plan === 'trial') return;
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
  if (!auds.includes(APPLE_AUD)) throw new Error('bad aud: got=' + JSON.stringify(payload.aud) + ' want=' + APPLE_AUD);
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
  // Аккаунт — единый источник: убираем продублированную запись устройства, иначе
  // после выхода statusOf откатится на неё и покажет «призрачный» премиум.
  if (subs[deviceId]) { delete subs[deviceId]; saveStore(subs); }
}

// ── Автопродление (рекуррент) ───────────────────────────────────────────────
// Списываем сохранённую карту (payment_method_id) перед концом периода. Платёж
// merchant-initiated: без 3DS и подтверждения. Идемпотентность по периоду —
// один платёж на одно продление. Записи (subs + accounts) проходим ежечасно.
async function ykChargeSaved(pmId, amount, description, ownerKey, plan, email, periodStamp) {
  const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  const body = {
    amount: { value: amount.toFixed(2), currency: 'RUB' },
    capture: true,
    payment_method_id: pmId,
    description,
    metadata: { kind: 'briz-sub-renew', owner: ownerKey, plan },
  };
  if (validEmail) {
    body.receipt = {
      customer: { email: validEmail },
      items: [{ description: description.slice(0, 128), quantity: '1.00', amount: { value: amount.toFixed(2), currency: 'RUB' }, vat_code: 1, payment_mode: 'full_payment', payment_subject: 'service' }],
    };
  }
  const r = await fetch(YK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotence-Key': 'renew-' + ownerKey + '-' + periodStamp, 'Authorization': basicAuth() },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!r.ok) { const e = new Error('YK charge: ' + String((json && json.description) || text).slice(0, 200)); e.status = r.status; throw e; }
  return json;
}

// Продлить запись после успешного списания.
function extendRecord(rec, plan, paymentId, card) {
  const p = PLANS[plan]; if (!p) return;
  const now = Date.now();
  rec.paidUntil = (rec.paidUntil > now ? rec.paidUntil : now) + p.days * 86400_000;
  rec.lastPaymentId = paymentId || rec.lastPaymentId;
  if (card) rec.card = card;
  rec.applied = (paymentId ? [...(rec.applied || []), paymentId] : (rec.applied || [])).slice(-50);
  rec.lastRenewAt = now;
  rec.updatedAt = now;
}

async function renewSweep() {
  return; // 🔴 АВТОПРОДЛЕНИЕ ОТКЛЮЧЕНО: модель перешла на разовый «Навсегда» (lifetime-only).
          // Рекуррента больше нет — ни одной попытки списания по сохранённой карте.
          // Старые monthly/yearly доживают оплаченный период и лапсятся (премиум не снимаем).
  // eslint-disable-next-line no-unreachable
  if (!SHOP_ID || !SECRET_KEY) return;
  const now = Date.now();
  let dSubs = false, dAcc = false;
  const items = [
    ...Object.keys(subs).map((k) => ({ store: 'subs', key: k, rec: subs[k] })),
    ...Object.keys(accounts).map((k) => ({ store: 'acc', key: k, rec: accounts[k] })),
  ];
  for (const { store, key, rec } of items) {
    if (!rec || rec.lifetime || !rec.paymentMethodId) continue;

    // Триал с привязанной картой: в МОМЕНТ конца триала списываем ПОЛНУЮ цену
    // renewPlan (не за сутки до — это был бы день 6), затем переводим запись в
    // реальный план. Идемпотентность списания — по periodStamp=paidUntil.
    if (rec.plan === 'trial' && !rec.trialChargeDone) {
      const rp = PLANS[rec.renewPlan];
      if (!rp || rp.lifetime || !rp.days) continue;
      if (now < rec.paidUntil) continue;                     // триал ещё идёт
      if (now > rec.paidUntil + 5 * 86400_000) continue;     // поздно — пусть лапсится
      if (rec.lastRenewAt && now - rec.lastRenewAt < 12 * 3600_000) continue; // троттл
      rec.lastRenewAt = now;
      if (store === 'subs') { dSubs = true; saveStore(subs); } else { dAcc = true; saveAcc(); } // фиксируем троттл ДО списания
      try {
        const pay = await ykChargeSaved(rec.paymentMethodId, rp.amount, rp.title, key, rec.renewPlan, rec.email, rec.paidUntil);
        if (pay && pay.status === 'succeeded' && pay.paid) {
          const card = savedMethodOf(pay.payment_method) || rec.card;
          rec.plan = rec.renewPlan;       // триал → реальный план
          rec.trialChargeDone = true;
          extendRecord(rec, rec.renewPlan, pay.id, card);
          console.log('[briz] trial→paid:', key.slice(0, 8) + '…', rec.renewPlan);
        }
      } catch (e) { console.error('[briz] trial charge fail:', key.slice(0, 8) + '…', e.message); }
      continue;
    }

    const p = PLANS[rec.plan];
    if (!p || p.lifetime || !p.days) continue;
    if (now < rec.paidUntil - 86400_000) continue;        // рано — продлеваем за сутки до конца
    if (now > rec.paidUntil + 5 * 86400_000) continue;    // поздно — пусть лапсится, не списываем
    if (rec.lastRenewAt && now - rec.lastRenewAt < 12 * 3600_000) continue; // троттл попыток
    rec.lastRenewAt = now;
    if (store === 'subs') { dSubs = true; saveStore(subs); } else { dAcc = true; saveAcc(); } // фиксируем троттл ДО списания
    try {
      const pay = await ykChargeSaved(rec.paymentMethodId, p.amount, p.title, key, rec.plan, rec.email, rec.paidUntil);
      if (pay && pay.status === 'succeeded' && pay.paid) {
        const card = savedMethodOf(pay.payment_method) || rec.card;
        extendRecord(rec, rec.plan, pay.id, card);
        console.log('[briz] renewed:', key.slice(0, 8) + '…', rec.plan);
      }
    } catch (e) { console.error('[briz] renew fail:', key.slice(0, 8) + '…', e.message); }
  }
  if (dSubs) saveStore(subs);
  if (dAcc) saveAcc();
}
// 🔴 Планировщики автопродления ОТКЛЮЧЕНЫ (lifetime-only). Раньше:
// setInterval(() => { renewSweep().catch(() => {}); }, 60 * 60 * 1000); // ежечасно
// setTimeout(() => { renewSweep().catch(() => {}); }, 8000); // и вскоре после старта

module.exports = function attach(app) {
  // Идемпотентность: mount может прийти и строкой в server.js, и из
  // briz-preload.js (страховка от перезаписи server.js) — вешаемся один раз.
  if (app.__brizMounted) return; app.__brizMounted = true;
  // Свой body-parser на нашем префиксе: mount может случиться ДО глобального
  // express.json() в server.js (например из briz-preload при создании app) —
  // тогда req.body у всех briz-POST был бы undefined и оплата/триал ложились
  // с «bad payload». Дубль парсера безопасен (второй просто пропускает).
  try { app.use('/api/briz', require('express').json({ limit: '300kb' })); } catch (e) { console.error('[briz] json mw:', e.message); }
  if (!SHOP_ID || !SECRET_KEY) console.warn('[briz] YOOKASSA keys missing — /api/briz/* вернёт 503');

  app.post('/api/briz/pay/create', async (req, res) => {
    try {
      if (!SHOP_ID || !SECRET_KEY) return res.status(503).json({ error: 'not configured' });
      const { deviceId, plan, email } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      const P = PAY_PLANS.includes(plan) ? PLANS[plan] : null; if (!P) return res.status(400).json({ error: 'bad plan' });
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
      const P = PAY_PLANS.includes(plan) ? PLANS[plan] : null; if (!P) return res.status(400).json({ error: 'bad plan' });
      if (!paymentToken || typeof paymentToken !== 'string') return res.status(400).json({ error: 'bad token' });
      const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
      const body = {
        amount: { value: P.amount.toFixed(2), currency: 'RUB' },
        capture: true,
        payment_token: paymentToken,
        description: P.title,
        save_payment_method: RECUR_PLANS.includes(plan), // сохраняем способ только для продлеваемых планов (monthly/yearly)
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
      try { await applyTrialBind(pay, deviceId); } catch (e) { console.error('[briz] trial bind confirm:', e.message); }
      res.json(statusOf(deviceId));
    } catch (e) {
      console.error('[briz] confirm:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Анонимная продукт-аналитика ────────────────────────────────────────────
  // Приём батчей событий из приложения. Никакой персоналки: deviceId (анонимный
  // uuid) + имя события + ts. Пишем в дневные JSONL-файлы data/briz-events-*.jsonl
  // (append-only, атомарность не критична). Разбор — офлайн-скриптами.
  const EV_NAME = /^[a-z0-9_]{2,40}$/;
  app.post('/api/briz/events', (req, res) => {
    try {
      const { deviceId, platform, events } = req.body || {};
      if (!isDevice(deviceId) || !Array.isArray(events)) return res.status(400).json({ error: 'bad payload' });
      const now = Date.now();
      const rows = [];
      for (const e of events.slice(0, 100)) {
        if (!e || typeof e.n !== 'string' || !EV_NAME.test(e.n)) continue;
        const ts = Number(e.ts);
        rows.push(JSON.stringify({
          d: deviceId, n: e.n,
          ts: Number.isFinite(ts) && ts > 1700000000000 && ts < now + 86400000 ? ts : now,
          pf: platform === 'android' ? 'a' : platform === 'web' ? 'w' : 'i',
          ...(e.p && typeof e.p === 'object' ? { p: e.p } : {}),
        }));
      }
      if (rows.length) {
        const day = new Date().toISOString().slice(0, 10);
        fs.appendFileSync(path.join(DATA_DIR, `briz-events-${day}.jsonl`), rows.join('\n') + '\n');
      }
      res.json({ ok: true, accepted: rows.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Дашборд аналитики — отдельный модуль (см. server/briz-stats.js).
  try { require('./briz-stats.js')(app, DATA_DIR); } catch (e) { console.error('[briz] stats mount failed:', e.message); }

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
          else if (await applyTrialBind(pay, null)) console.log('[briz] webhook trial bound:', pay.metadata.deviceId);
        } catch (e) { console.error('[briz] webhook verify:', e.message); }
      } else if (event === 'refund.succeeded' && obj.payment_id) {
        try {
          const pay = await ykGet(String(obj.payment_id).replace(/[^a-zA-Z0-9-]/g, ''));
          const m = pay && pay.metadata;
          if (m && m.kind === 'briz-sub' && isDevice(m.deviceId)) {
            revoke(m.deviceId);
            console.log('[briz] webhook refund → revoke device:', m.deviceId);
          } else if (m && m.kind === 'briz-sub-renew' && m.owner) {
            // Возврат за ПРОДЛЕНИЕ (deviceId нет, есть owner) — снимаем по владельцу.
            if (revokeByOwner(m.owner)) console.log('[briz] webhook refund → revoke owner:', m.owner.slice(0, 8) + '…');
          }
          // briz-trial-bind (1 ₽ привязки) НЕ ревокаем — это наш собственный возврат.
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
      // Не понижаем уже имеющуюся подписку: применяем найденную по email только
      // если она СТРОГО лучше текущей (дольше/lifetime). Иначе restore слабой
      // подпиской затёр бы более сильную локальную.
      if (best) {
        const cur = getRec(deviceId);
        const curUntil = cur ? (cur.lifetime ? Infinity : (cur.paidUntil || 0)) : 0;
        const bestUntil = best.lifetime ? Infinity : (best.paidUntil || 0);
        if (bestUntil > curUntil) putRec(deviceId, { ...best, applied: [], updatedAt: now });
      }
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
      catch (e) { console.warn('[briz] apple verify fail:', e.message); return res.status(401).json({ error: 'apple verify failed: ' + e.message }); }
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
      if (devLink[deviceId]) {
        // Перед отвязкой копируем право доступа аккаунта обратно на устройство:
        // иначе после выхода statusOf(deviceId) видел бы пустоту, клиент получал
        // авторитетный premium:false и затирал оплаченный lifetime — «купил →
        // вышел из Apple → премиум пропал».
        const acc = accounts[devLink[deviceId]];
        if (acc && (acc.lifetime || (acc.paidUntil || 0) > Date.now())) {
          subs[deviceId] = {
            plan: acc.plan, lifetime: !!acc.lifetime, paidUntil: acc.paidUntil || 0,
            paymentMethodId: null, card: null, applied: [...(acc.applied || [])].slice(-50),
            lastPaymentId: acc.lastPaymentId || null, email: acc.email || null,
            trialUsed: acc.trialUsed, updatedAt: Date.now(),
          };
          saveStore(subs);
        }
        delete devLink[deviceId]; saveAcc();
      }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Удаление аккаунта (App Review 5.1.1(v)): стираем Apple-аккаунт и все связки
  // устройств с ним. Запись самого устройства не трогаем — оплаченный доступ,
  // если он был локальным, у юзера остаётся (удаление аккаунта ≠ отзыв покупки).
  app.post('/api/briz/account/delete', (req, res) => {
    try {
      const { deviceId } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      const acctId = devLink[deviceId];
      if (acctId) {
        // Право доступа аккаунта возвращаем на устройство (как в signout) —
        // удаление аккаунта не должно сжигать оплаченный lifetime.
        const acc = accounts[acctId];
        if (acc && (acc.lifetime || (acc.paidUntil || 0) > Date.now()) && !subs[deviceId]) {
          subs[deviceId] = {
            plan: acc.plan, lifetime: !!acc.lifetime, paidUntil: acc.paidUntil || 0,
            paymentMethodId: null, card: null, applied: [...(acc.applied || [])].slice(-50),
            lastPaymentId: acc.lastPaymentId || null, email: null,
            trialUsed: acc.trialUsed, updatedAt: Date.now(),
          };
          saveStore(subs);
        }
        delete accounts[acctId];
        for (const d of Object.keys(devLink)) if (devLink[d] === acctId) delete devLink[d];
        saveAcc();
        console.log('[briz] account deleted:', String(acctId).slice(0, 14) + '…');
      }
      res.json({ ok: true, deleted: !!acctId });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Пробный период С ПРИВЯЗКОЙ КАРТЫ (основной путь): создаём привязочный платёж
  // на 1 ₽ с сохранением карты. Премиум и trialUsed выставляются НЕ здесь, а
  // только после подтверждённой привязки (applyTrialBind в /confirm и webhook) —
  // чтобы сбой 3DS не сжёг единственную попытку триала. plan = что спишется
  // ПОСЛЕ 7 дней (monthly/yearly). 1 ₽ возвращается сразу при подтверждении.
  app.post('/api/briz/trial/bind', async (req, res) => {
    try {
      if (!SHOP_ID || !SECRET_KEY) return res.status(503).json({ error: 'not configured' });
      const { deviceId, plan, email } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      const renewPlan = (plan === 'monthly' || plan === 'yearly') ? plan : 'yearly';
      const now = Date.now();
      const cur = getRec(deviceId);
      const isPremium = !!(cur && (cur.lifetime || cur.paidUntil > now));
      // Идемпотентность: уже премиум или триал брался — не создаём платёж.
      if (isPremium || (cur && cur.trialUsed)) return res.json(statusOf(deviceId));
      const payment = await ykBindTrial({ deviceId, renewPlan, email });
      res.json({ id: payment.id, status: payment.status, confirmation_url: payment?.confirmation?.confirmation_url || null });
    } catch (e) {
      console.error('[briz] trial/bind:', e.message);
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // Пробный период БЕЗ карты (legacy-фолбэк для старых билдов). Новый клиент
  // использует /trial/bind. Идемпотентно по trialUsed.
  app.post('/api/briz/trial/start', (req, res) => {
    try {
      const { deviceId } = req.body || {};
      if (!isDevice(deviceId)) return res.status(400).json({ error: 'bad deviceId' });
      const now = Date.now();
      const cur = getRec(deviceId);
      const isPremium = !!(cur && (cur.lifetime || cur.paidUntil > now));
      if (!isPremium && !(cur && cur.trialUsed)) {
        putRec(deviceId, {
          ...(cur || {}),
          plan: 'trial',
          lifetime: false,
          paidUntil: now + TRIAL_DAYS * 86400_000,
          trialUsed: true,
          applied: (cur && cur.applied) || [],
          updatedAt: now,
        });
        console.log('[briz] trial started:', deviceId.slice(0, 8) + '…');
      }
      res.json(statusOf(deviceId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[briz] mounted: POST /api/briz/pay/create · /confirm · /restore · /unbind · /auth/apple · /auth/signout · /trial/bind · /trial/start · GET /sub/:id · POST /webhook · авто-продление: ОТКЛ (lifetime-only)');
};
