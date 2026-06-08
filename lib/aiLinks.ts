// Shared deep-link parsing for AI replies. The coach ends actionable messages
// with markers like [[if_then]] or a /practice/... path. We strip those from
// the displayed text and surface them as tappable buttons. Used by both the
// chat screen and the slip ("analyze a slip") screen — anywhere AI text with
// markers is shown, so markers never leak as raw [[...]] brackets.

import { currentLang } from './i18n';

export const ROUTE_LABELS: Record<string, { ru: string; en: string; href: string }> = {
  cyclic_sigh:  { ru: 'Открыть дыхание (5 мин)',  en: 'Open breathing (5 min)',   href: '/practice/cyclic_sigh' },
  box_breath:   { ru: 'Открыть дыхание 4-4-4-4',   en: 'Open box breathing',       href: '/practice/box_breath' },
  urge_surf:    { ru: 'Прокатить волну тяги',      en: 'Surf the urge',            href: '/practice/urge_surf' },
  halt_check:   { ru: 'Чек 4 нужд (HALT)',         en: 'HALT check',               href: '/practice/halt_check' },
  grounding:    { ru: 'Заземление 5-4-3-2-1',      en: 'Grounding 5-4-3-2-1',      href: '/practice/grounding' },
  reframe:      { ru: 'Переписать мысль',          en: 'Reframe a thought',        href: '/practice/reframe' },
  mindfulness:  { ru: 'Осознанность 10 мин',        en: 'Mindfulness 10 min',      href: '/practice/mindfulness' },
  pharma:       { ru: 'Открыть лекарства',          en: 'Open medications',        href: '/practice/pharma' },
  fagerstrom:   { ru: 'Тест Фагерстрёма',           en: 'Fagerström test',         href: '/practice/fagerstrom' },
  taper:        { ru: 'Постепенное снижение',        en: 'Taper plan',             href: '/practice/taper' },
  journal:      { ru: 'Открыть дневник',             en: 'Open journal',           href: '/journal' },
  goal:         { ru: 'Поставить цель',              en: 'Set a goal',             href: '/goal' },
  checkin:      { ru: 'Чек-ин дня',                  en: 'Daily check-in',         href: '/checkin' },
  method:       { ru: 'Сменить метод',                en: 'Change method',          href: '/transition' },
  meds:         { ru: 'Дневник приёма',               en: 'Med diary',              href: '/meds' },
};

export function extractLinks(text: string): { label: string; href: string }[] {
  const lang = currentLang();
  const found = new Set<string>();
  const result: { label: string; href: string }[] = [];
  const re = /\[\[([a-z_]+)\]\]|\/(practice\/[a-z_]+|journal|goal|checkin|method|transition|meds)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    let key = (m[1] || m[2] || '').toLowerCase();
    if (key.startsWith('practice/')) key = key.slice('practice/'.length);
    if (key === 'transition') key = 'method';
    if (!ROUTE_LABELS[key] || found.has(key)) continue;
    found.add(key);
    const r = ROUTE_LABELS[key];
    result.push({ label: lang === 'ru' ? r.ru : r.en, href: r.href });
  }
  return result;
}

export function stripLinks(text: string): string {
  return text
    // Strip ANY [[...]] / {{...}} markers, even unknown keys.
    .replace(/\[\[[^\]\n]+\]\]/g, '')
    .replace(/\{\{[^}\n]+\}\}/g, '')
    .replace(/\s*\/(practice\/[a-z_]+|journal|goal|checkin|method|transition|meds)\b/gi, '')
    // Tidy doubled spaces / stray empty lines left after stripping.
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
