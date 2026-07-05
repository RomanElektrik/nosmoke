// Собирает финальную галерею 30 лучших иконок Бриз:
// v2-кандидаты + переделанные (по _n), вычищенные от слабых/дублей, с namespace id.
const fs = require('fs');

const v2 = JSON.parse(fs.readFileSync('design/_v2_icons.json', 'utf8'));   // 40, индекс = позиция
const rev = JSON.parse(fs.readFileSync('design/_rev_icons.json', 'utf8')); // 10, ключ _n
const revBy = {}; rev.forEach((r) => { revBy[r._n] = r; });

// Итоговый отбор по нумерации v2 (1-based), сгруппировано. Переделанные подменяются по _n.
const SECTIONS = [
  { key: 'cig',  title: 'Бросить курить',        sub: 'самый понятный смысл', picks: [1, 2, 3, 4, 5, 8] },
  { key: 'mono', title: 'Монограмма «Б»',          sub: 'бренд-марка',           picks: [9, 10, 11, 13, 14, 15, 16] },
  { key: 'lung', title: 'Лёгкие и дыхание',        sub: 'здоровье',              picks: [17, 18, 20, 21, 22, 23, 24] },
  { key: 'leaf', title: 'Свежесть и природа',      sub: 'новая жизнь',           picks: [25, 26, 28, 30, 32] },
  { key: 'abs',  title: 'Современный знак',         sub: 'абстракция',            picks: [33, 34, 35, 36, 40] },
];
const RECOMMEND = new Set([5, 8, 1, 4, 9, 15, 16, 22, 20, 25, 28, 36, 33, 30]); // мои фавориты (по v2-номеру)

