// ИИ-прокси для «Бриза».
//
// ЗАЧЕМ: OpenRouter отдаёт 403 «Access denied by security policy» на российские
// IP. Приложение ходило в OpenRouter НАПРЯМУЮ с телефона — значит у всех русских
// юзеров без VPN чат не работал никогда («не получилось отправить, проверь
// интернет»). Теперь телефон обращается сюда, а сервер идёт в OpenRouter через
// тот же HTTPS-прокси, которым уже пользуется чат «Свечи» на этой машине.
//
// Побочный плюс: ключ OpenRouter перестаёт уезжать внутрь приложения (раньше он
// был вшит в бандл и извлекаем).
//
// Контракт (его ждёт lib/ai.ts → callProxy):
//   POST /api/briz/ai   { messages: [{role, content}], locale }
//   →  { content: "..." }
const { HttpsProxyAgent } = require('https-proxy-agent');
// ВАЖНО: именно node-fetch. Встроенный fetch в Node молча ИГНОРИРУЕТ опцию
// `agent`, поэтому запрос уходил напрямую и OpenRouter отдавал 403 из РФ.
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));

module.exports = function attachAi(app) {
  if (app.__brizAiMounted) return;
  app.__brizAiMounted = true;

  const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || null;
  // Свой ключ Бриза, иначе — общий ключ этой машины (тот же, что у Свечи).
  const KEY = process.env.BRIZ_OPENROUTER_KEY || process.env.OPENROUTER_KEY_1 || process.env.OPENROUTER_KEY_2 || '';
  const MODEL = process.env.BRIZ_AI_MODEL || 'google/gemini-2.5-flash-lite';
  const FALLBACK = 'openai/gpt-4o-mini';
  const APP_KEY = process.env.BRIZ_AI_APP_KEY || ''; // если задан — требуем заголовок x-app-key
  const MAX_TOKENS = 600;

  // Грубая защита от чужого трафика: не больше N запросов в минуту с одного IP.
  const hits = new Map();
  const LIMIT = 20, WINDOW = 60_000;
  function overLimit(ip) {
    const now = Date.now();
    const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
    arr.push(now);
    hits.set(ip, arr);
    if (hits.size > 5000) hits.clear(); // не растим память бесконечно
    return arr.length > LIMIT;
  }

  async function ask(messages, model) {
    const opts = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://breezapp.ru',
        'X-Title': 'Breeze',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: MAX_TOKENS }),
    };
    if (PROXY) opts.agent = new HttpsProxyAgent(PROXY); // без него из РФ будет 403
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', opts);
    const text = await r.text();
    let j = null;
    try { j = JSON.parse(text); } catch {}
    if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
    return j?.choices?.[0]?.message?.content || '';
  }

  app.post('/api/briz/ai', async (req, res) => {
    try {
      if (APP_KEY && req.get('x-app-key') !== APP_KEY) return res.status(403).json({ error: 'forbidden' });
      const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
      if (overLimit(ip)) return res.status(429).json({ error: 'too many requests' });

      const { messages } = req.body || {};
      if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages required' });
      // Обрезаем то, что явно не наше: длинные хвосты историй и мусорные роли.
      const clean = messages
        .filter((m) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role))
        .slice(-30)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
      if (!clean.length) return res.status(400).json({ error: 'bad messages' });
      if (!KEY) return res.status(500).json({ error: 'no upstream key' });

      let content;
      try {
        content = await ask(clean, MODEL);
      } catch (e) {
        console.error('[briz-ai] primary failed:', e.message);
        content = await ask(clean, FALLBACK); // вторая попытка другой моделью
      }
      res.json({ content });
    } catch (e) {
      console.error('[briz-ai] error:', e.message);
      res.status(502).json({ error: e.message });
    }
  });

  console.log(`[briz] ai proxy: POST /api/briz/ai · модель ${MODEL} · прокси ${PROXY ? 'ВКЛ' : 'ВЫКЛ (из РФ будет 403!)'}`);
};
