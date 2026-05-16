import type { IconKey } from '../components/Icon';

export type Practice = 'box_breath' | 'cyclic_sigh' | 'urge_surf' | 'halt_check' | 'if_then' | 'grounding' | 'reframe'
  | 'fagerstrom' | 'nrt' | 'pharma' | 'taper' | 'mindfulness' | 'replace' | 'ema' | 'money';

export type Technique = {
  id: string;
  evidence: 'A' | 'B' | 'C'; // A = strong (RCT/meta-analysis), B = good, C = supportive
  durationMin: number;
  tags: ('craving' | 'daily' | 'mindset' | 'physical' | 'spiritual')[];
  titleKey: string;
  summaryKey: string;
  bodyKey: string;
  icon: IconKey;
  color: string;
  practice?: Practice;
};

export const TECHNIQUES: Technique[] = [
  { id: 'cyclic_sigh', evidence: 'A', durationMin: 5, tags: ['craving','physical','daily'], icon: 'wind', color: '#0A84FF',
    titleKey: 'tech.cyclic.t',  summaryKey: 'tech.cyclic.s',  bodyKey: 'tech.cyclic.b',  practice: 'cyclic_sigh' },
  { id: 'box_breath',  evidence: 'B', durationMin: 1, tags: ['craving','physical'], icon: 'wind',     color: '#5AC8FA',
    titleKey: 'tech.box.t',     summaryKey: 'tech.box.s',     bodyKey: 'tech.box.b',     practice: 'box_breath' },
  { id: 'pharma',      evidence: 'A', durationMin: 5, tags: ['physical'],           icon: 'shield',   color: '#34C759',
    titleKey: 'tech.pharma.t',  summaryKey: 'tech.pharma.s',  bodyKey: 'tech.pharma.b',  practice: 'pharma' },
  { id: 'urge_surf',   evidence: 'A', durationMin: 4, tags: ['craving'],            icon: 'feather',  color: '#0A84FF',
    titleKey: 'tech.surf.t',    summaryKey: 'tech.surf.s',    bodyKey: 'tech.surf.b',    practice: 'urge_surf' },
  { id: 'halt',        evidence: 'B', durationMin: 1, tags: ['craving','mindset'],  icon: 'pulse',    color: '#FF9F0A',
    titleKey: 'tech.halt.t',    summaryKey: 'tech.halt.s',    bodyKey: 'tech.halt.b',    practice: 'halt_check' },
  { id: 'if_then',     evidence: 'A', durationMin: 5, tags: ['mindset','daily'],    icon: 'toolbox',  color: '#30D158',
    titleKey: 'tech.ifthen.t',  summaryKey: 'tech.ifthen.s',  bodyKey: 'tech.ifthen.b',  practice: 'if_then' },
  { id: 'grounding',   evidence: 'B', durationMin: 2, tags: ['craving','physical'], icon: 'sparkle',  color: '#BF5AF2',
    titleKey: 'tech.ground.t',  summaryKey: 'tech.ground.s',  bodyKey: 'tech.ground.b',  practice: 'grounding' },
  { id: 'reframe',     evidence: 'A', durationMin: 5, tags: ['mindset'],            icon: 'brain',    color: '#BF5AF2',
    titleKey: 'tech.reframe.t', summaryKey: 'tech.reframe.s', bodyKey: 'tech.reframe.b', practice: 'reframe' },
  { id: 'cbt',         evidence: 'A', durationMin: 10, tags: ['mindset','daily'],   icon: 'book',     color: '#0A84FF',
    titleKey: 'tech.cbt.t',     summaryKey: 'tech.cbt.s',     bodyKey: 'tech.cbt.b' },
  { id: 'mindfulness', evidence: 'A', durationMin: 10, tags: ['craving','daily'],   icon: 'flame',    color: '#FF9500',
    titleKey: 'tech.mind.t',    summaryKey: 'tech.mind.s',    bodyKey: 'tech.mind.b',    practice: 'mindfulness' },
  { id: 'fagerstrom',  evidence: 'A', durationMin: 3, tags: ['mindset'],            icon: 'flask',    color: '#0A84FF',
    titleKey: 'tech.fager.t',   summaryKey: 'tech.fager.s',   bodyKey: 'tech.fager.b',   practice: 'fagerstrom' },
  { id: 'nrt',         evidence: 'A', durationMin: 5, tags: ['physical'],           icon: 'shield',   color: '#30D158',
    titleKey: 'tech.nrt.t',     summaryKey: 'tech.nrt.s',     bodyKey: 'tech.nrt.b',     practice: 'nrt' },
  { id: 'taper',       evidence: 'B', durationMin: 0, tags: ['daily'],              icon: 'pulse',    color: '#FF9F0A',
    titleKey: 'tech.taper.t',   summaryKey: 'tech.taper.s',   bodyKey: 'tech.taper.b',   practice: 'taper' },
  { id: 'ema',         evidence: 'B', durationMin: 1, tags: ['daily','craving'],    icon: 'brush',    color: '#FF9F0A',
    titleKey: 'tech.ema.t',     summaryKey: 'tech.ema.s',     bodyKey: 'tech.ema.b',     practice: 'ema' },
  { id: 'money',       evidence: 'C', durationMin: 1, tags: ['mindset','daily'],    icon: 'sparkle',  color: '#30D158',
    titleKey: 'tech.money.t',   summaryKey: 'tech.money.s',   bodyKey: 'tech.money.b',   practice: 'money' },
  { id: 'contract',    evidence: 'B', durationMin: 5, tags: ['daily'],              icon: 'user',     color: '#0A84FF',
    titleKey: 'tech.contract.t',summaryKey: 'tech.contract.s',bodyKey: 'tech.contract.b' },
  { id: 'replace',     evidence: 'C', durationMin: 1, tags: ['craving','physical'], icon: 'drop',     color: '#5AC8FA',
    titleKey: 'tech.replace.t', summaryKey: 'tech.replace.s', bodyKey: 'tech.replace.b', practice: 'replace' },
  { id: 'faith',       evidence: 'C', durationMin: 5, tags: ['spiritual'],          icon: 'cross',    color: '#FF9500',
    titleKey: 'tech.faith.t',   summaryKey: 'tech.faith.s',   bodyKey: 'tech.faith.b' },
];
