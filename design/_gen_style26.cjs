// Генерирует воркфлоу: вариации в стиле иконки #26 (Ascending air), но с понятным
// смыслом «бросить курить». Эталонный SVG встраивается через JSON.stringify.
const fs = require('fs');
const ic = JSON.parse(fs.readFileSync('design/_style26.json', 'utf8'));
const STYLE_SVG = ic.svg;
const STYLE_DESC = 'palette: ' + ic.palette + '. ' + ic.concept;

const RULES = 'You are EXTENDING an existing premium app-icon style for «Бриз» (Breeze), an app to QUIT SMOKING. You must MATCH the reference icon\'s visual language EXACTLY: a deep teal-to-petrol vertical GRADIENT background filling the entire 1024x1024 square; ultra-clean, MINIMAL composition (only 2-4 bold FILLED geometric shapes); bright mint (#eafff6) and green (#7fe3c4) marks that pop hard; premium, calm, confident; crisp silhouette at 60px. Keep that exact gradient, palette, weight and minimalism. YOUR JOB: keep this style but make the QUIT-SMOKING / breath / fresh-air meaning clearly readable — better than a plain up-arrow — WITHOUT adding clutter. TECH: one self-contained <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">...</svg>; no width/height on <svg>; full-bleed background; unique slug-prefixed ids on every gradient/clip; no <style> blocks; no <image>/external refs. HARD BANS: thin/wavy worm strokes; clutter (>4 shapes); low contrast; hairlines.';

const APPROACHES = [
  { key: 'lungs', brief: 'Form the mark as two clean LUNG LOBES that lift upward like the reference chevrons — lungs + breath + the lift of quitting. Two bold mint/green lobes joined by a short central airway. Minimal, on the same teal gradient.' },
  { key: 'cig2air', brief: 'Place a short, clearly recognizable cigarette (or stub) low in the icon, with the bright mint/green shapes rising above it as CLEAN AIR replacing smoke — leaving smoking behind. Keep it minimal: a small clear cigarette + the rising shapes, same palette.' },
  { key: 'exhale', brief: 'Make the rising shape clearly an EXHALE / breath of fresh air — a bold breath plume or two stacked breath arcs lifting upward. Minimal, same teal + mint palette, unmistakably "breathing".' },
  { key: 'leaf', brief: 'Turn the upward shape into a crisp bold LEAF or two-leaf sprout rising — fresh life / healthy lungs. Minimal, same palette and gradient.' },
  { key: 'wings', brief: 'Make the upward chevrons read clearly as LUNGS opening into WINGS (freedom + healthy lungs). One bold filled silhouette, minimal, same palette.' },
  { key: 'nosmoke', brief: 'A clean minimal cigarette with a bold mint/green diagonal slash across it (no-smoking), with a subtle upward lift — quit + ascent — in the same teal gradient + mint/green palette.' },
];

const lines = [];
lines.push("export const meta = { name: 'briz-style26', description: 'Variations on liked icon #26 style with clearer quit-smoking meaning', phases: [ { title: 'Generate' }, { title: 'Check' } ] }");
lines.push('const STYLE_SVG = ' + JSON.stringify(STYLE_SVG) + ';');
lines.push('const STYLE_DESC = ' + JSON.stringify(STYLE_DESC) + ';');
lines.push('const RULES = ' + JSON.stringify(RULES) + ';');
lines.push('const APPROACHES = ' + JSON.stringify(APPROACHES) + ';');
lines.push("const GEN = { type: 'object', properties: { icons: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, concept: { type: 'string' }, palette: { type: 'string' }, svg: { type: 'string' } }, required: ['name', 'svg'] } } }, required: ['icons'] };");
lines.push("const CRITIC = { type: 'object', properties: { keep: { type: 'boolean' }, score: { type: 'number' }, clear: { type: 'boolean' }, issues: { type: 'string' } }, required: ['keep', 'score'] };");
lines.push("function gp(a){ return RULES + '\\n\\nSTYLE REFERENCE SVG (match its gradient, palette, shape weight and minimalism EXACTLY):\\n' + STYLE_SVG + '\\n\\nReference notes: ' + STYLE_DESC + '\\n\\nYOUR APPROACH: ' + a.brief + '\\n\\nProduce 3 DISTINCT variations on this approach, ALL in the reference style. Return JSON {\"icons\":[ 3 objects ]} each with name, concept, palette, svg (unique slug-prefixed ids).'; }");
lines.push("function cp(x){ return 'You are an art director for «Бриз», a premium QUIT-SMOKING app. Judge this icon on THREE things: (1) does it clearly relate to quitting smoking / breath / lungs / fresh air — NOT a generic up-arrow or abstract shape? (2) does it match the premium teal-gradient + bright mint/green MINIMAL style? (3) is it modern and crisp at 60px? SVG:\\n' + x.svg + '\\nReturn keep (bool), score 0-10, clear (bool = is the quit-smoking meaning obvious at a glance?), issues (one short line). Pass = keep true AND score>=7 AND clear true.'; }");
lines.push("phase('Generate');");
lines.push("const batches = await parallel(APPROACHES.map(function(a){ return function(){ return agent(gp(a), { label: 'gen:' + a.key, phase: 'Generate', schema: GEN }).then(function(r){ return { a: a, icons: (r && r.icons) || [] }; }); }; }));");
lines.push("var pool = []; batches.filter(Boolean).forEach(function(b){ (b.icons || []).forEach(function(ic){ pool.push(Object.assign({}, ic, { approach: b.a.key })); }); });");
lines.push("log('Кандидатов: ' + pool.length);");
lines.push("phase('Check');");
lines.push("const out = await parallel(pool.map(function(ic){ return function(){ return agent(cp(ic), { label: 'check:' + ic.approach, phase: 'Check', schema: CRITIC }).then(function(v){ return Object.assign({}, ic, { _score: v && v.score, _keep: v && v.keep, _clear: v && v.clear, _issues: v && v.issues }); }); }; }));");
lines.push("return { icons: out.filter(Boolean) };");

fs.writeFileSync('design/style26-workflow.js', lines.join('\n'));
console.log('wrote design/style26-workflow.js (' + APPROACHES.length + ' approaches x3 = ' + (APPROACHES.length * 3) + ' candidates)');
