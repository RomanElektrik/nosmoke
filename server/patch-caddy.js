// One-shot: route /api/* on breezapp.ru to the Node backend (:3000), keeping the
// static file_server for everything else. Idempotent. Run: node patch-caddy.js
const fs = require('fs');
const P = '/etc/caddy/Caddyfile';
let s = fs.readFileSync(P, 'utf8');
if (s.includes('handle /api/*')) { console.log('already routed'); process.exit(0); }
const oldBlock = `breezapp.ru {
  root * /var/www/breezapp
  encode gzip zstd
  file_server
}`;
if (!s.includes(oldBlock)) { console.error('breezapp.ru block not found as expected — aborting'); process.exit(1); }
const newBlock = `breezapp.ru {
  encode gzip zstd
  handle /api/* {
    reverse_proxy 127.0.0.1:3000
  }
  handle {
    root * /var/www/breezapp
    file_server
  }
}`;
fs.writeFileSync(P + '.bak.briz.' + Date.now(), s);
fs.writeFileSync(P, s.replace(oldBlock, newBlock));
console.log('breezapp.ru: /api/* → :3000 added');
