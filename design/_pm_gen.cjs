// Генерит 2 полноэкранных кадра экрана «Способ оплаты»/отвязки карты для ЮKassa.
// Вёрстка 1:1 с app/payment-method.tsx (тёмная тема, те же тексты/цвета).
const fs = require('fs');

const C = {
  bg: '#0B0F14', bgElev: '#11161D', card: '#1A1F27', border: 'rgba(255,255,255,0.08)',
  text: '#F5F5F7', dim: '#9AA3AF', accent: '#30D158', accentSoft: 'rgba(48,209,88,0.18)',
  danger: '#FF453A', dangerSoft: 'rgba(255,69,58,0.10)', dangerBorder: 'rgba(255,69,58,0.45)',
};

const statusBar = `
<div class="statusbar">
  <div class="time">9:41</div>
  <div class="si">
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1" fill="#fff"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#fff"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>
    <svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 2.5c2.6 0 5 1 6.8 2.7l-1.4 1.5C12.5 5.3 10.6 4.5 8.5 4.5S4.5 5.3 3.1 6.7L1.7 5.2C3.5 3.5 5.9 2.5 8.5 2.5Z" fill="#fff"/><path d="M8.5 6c1.5 0 2.9.6 3.9 1.6l-1.5 1.5c-.6-.6-1.5-1-2.4-1s-1.8.4-2.4 1L4.6 7.6C5.6 6.6 7 6 8.5 6Z" fill="#fff"/><circle cx="8.5" cy="10.4" r="1.4" fill="#fff"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.2" fill="none" stroke="#fff" stroke-opacity="0.5"/><rect x="2" y="2" width="19" height="9" rx="2" fill="#fff"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="#fff" fill-opacity="0.6"/></svg>
  </div>
</div>`;

const screen = `
<div class="nav"><span class="back">‹ Назад</span></div>
<div class="content">
  <div class="head">
    <div class="title">Подписка</div>
    <div class="sub">Статус, способ оплаты и возврат — всё здесь.</div>
  </div>

  <div class="statuscard">
    <div class="ico accent">
      <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.8 5.9 20.3l1.4-6.7-5-4.6 6.8-.8L12 2z" fill="${C.accent}"/></svg>
    </div>
    <div class="col">
      <div class="t1">Премиум активен</div>
      <div class="t2">Активен до 14 июля 2026</div>
    </div>
  </div>

  <div class="cardrow">
    <div class="ico accent">
      <svg width="24" height="24" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="3" fill="none" stroke="${C.accent}" stroke-width="2"/><rect x="2.5" y="8.5" width="19" height="2.6" fill="${C.accent}"/><rect x="14.5" y="13.5" width="4.5" height="2.4" rx="1.2" fill="${C.accent}"/></svg>
    </div>
    <div class="col">
      <div class="t1">МИР •••• 4321</div>
      <div class="t2">Привязана для автопродления</div>
    </div>
  </div>

  <div class="btn danger">
    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="${C.danger}" stroke-width="2.4" stroke-linecap="round"/></svg>
    <span>Отвязать карту</span>
  </div>

  <div class="btn neutral">
    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M20 4L9 15M20 4l-7 16-3-7-7-3 17-6z" fill="none" stroke="${C.dim}" stroke-width="1.8" stroke-linejoin="round"/></svg>
    <span style="color:${C.text}">Запросить возврат</span>
  </div>

  <div class="note">Отмена подписки не возвращает деньги за уже оплаченный период — доступ сохранится до его конца. Возврат рассматривается по запросу на istrelkov829@gmail.com. Если возврат одобрят — Премиум отключится автоматически.</div>
</div>`;

const alertHtml = `
<div class="dim"></div>
<div class="alert">
  <div class="atitle">Отвязать карту?</div>
  <div class="abody">Автопродление больше не будет списывать с этой карты. Доступ сохранится до конца оплаченного периода.</div>
  <div class="arow">
    <div class="abtn cancel">Отмена</div>
    <div class="abtn destruct">Отвязать</div>
  </div>
</div>`;

const css = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}
body{width:390px;height:844px;background:${C.bg};color:${C.text};overflow:hidden;
  font-family:-apple-system,"SF Pro Text","SF Pro Display",system-ui,sans-serif;position:relative;}
.statusbar{display:flex;align-items:center;justify-content:space-between;padding:14px 28px 0;height:54px;}
.time{font-weight:600;font-size:16px;letter-spacing:.3px;}
.si{display:flex;align-items:center;gap:7px;}
.nav{padding:6px 16px 2px;}
.back{color:${C.accent};font-size:17px;}
.content{padding:14px 20px;display:flex;flex-direction:column;gap:16px;}
.head .title{font-size:30px;font-weight:800;letter-spacing:-.6px;}
.head .sub{color:${C.dim};font-size:14px;margin-top:6px;line-height:20px;}
.statuscard,.cardrow{display:flex;align-items:center;gap:14px;padding:16px;border-radius:18px;
  background:${C.card};border:1px solid ${C.border};}
.statuscard{background:rgba(48,209,88,0.08);border-color:rgba(48,209,88,0.33);}
.ico{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}
.ico.accent{background:${C.accentSoft};}
.col{flex:1;min-width:0;}
.t1{font-size:16px;font-weight:700;}
.t2{color:${C.dim};font-size:12.5px;margin-top:2px;}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;border-radius:18px;font-size:16px;font-weight:700;}
.btn.danger{background:${C.dangerSoft};border:1px solid ${C.dangerBorder};color:${C.danger};}
.btn.neutral{background:${C.card};border:1px solid ${C.border};}
.note{color:${C.dim};font-size:12px;line-height:18px;padding:0 2px;margin-top:2px;}
/* iOS alert */
.dim{position:absolute;inset:0;background:rgba(0,0,0,0.45);}
.alert{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:270px;border-radius:14px;
  background:rgba(40,44,52,0.92);backdrop-filter:blur(20px);overflow:hidden;text-align:center;
  border:0.5px solid rgba(255,255,255,0.12);}
.atitle{font-size:17px;font-weight:700;padding:18px 16px 4px;}
.abody{font-size:13px;line-height:18px;color:#E4E6EB;padding:0 16px 16px;}
.arow{display:flex;border-top:0.5px solid rgba(255,255,255,0.18);}
.abtn{flex:1;padding:11px;font-size:17px;color:#0A84FF;}
.abtn.cancel{border-right:0.5px solid rgba(255,255,255,0.18);}
.abtn.destruct{color:${C.danger};font-weight:600;}
`;

function page(withAlert) {
  return `<!doctype html><meta charset="utf-8"><style>${css}</style>${statusBar}${screen}${withAlert ? alertHtml : ''}`;
}

fs.writeFileSync('design/pm-unbind.html', page(false));
fs.writeFileSync('design/pm-unbind-confirm.html', page(true));
console.log('wrote design/pm-unbind.html + design/pm-unbind-confirm.html');
