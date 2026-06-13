// Generates App Store screenshot frames (1290×2796) as HTML, to be rendered to
// PNG by headless Chrome. Each frame = brand gradient + caption + device-framed
// app screenshot. Run via store-shots.sh.
import { writeFileSync, mkdirSync } from 'node:fs';

const SHOTS = '/Users/romansuzdalcev/бросить курить/scripts/store/_src';
const OUT = '/Users/romansuzdalcev/бросить курить/scripts/store/_frames';
mkdirSync(OUT, { recursive: true });

const frames = [
  { img: 'home',       accent: '#30D158', eyebrow: 'ГЛАВНАЯ',        title: 'Твой прогресс\nвживую' },
  { img: 'wave',       accent: '#0A84FF', eyebrow: 'КНОПКА SOS',     title: 'Переждать волну\nза 3 минуты' },
  { img: 'chat',       accent: '#0A84FF', eyebrow: 'ПОМОЩНИК',       title: 'ИИ, который\nне стыдит' },
  { img: 'progress',   accent: '#30D158', eyebrow: 'ПРОГРЕСС',       title: 'Деньги, здоровье\nи паттерны тяги' },
  { img: 'techniques', accent: '#BF5AF2', eyebrow: 'ТЕХНИКИ',        title: 'Аудио на\nкаждый момент' },
  { img: 'sos',        accent: '#FF453A', eyebrow: 'В МОМЕНТ ТЯГИ',  title: 'Помощь —\nв одно касание' },
  { img: 'awards',     accent: '#16C2A3', eyebrow: 'НАГРАДЫ',        title: 'Рубеж\nза рубежом' },
  { img: 'knowledge',  accent: '#FF9F0A', eyebrow: 'ЗНАНИЯ',         title: 'Коротко\nи по делу' },
];

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const tpl = (f) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1290px;height:2796px;overflow:hidden}
  body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:radial-gradient(120% 60% at 50% -8%, ${hexA(f.accent, 0.42)} 0%, ${hexA(f.accent, 0.10)} 34%, #0A0E13 64%);
    color:#F4F6F8;position:relative}
  .glow{position:absolute;width:900px;height:900px;border-radius:50%;background:${f.accent};filter:blur(180px);opacity:0.28;top:-280px;left:50%;transform:translateX(-50%)}
  .cap{position:absolute;top:150px;left:0;right:0;text-align:center;z-index:2;padding:0 80px}
  .eyebrow{font-size:34px;font-weight:800;letter-spacing:6px;color:${f.accent};margin-bottom:26px}
  h1{font-size:104px;line-height:1.04;font-weight:850;letter-spacing:-2.5px;white-space:pre-line}
  .phone{position:absolute;left:50%;bottom:-60px;transform:translateX(-50%);
    width:712px;border-radius:78px;background:#05070A;padding:20px;
    border:1.5px solid rgba(255,255,255,0.12);
    box-shadow:0 60px 140px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 120px ${hexA(f.accent, 0.18)}}
  .screen{position:relative;border-radius:60px;overflow:hidden;background:#0B0F14;width:100%}
  .screen img{width:100%;display:block}
  .notch{position:absolute;top:18px;left:50%;transform:translateX(-50%);width:210px;height:50px;background:#05070A;border-radius:28px;z-index:3}
  .mark{position:absolute;bottom:62px;left:0;right:0;text-align:center;font-size:30px;font-weight:800;letter-spacing:0.5px;color:rgba(255,255,255,0.55);z-index:3}
</style></head><body>
  <div class="glow"></div>
  <div class="cap"><div class="eyebrow">${f.eyebrow}</div><h1>${f.title}</h1></div>
  <div class="phone"><div class="screen"><div class="notch"></div><img src="file://${SHOTS}/${f.img}.png"></div></div>
  <div class="mark">Бриз — бросить курить</div>
</body></html>`;

frames.forEach((f, i) => {
  const n = String(i + 1).padStart(2, '0');
  writeFileSync(`${OUT}/${n}.html`, tpl(f));
  console.log(`${OUT}/${n}.html`);
});
console.log(`GENERATED ${frames.length}`);
