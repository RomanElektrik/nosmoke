// Мини-галерея: оригинал #26 + лучшие вариации в его стиле с понятным смыслом.
const fs = require('fs');
const ref = JSON.parse(fs.readFileSync('design/_style26.json', 'utf8'));
const vars = JSON.parse(fs.readFileSync('design/_s26_var.json', 'utf8')); // 18, 0-based

// порядок показа: {src, idx(1-based в vars) | ref, label, rec}
const PICKS = [
  { ref: true, label: 'Оригинал №26', rec: false },
  { i: 16, label: 'Сигарета перечёркнута', rec: true },
  { i: 18, label: 'Знак «не курить»', rec: true },
  { i: 2,  label: 'Лёгкие · дыхание', rec: true },
  { i: 13, label: 'Лёгкие-крылья · свобода', rec: false },
  { i: 11, label: 'Росток · свежесть', rec: false },
  { i: 10, label: 'Лист', rec: false },
  { i: 1,  label: 'Лёгкие', rec: false },
  { i: 14, label: 'Лёгкие · форма', rec: false },
];

function ns(svg, p) {
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    svg = svg.replace(new RegExp('id="' + e + '"', 'g'), 'id="' + p + id + '"')
             .replace(new RegExp('url\\(#' + e + '\\)', 'g'), 'url(#' + p + id + ')');
  }
  return svg;
}
function esc(s){return String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

let cards = '';
PICKS.forEach((p, k) => {
  const ic = p.ref ? ref : vars[p.i - 1];
  if (!ic) return;
  const num = k + 1;
  const svg = ns(ic.svg, 'g' + num + '_');
  cards +=
    '<figure class="card' + (p.rec ? ' rec' : '') + '" data-num="' + num + '">' +
      '<div class="stage"><div class="icon">' + svg + '</div><span class="badge">' + num + '</span>' + (p.rec ? '<span class="star-rec">★</span>' : '') + '</div>' +
      '<figcaption><div class="nm">' + esc(p.label) + '</div>' +
      '<div class="row"><button class="fav">☆ В избранное</button><button class="dl">SVG</button></div></figcaption>' +
    '</figure>';
});

const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Бриз — стиль №26, понятнее</title>
<style>
  :root{--icon:170px;--accent:#7fe3c4;}*{box-sizing:border-box;}
  body{margin:0;font-family:-apple-system,"SF Pro Display",system-ui,sans-serif;background:radial-gradient(1100px 600px at 80% -10%,#13202b,#0a0c10 55%),#0a0c10;color:#e9eef4;}
  body.light{background:#eef1f6;color:#11151b;}
  header{position:sticky;top:0;z-index:9;backdrop-filter:blur(14px);background:rgba(10,12,16,.72);border-bottom:1px solid rgba(255,255,255,.08);padding:15px 22px;}
  body.light header{background:rgba(255,255,255,.8);}
  .h-row{display:flex;align-items:center;gap:18px;flex-wrap:wrap;}
  h1{font-size:18px;font-weight:800;margin:0;letter-spacing:-.3px;}h1 small{font-weight:500;color:#8a94a3;font-size:13px;margin-left:8px;}
  .controls{display:flex;align-items:center;gap:16px;margin-left:auto;}
  .ctl{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#9aa4b2;}
  input[type=range]{accent-color:var(--accent);width:140px;}
  .toggle{cursor:pointer;border:1px solid rgba(255,255,255,.16);background:transparent;color:inherit;padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:600;}
  #favs{font-size:12.5px;color:var(--accent);margin-top:10px;min-height:16px;font-weight:600;}
  main{padding:24px 22px 80px;max-width:1180px;margin:0 auto;}
  .hint{color:#79838f;font-size:13px;margin:0 0 22px;line-height:1.6;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;}
  .card{position:relative;background:#11161e;border:1px solid #1d242e;border-radius:20px;padding:16px;transition:.16s;}
  body.light .card{background:#fff;border-color:#e4e8ee;}
  .card:hover{transform:translateY(-3px);border-color:#2c3744;}
  .card.rec{border-color:rgba(127,227,196,.5);}
  .card.fav{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 12px 30px rgba(127,227,196,.2);}
  .stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:210px;padding:10px;cursor:pointer;}
  .icon{width:var(--icon);height:var(--icon);border-radius:22.6%;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.42);transition:width .12s,height .12s;}
  .icon svg{width:100%;height:100%;display:block;}
  .badge{position:absolute;top:6px;left:6px;font-size:11px;font-weight:800;background:rgba(0,0,0,.55);color:#fff;border-radius:999px;padding:3px 9px;}
  .card.fav .badge{background:var(--accent);color:#04231b;}
  .star-rec{position:absolute;top:6px;right:6px;font-size:13px;color:#ffd24a;}
  .nm{font-size:13.5px;font-weight:700;margin-top:10px;}
  .row{display:flex;gap:8px;margin-top:12px;}
  .row button{flex:1;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:inherit;border-radius:10px;padding:8px 6px;font-size:11.5px;font-weight:600;}
  body.light .row button{border-color:rgba(0,0,0,.1);background:rgba(0,0,0,.02);}
  .row button:hover{background:rgba(127,227,196,.15);border-color:var(--accent);}
  .fav.on{background:rgba(127,227,196,.2);border-color:var(--accent);color:var(--accent);}
</style></head><body>
<header><div class="h-row"><h1>Стиль №26 — понятнее <small>★ = ясно про «бросить курить»</small></h1>
<div class="controls"><label class="ctl">Размер <input id="size" type="range" min="56" max="240" value="170"></label>
<button class="toggle" id="bg">☀️ Светлый</button></div></div>
<div id="favs">Клик по иконке — в избранное, снизу номера.</div></header>
<main><p class="hint">Тот же стиль, что у №26 (тиловый градиент + мятно-зелёные фигуры), но теперь читается, что это про отказ от курения. ★ — где смысл самый явный. Ползунок — проверь мелкий размер. Скажи номер — доведу.</p>
<div class="grid">${cards}</div></main>
<script>
(function(){var favs=new Set();function upd(){var a=[...favs].sort((x,y)=>x-y);document.getElementById('favs').textContent=a.length?('Избранные: '+a.join(', ')):'Клик по иконке — в избранное, снизу номера.';}
document.querySelectorAll('.card').forEach(function(c){var n=+c.dataset.num,st=c.querySelector('.stage'),f=c.querySelector('.fav'),d=c.querySelector('.dl');function t(){if(favs.has(n)){favs.delete(n);c.classList.remove('fav');f.classList.remove('on');f.textContent='☆ В избранное';}else{favs.add(n);c.classList.add('fav');f.classList.add('on');f.textContent='★ В избранном';}upd();}st.addEventListener('click',t);f.addEventListener('click',function(e){e.stopPropagation();t();});d.addEventListener('click',function(e){e.stopPropagation();var s=new XMLSerializer().serializeToString(c.querySelector('svg'));if(s.indexOf('xmlns=')<0)s=s.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');var b=new Blob([s],{type:'image/svg+xml'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='briz-s26-'+n+'.svg';document.body.appendChild(a);a.click();document.body.removeChild(a);});});
document.getElementById('size').addEventListener('input',e=>document.documentElement.style.setProperty('--icon',e.target.value+'px'));
document.getElementById('bg').addEventListener('click',function(){document.body.classList.toggle('light');this.textContent=document.body.classList.contains('light')?'🌙 Тёмный':'☀️ Светлый';});})();
</script></body></html>`;
fs.writeFileSync('design/icons-style26.html', html);
console.log('wrote design/icons-style26.html');