function pick(i) { return revBy[i] ? { ...revBy[i], svg: revBy[i].svg.replace(/#16soon/g, '#15333D') } : v2[i - 1]; }
function ns(svg, p) {
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    svg = svg.replace(new RegExp('id="' + e + '"', 'g'), 'id="' + p + id + '"')
             .replace(new RegExp('url\\(#' + e + '\\)', 'g'), 'url(#' + p + id + ')')
             .replace(new RegExp('href="#' + e + '"', 'g'), 'href="#' + p + id + '"');
  }
  return svg;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

let n = 0;
let sectionsHtml = '';
for (const sec of SECTIONS) {
  let cards = '';
  for (const i of sec.picks) {
    const ic = pick(i);
    if (!ic) continue;
    n++;
    const num = n;
    const rec = RECOMMEND.has(i);
    const svg = ns(ic.svg, 'f' + num + '_');
    cards +=
      '<figure class="card' + (rec ? ' rec' : '') + '" data-num="' + num + '">' +
        '<div class="stage"><div class="icon">' + svg + '</div><span class="badge">' + num + '</span>' +
        (rec ? '<span class="star-rec">★</span>' : '') + '</div>' +
        '<figcaption><div class="nm">' + esc((ic.name || '').replace(/^Breeze\s*[—-]\s*/i, '').replace(/_/g, ' ')) + '</div>' +
        '<div class="concept">' + esc((ic.concept || '').slice(0, 140)) + '</div>' +
        '<div class="row"><button class="fav">☆ В избранное</button><button class="dl">SVG</button></div></figcaption>' +
      '</figure>';
  }
  sectionsHtml += '<section><h2>' + esc(sec.title) + ' <small>· ' + esc(sec.sub) + '</small></h2><div class="grid">' + cards + '</div></section>';
}

const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Бриз — финал иконки (${n})</title>
<style>
  :root{--icon:150px;--accent:#1fd3a8;}*{box-sizing:border-box;}
  body{margin:0;font-family:-apple-system,"SF Pro Display","Inter",system-ui,sans-serif;background:radial-gradient(1200px 700px at 80% -10%,#13202b,#0a0c10 55%),#0a0c10;color:#e9eef4;-webkit-font-smoothing:antialiased;}
  body.light{background:#eef1f6;color:#11151b;}
  header{position:sticky;top:0;z-index:20;backdrop-filter:blur(16px);background:rgba(10,12,16,.72);border-bottom:1px solid rgba(255,255,255,.08);padding:16px 22px;}
  body.light header{background:rgba(255,255,255,.8);border-bottom:1px solid rgba(0,0,0,.08);}
  .h-row{display:flex;align-items:center;gap:18px;flex-wrap:wrap;}
  h1{font-size:19px;font-weight:800;letter-spacing:-.4px;margin:0;}h1 small{font-weight:500;color:#8a94a3;font-size:13px;margin-left:8px;}
  .controls{display:flex;align-items:center;gap:18px;margin-left:auto;flex-wrap:wrap;}
  .ctl{display:flex;align-items:center;gap:9px;font-size:12.5px;color:#9aa4b2;}
  input[type=range]{accent-color:var(--accent);width:150px;}
  .toggle{cursor:pointer;border:1px solid rgba(255,255,255,.16);background:transparent;color:inherit;padding:7px 13px;border-radius:999px;font-size:12.5px;font-weight:600;}
  body.light .toggle{border-color:rgba(0,0,0,.16);}
  #favs{font-size:12.5px;color:var(--accent);margin-top:11px;min-height:17px;font-weight:600;}
  main{padding:24px 22px 90px;max-width:1320px;margin:0 auto;}
  .hint{color:#79838f;font-size:13px;margin:0 0 24px;line-height:1.6;}
  section{margin-bottom:42px;}
  h2{font-size:15px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:var(--accent);margin:0 0 16px;}
  h2 small{color:#6b7480;font-weight:600;text-transform:none;letter-spacing:0;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(212px,1fr));gap:18px;}
  .card{position:relative;background:#11161e;border:1px solid #1d242e;border-radius:20px;padding:16px;transition:transform .16s,border-color .16s,box-shadow .16s;}
  body.light .card{background:#fff;border-color:#e4e8ee;box-shadow:0 1px 3px rgba(0,0,0,.04);}
  .card:hover{transform:translateY(-3px);border-color:#2c3744;}
  .card.rec{border-color:rgba(31,211,168,.45);}
  .card.fav{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 12px 34px rgba(31,211,168,.18);}
  .stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:198px;padding:12px;cursor:pointer;}
  .icon{width:var(--icon);height:var(--icon);border-radius:22.6%;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.42),inset 0 0 0 1px rgba(255,255,255,.06);transition:width .12s,height .12s;}
  .icon svg{width:100%;height:100%;display:block;}
  .badge{position:absolute;top:6px;left:6px;font-size:11px;font-weight:800;background:rgba(0,0,0,.55);color:#fff;border-radius:999px;padding:3px 9px;}
  .fav-on .badge,.card.fav .badge{background:var(--accent);color:#04231b;}
  .star-rec{position:absolute;top:6px;right:6px;font-size:13px;color:#ffd24a;}
  figcaption{margin-top:10px;}
  .nm{font-size:13.5px;font-weight:700;}
  .concept{font-size:11.5px;line-height:1.5;color:#9aa4b2;margin:5px 0 0;}
  body.light .concept{color:#5d6672;}
  .row{display:flex;gap:8px;margin-top:12px;}
  .row button{flex:1;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:inherit;border-radius:10px;padding:8px 6px;font-size:11.5px;font-weight:600;}
  body.light .row button{border-color:rgba(0,0,0,.1);background:rgba(0,0,0,.02);}
  .row button:hover{background:rgba(31,211,168,.14);border-color:var(--accent);}
  .fav.on{background:rgba(31,211,168,.18);border-color:var(--accent);color:var(--accent);}
</style></head><body>
<header><div class="h-row"><h1>Бриз — иконка <small>${n} вариантов · ★ = мой выбор</small></h1>
<div class="controls"><label class="ctl">Размер <input id="size" type="range" min="56" max="232" value="150"></label>
<button class="toggle" id="bg">☀️ Светлый фон</button></div></div>
<div id="favs">Кликни по иконке — отметить понравившиеся, снизу появятся номера.</div></header>
<main><p class="hint">Двигай «Размер» — проверить читаемость в мелком виде (как на телефоне). ★ — мои фавориты. Клик по иконке = в избранное. Скажи номера, что зашли — доведу до финала и сгенерю PNG 1024×1024 + все размеры для App Store.</p>
${sectionsHtml}</main>
<script>
(function(){
  var favs=new Set();
  function upd(){var a=Array.from(favs).sort(function(x,y){return x-y;});document.getElementById('favs').textContent=a.length?('Избранные: '+a.join(', ')+'  — скажи мне эти номера'):'Кликни по иконке — отметить понравившиеся, снизу появятся номера.';}
  document.querySelectorAll('.card').forEach(function(card){
    var num=+card.dataset.num, st=card.querySelector('.stage'), fav=card.querySelector('.fav'), dl=card.querySelector('.dl');
    function tog(){if(favs.has(num)){favs.delete(num);card.classList.remove('fav');fav.classList.remove('on');fav.textContent='☆ В избранное';}else{favs.add(num);card.classList.add('fav');fav.classList.add('on');fav.textContent='★ В избранном';}upd();}
    st.addEventListener('click',tog);
    fav.addEventListener('click',function(e){e.stopPropagation();tog();});
    dl.addEventListener('click',function(e){e.stopPropagation();var svg=card.querySelector('svg');var s=new XMLSerializer().serializeToString(svg);if(s.indexOf('xmlns=')<0)s=s.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');var b=new Blob([s],{type:'image/svg+xml'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='briz-icon-'+num+'.svg';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(a.href);},800);});
  });
  document.getElementById('size').addEventListener('input',function(e){document.documentElement.style.setProperty('--icon',e.target.value+'px');});
  document.getElementById('bg').addEventListener('click',function(){document.body.classList.toggle('light');this.textContent=document.body.classList.contains('light')?'🌙 Тёмный фон':'☀️ Светлый фон';});
})();
</script></body></html>`;

fs.writeFileSync('design/icons-final.html', html);
console.log('wrote design/icons-final.html with ' + n + ' icons');
