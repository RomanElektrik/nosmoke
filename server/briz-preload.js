// Страховка от перезаписи server.js: деплой Свечи трижды (22.06, 12.07, 13.07)
// стирал строку монтирования briz-биллинга, и /api/briz/* лежал до ручной починки.
// Этот файл подключается процессу pm2 через node-args "-r /root/svecha-server/briz-preload.js"
// и подменяет module.exports пакета express: каждый созданный app автоматически
// получает briz-роуты (attach идемпотентен). Переживает ЛЮБУЮ перезапись server.js.
// Убрать защиту: pm2 delete svecha && pm2 start server.js --name svecha && pm2 save.
const path = require('path');

try {
  const expressPath = require.resolve('express', { paths: [__dirname] });
  const orig = require(expressPath);
  const subscribePath = path.join(__dirname, 'subscribe.js');

  const patched = function patchedExpress(...args) {
    const app = orig(...args);
    try {
      require(subscribePath)(app);
      console.log('[briz] auto-mounted via preload');
    } catch (e) {
      console.error('[briz] preload mount failed:', e.message);
    }
    return app;
  };
  Object.setPrototypeOf(patched, orig);
  Object.assign(patched, orig); // Router, json, static и прочие статики express

  require.cache[expressPath].exports = patched;
  console.log('[briz] preload armed');
} catch (e) {
  console.error('[briz] preload init failed:', e.message);
}
