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
    background:
      radial-gradient(80% 38% at 50% 66%, ${hexA(f.accent, 0.40)} 0%, ${hexA(f.accent, 0.07)} 44%, rgba(10,14,19,0) 68%),
      #0A0E13;
    color:#FFFFFF;position:relative;display:flex;flex-direction:column;align-items:center}
  /* Accent halo lives BEHIND the phone, not under the caption — keeps the top
     dark so the white caption stays high-contrast and legible. */
  .glow{position:absolute;width:1040px;height:1040px;border-radius:50%;background:${f.accent};filter:blur(210px);opacity:0.20;top:1180px;left:50%;transform:translateX(-50%);pointer-events:none}
  .cap{text-align:center;padding:0 84px;margin-top:172px;z-index:2}
  .eyebrow{font-size:33px;font-weight:800;letter-spacing:7px;color:${f.accent};margin-bottom:26px}
  h1{font-size:98px;line-height:1.06;font-weight:850;letter-spacing:-2px;white-space:pre-line;text-shadow:0 2px 40px rgba(0,0,0,0.55)}
  /* Stage takes the rest of the height and centres the FULL phone — never cut */
  .stage{flex:1;width:100%;display:flex;align-items:center;justify-content:center;padding:60px 0 90px;z-index:1;min-height:0}
  .phone{width:912px;border-radius:96px;background:#05070A;padding:22px;
    border:2px solid rgba(255,255,255,0.13);
    box-shadow:0 70px 150px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 140px ${hexA(f.accent, 0.16)}}
  .screen{position:relative;border-radius:76px;overflow:hidden;background:#0B0F14;width:100%}
  .screen img{width:100%;display:block}
  .notch{position:absolute;top:22px;left:50%;transform:translateX(-50%);width:250px;height:58px;background:#05070A;border-radius:32px;z-index:3}
</style></head><body>
  <div class="glow"></div>
  <div class="cap"><div class="eyebrow">${f.eyebrow}</div><h1>${f.title}</h1></div>
  <div class="stage"><div class="phone"><div class="screen"><div class="notch"></div><img src="file://${SHOTS}/${f.img}.png"></div></div></div>
</body></html>`;

frames.forEach((f, i) => {
  const n = String(i + 1).padStart(2, '0');
  writeFileSync(`${OUT}/${n}.html`, tpl(f));
  console.log(`${OUT}/${n}.html`);
});
console.log(`GENERATED ${frames.length}`);
