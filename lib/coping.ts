// Quick craving-busters — fast behavioural actions that help ride out an urge
// (3–5 min) beyond breathing. Evidence-informed: brief delay + distraction,
// oral/physical substitution, cold exposure, light movement, social contact.
// Wellness framing only — these are self-help coping actions, not treatment.

import type { IconKey } from '../components/Icon';

export type CopingMethod = {
  id: string;
  ru: string; en: string;
  hintRu: string; hintEn: string;
  icon: IconKey;
  color: string;
};

export const COPING_METHODS: CopingMethod[] = [
  { id: 'cold_water', ru: 'Холодная вода на лицо/руки', en: 'Cold water on face/hands',
    hintRu: 'Резкий холод сбивает импульс за секунды', hintEn: 'A cold jolt resets the impulse in seconds',
    icon: 'water', color: '#5AC8FA' },
  { id: 'drink', ru: 'Стакан воды залпом', en: 'A glass of water, fast',
    hintRu: 'Занять рот и руки, переждать пик', hintEn: 'Busy the mouth and hands, ride the peak',
    icon: 'drop', color: '#0A84FF' },
  { id: 'grip', ru: 'Сжать эспандер или кулаки', en: 'Squeeze a gripper or fists',
    hintRu: '30 секунд напряжения снимают позыв', hintEn: '30 seconds of tension drains the urge',
    icon: 'muscle', color: '#FF9F0A' },
  { id: 'walk', ru: 'Пройтись 2–3 минуты', en: 'Walk for 2–3 minutes',
    hintRu: 'Движение переключает мозг', hintEn: 'Movement shifts the brain',
    icon: 'run', color: '#30D158' },
  { id: 'chew', ru: 'Жвачка, семечки, морковь', en: 'Gum, seeds, a carrot',
    hintRu: 'Замена орального ритуала', hintEn: 'Replace the oral ritual',
    icon: 'taste', color: '#FF2D78' },
  { id: 'snack', ru: 'Перекусить (фрукт, орехи)', en: 'A snack (fruit, nuts)',
    hintRu: 'Сладкий вкус снижает тягу', hintEn: 'A sweet taste lowers the craving',
    icon: 'sprout', color: '#34C759' },
  { id: 'text', ru: 'Написать близкому', en: 'Text someone close',
    hintRu: '«Держусь» вслух — и легче', hintEn: 'Saying "I\'m holding" out loud helps',
    icon: 'chat', color: '#BF5AF2' },
  { id: 'music', ru: 'Включить музыку или звуки', en: 'Put on music or sounds',
    hintRu: 'Отвлечь внимание на 3 минуты', hintEn: 'Pull attention away for 3 minutes',
    icon: 'headphones', color: '#5E5CE6' },
];

export function copingById(id: string): CopingMethod | undefined {
  return COPING_METHODS.find((m) => m.id === id);
}

// Custom user-written methods are stored as `custom:<text>` in copingMethods.
export const CUSTOM_PREFIX = 'custom:';

export type ResolvedCoping = { id: string; label: string; hint?: string; icon: IconKey; color: string };

// Resolve any stored id (preset or custom) into something renderable.
export function resolveCoping(id: string, ru: boolean): ResolvedCoping | null {
  if (id.startsWith(CUSTOM_PREFIX)) {
    const label = id.slice(CUSTOM_PREFIX.length).trim();
    if (!label) return null;
    return { id, label, icon: 'check', color: '#0A84FF' };
  }
  const m = copingById(id);
  if (!m) return null;
  return { id, label: ru ? m.ru : m.en, hint: ru ? m.hintRu : m.hintEn, icon: m.icon, color: m.color };
}
