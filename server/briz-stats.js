// Дашборд продуктовой аналитики «Бриз».
// GET /api/briz/stats?key=… — живая HTML-страница (открывается с телефона).
// Считает на лету из тех же JSONL, что пишет /api/briz/events. Базы не нужно.
// Ключ генерируется САМ при первом обращении в data/stats-key.txt — в .env лезть
// не надо; узнать его: cat /root/svecha-server/data/stats-key.txt
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function attachStats(app, DATA_DIR) {
  const KEY_FILE = path.join(DATA_DIR, 'stats-key.txt');

  function statsKey() {
    try {
      const k = fs.readFileSync(KEY_FILE, 'utf8').trim();
      if (k) return k;
    } catch {}
    const k = crypto.randomBytes(16).toString('hex');
    try { fs.writeFileSync(KEY_FILE, k); } catch {}
    return k;
  }

  const dayStart = (ts) => { const d = new Date(ts); d.setUTCHours(0, 0, 0, 0); return d.getTime(); };

  function loadEvents(days) {
    const cutoff = Date.now() - days * 86400000;
    const rows = [];
    let files = [];
    try { files = fs.readdirSync(DATA_DIR).filter((f) => /^briz-events-\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)); } catch {}
    for (const f of files.sort()) {
      let txt = '';
      try { txt = fs.readFileSync(path.join(DATA_DIR, f), 'utf8'); } catch { continue; }
      for (const line of txt.split('\n')) {
        if (!line.trim()) continue;
        try {
          const e = JSON.parse(line);
          if (e && typeof e.ts === 'number' && e.ts >= cutoff) rows.push(e);
        } catch {}
      }
    }
    return rows;
  }

  function compute(rows) {
    const uniq = (pred) => new Set(rows.filter(pred).map((e) => e.d)).size;
    const funnel = {
      installs: uniq((e) => e.n === 'app_open'),
      onboarded: uniq((e) => e.n === 'onboarding_done'),
      paywall: uniq((e) => e.n === 'paywall_view'),
      trial: uniq((e) => e.n === 'trial_start'),
      paid: uniq((e) => e.n === 'purchase_success' || e.n === 'restore_success'),
    };

    // Удержание: «день N» = календарный сдвиг от первого запуска устройства.
    // Когорту считаем только когда она СОЗРЕЛА (иначе вчерашние юзеры занижают D7).
    const first = new Map();
    for (const e of rows) {
      if (e.n !== 'app_open') continue;
      const cur = first.get(e.d);
      if (cur === undefined || e.ts < cur) first.set(e.d, e.ts);
    }
    const days = new Map();
    for (const e of rows) {
      if (e.n !== 'app_open') continue;
      const idx = Math.round((dayStart(e.ts) - dayStart(first.get(e.d))) / 86400000);
      if (!days.has(e.d)) days.set(e.d, new Set());
      days.get(e.d).add(idx);
    }
    const now = dayStart(Date.now());
    const ret = (n) => {
      let eligible = 0, back = 0;
      for (const [d, f] of first) {
        if (now - dayStart(f) < n * 86400000) continue;
        eligible++;
        if (days.get(d) && days.get(d).has(n)) back++;
      }
      return { eligible, back, pct: eligible ? Math.round((back / eligible) * 1000) / 10 : null };
    };

    const cnt = (n) => rows.filter((e) => e.n === n).length;
    const sos = { opens: cnt('sos_open'), wins: cnt('sos_win'), slips: cnt('slip_logged'), holding: cnt('status_holding') };

    const chapters = {};
    for (const e of rows) if (e.n === 'chapter_read' && e.p && e.p.id) chapters[e.p.id] = (chapters[e.p.id] || 0) + 1;

    const counts = {};
    for (const e of rows) counts[e.n] = (counts[e.n] || 0) + 1;

    return { devices: new Set(rows.map((e) => e.d)).size, events: rows.length, funnel, d1: ret(1), d7: ret(7), sos, chapters, counts };
  }

  const esc = (x) => String(x).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

  function render(s, days, key) {
    const p = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
    const f = s.funnel;
    const step = (label, val, base, color) => `
      <div class="row">
        <div class="lab">${esc(label)}</div>
        <div class="track"><div class="fill" style="width:${base ? Math.max(1.5, (val / base) * 100) : 0}%;background:${color}"></div></div>
        <div class="val">${val}<span class="dim"> · ${p(val, base)}%</span></div>
      </div>`;
    const tbl = (obj, empty) => {
      const e = Object.entries(obj).sort((a, b) => b[1] - a[1]);
      if (!e.length) return `<div class="dim pad">${empty}</div>`;
      return '<table>' + e.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('') + '</table>';
    };
    const retLine = (r, label, bench) => `
      <div class="ret">
        <div class="big">${r.pct === null ? '—' : r.pct + '%'}</div>
        <div class="lab2">${label}<span class="dim"> · когорта ${r.eligible}</span></div>
        <div class="dim sm">медиана App Store ${bench}</div>
      </div>`;

    return `<!doctype html><html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Бриз · статистика</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#0A1D15;color:#E8F0EA;font:15px/1.5 -apple-system,"Segoe UI",Roboto,sans-serif;padding:18px 16px 60px;max-width:720px;margin:0 auto}
  h1{font-size:20px;margin:0 0 2px}
  h2{font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:#7E9A8A;margin:26px 0 10px;font-weight:700}
  .dim{color:#7E9A8A}.sm{font-size:12px}.pad{padding:8px 0}
  .card{background:#0F2A1E;border:1px solid #1D4433;border-radius:14px;padding:14px}
  .row{display:flex;align-items:center;gap:10px;margin:9px 0}
  .lab{width:96px;flex:none;font-size:13px}
  .track{flex:1;height:9px;background:#12352550;border-radius:6px;overflow:hidden}
  .fill{height:100%;border-radius:6px}
  .val{width:82px;text-align:right;font-size:13px;font-variant-numeric:tabular-nums}
  .rets{display:flex;gap:10px}
  .ret{flex:1;background:#0F2A1E;border:1px solid #1D4433;border-radius:14px;padding:14px}
  .big{font-size:28px;font-weight:800;letter-spacing:-1px}
  .lab2{font-size:13px;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td{padding:7px 0;border-bottom:1px solid #1D443340}
  .num{text-align:right;font-variant-numeric:tabular-nums;color:#7ED9AD}
  .tabs{display:flex;gap:8px;margin:12px 0 4px}
  .tab{padding:6px 12px;border-radius:999px;border:1px solid #1D4433;color:#7E9A8A;text-decoration:none;font-size:13px}
  .tab.on{background:#1DB85A;border-color:#1DB85A;color:#04150C;font-weight:700}
</style></head><body>
<h1>Бриз · статистика</h1>
<div class="dim sm">${s.devices} устройств · ${s.events} событий за ${days} дн.</div>
<div class="tabs">
  ${[7, 30, 90].map((d) => `<a class="tab ${d === days ? 'on' : ''}" href="?key=${encodeURIComponent(key)}&days=${d}">${d} дней</a>`).join('')}
</div>

<h2>Воронка до денег</h2>
<div class="card">
  ${step('Запустили', f.installs, f.installs, '#1DB85A')}
  ${step('Прошли онбординг', f.onboarded, f.installs, '#30D158')}
  ${step('Дошли до цены', f.paywall, f.installs, '#0A84FF')}
  ${step('Взяли триал', f.trial, f.installs, '#BF5AF2')}
  ${step('Купили', f.paid, f.installs, '#FF9F0A')}
</div>

<h2>Удержание</h2>
<div class="rets">
  ${retLine(s.d1, 'День 1', '~26%')}
  ${retLine(s.d7, 'День 7', '~10%')}
</div>

<h2>SOS — ядро продукта</h2>
<div class="card">
  ${step('Открыли SOS', s.sos.opens, Math.max(s.sos.opens, 1), '#0A84FF')}
  ${step('Победили тягу', s.sos.wins, Math.max(s.sos.opens, 1), '#1DB85A')}
  ${step('Срывов', s.sos.slips, Math.max(s.sos.opens, 1), '#FF375F')}
  ${step('«Держусь»', s.sos.holding, Math.max(s.sos.opens, 1), '#30D158')}
</div>

<h2>Книга — где бросают читать</h2>
<div class="card">${tbl(s.chapters, 'пока никто не читал')}</div>

<h2>Все события</h2>
<div class="card">${tbl(s.counts, 'событий пока нет — жду сборку 1.0.5')}</div>
</body></html>`;
  }

  app.get('/api/briz/stats', (req, res) => {
    try {
      const key = statsKey();
      if (String(req.query.key || '') !== key) return res.status(403).send('forbidden');
      const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
      const rows = loadEvents(days);
      res.set('Content-Type', 'text/html; charset=utf-8').send(render(compute(rows), days, key));
    } catch (e) {
      res.status(500).send('error: ' + esc(e.message));
    }
  });

  // Сырые события (для разбора скриптом): ?key=…&days=30
  app.get('/api/briz/stats.json', (req, res) => {
    try {
      if (String(req.query.key || '') !== statsKey()) return res.status(403).json({ error: 'forbidden' });
      const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
      res.json(compute(loadEvents(days)));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[briz] stats dashboard: GET /api/briz/stats?key=… (ключ в data/stats-key.txt)');
};
