// One-shot: inserts the subscribe module require into svecha server.js, after
// the donate require. Idempotent. Run on the server: node patch.js
const fs = require('fs');
const P = '/root/svecha-server/server.js';
let s = fs.readFileSync(P, 'utf8');
if (s.includes("require('./subscribe')")) { console.log('already wired'); process.exit(0); }
const anchor = "try { require('./donate')(app); } catch (e) { console.error('[donate] mount failed:', e.message); }";
if (!s.includes(anchor)) { console.error('ANCHOR NOT FOUND — aborting'); process.exit(1); }
fs.writeFileSync(P + '.bak.briz2.' + Date.now(), s);
const ins = "\ntry { require('./subscribe')(app); } catch (e) { console.error('[briz] mount failed:', e.message); }";
fs.writeFileSync(P, s.replace(anchor, anchor + ins));
console.log('inserted subscribe require');
