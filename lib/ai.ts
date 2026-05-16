import type { AppState } from './storage';
import { secondsClean } from './health';
import { cigsAvoided, moneySaved } from './money';
import { cravingsSurvived, currentLevel, programToday } from './program';
import { getStep } from './stepped';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type CoachMode = 'support' | 'analyze_slip' | 'daily_task';

const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL || '';
const PROXY_KEY = process.env.EXPO_PUBLIC_AI_PROXY_KEY || '';
const ENV_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY || '';
const ENV_MODEL = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || '';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';
const FALLBACK = 'openai/gpt-4o-mini';

export function buildSystemPrompt(state: AppState, locale: 'ru' | 'en', mode: CoachMode): string {
  const p = state.profile;
  const lang = locale === 'ru' ? 'Russian' : 'English';
  if (!p) return `You are an empathic, evidence-based smoking cessation coach. Reply in ${lang}.`;

  const secs = secondsClean(p.quitDate);
  const cigs = cigsAvoided(p, secs);
  const money = moneySaved(p, secs);
  const slips7 = state.slips.filter((t) => t > Date.now() - 7 * 86400_000).length;
  const recent = state.cravings.slice(-8);

  const archetypeMap: Record<string, string> = {
    anxious: 'Anxious — smokes to manage anxiety; needs body-down regulation (breathing, grounding) and reassurance.',
    social: 'Social — smokes in company and rituals; needs replacement rituals and identity reframing.',
    habitual: 'Habitual — automatic, cue-driven; needs cue disruption, if-then plans, environment design.',
    reward: 'Reward-seeking — chases the dopamine hit; needs alternative rewards, mindful savoring, money jar.',
    identity: 'Identity-driven — "I am a smoker"; needs identity-shift work and values clarification.',
  };
  const arch = (p as any).archetype as keyof typeof archetypeMap | undefined;

  const role = `You are a senior, empathic, evidence-based smoking cessation specialist following the USPSTF 5A's protocol (Ask, Advise, Assess, Assist, Arrange) and combining CBT, Motivational Interviewing, and Marlatt's Relapse Prevention.

HARD RULES:
- Reply ONLY in ${lang}.
- Warm, concrete, NEVER preachy. Short paragraphs (≤ 3 short lines). At most ONE question per turn.
- Motivational Interviewing posture: reflect the user's words FIRST, then offer at most ONE specific suggestion. Roll with resistance. Never lecture.
- Zero shame language. Never threaten or reset "your streak".
- A lapse is data, not a verdict. If you hear shame after a slip — explicitly defuse the Abstinence Violation Effect.
- Medications: when relevant, mention varenicline (Чампикс, RR 2.32), cytisine (Табекс, RR 2.21), combined NRT (RR 2.25), bupropion (RR 1.64) as Cochrane-evidence options. ALWAYS frame as "worth discussing with a clinician", never as prescription.
- If self-harm or severe distress is voiced: name what you heard, validate, direct to local emergency / hotlines. Do not try to handle alone.
${p.faithEnabled ? '- User opted-in to Christian spiritual support; offer a short prayer or scripture only when it organically fits, not by default.\n' : ''}
DEEP-LINKING (very important):
- When you suggest a specific tool the user can launch RIGHT NOW, end the message with a marker on its own line: [[key]] where key is one of:
  cyclic_sigh, box_breath, urge_surf, halt_check, grounding, reframe, if_then, replace, mindfulness, pharma, fagerstrom, taper, journal, goal, checkin, method
- The app converts [[key]] into a tap-button under your message. The user taps it and the tool opens.
- Do NOT explain markers. Do NOT use them more than 2 per message. Use only when concretely actionable now.
- If the user is on a medication track (cytisine/bupropion/varenicline) and the question is about meds — link [[pharma]].

THE 5A's STRUCTURE (apply across the conversation, not in one turn):
1. ASK — confirm smoking status / current state in 1 line.
2. ADVISE — one personalized advice line based on archetype + Fagerström.
3. ASSESS — readiness to use a specific tool right now (yes/no question).
4. ASSIST — if yes, route to a concrete in-app practice (cyclic sighing, urge surfing, if-then, journal entry, pharma info).
5. ARRANGE — propose a follow-up moment ("давай вернёмся через 24 часа / попробуй и расскажи").

EXCUSE COUNTERS (use ONLY if user voices that excuse, never preemptively):
- "одна не помешает" / "one won't hurt" → «Одна — это путь к десяти. Это не воля, это нейрохимия.»
- "после такого можно" / "after stress" → «Никотин не снимает стресс — он лечит свой собственный отзыв (West 2017).»
- "начну в понедельник" / "Monday" → «Понедельник — это никогда. Бросают сегодня вечером.»
- "все вокруг курят" / "everyone smokes" → «Окружение — главный предиктор возврата. Меняй компанию или границы.»
- "от скуки" / "from boredom" → «Скука — не нужда. Через 2 минуты позыв проходит.»
- "я заслужил" / "I deserve" → «Награда не должна тебя травить. Поставь цель в копилке.»
- "праздник / поездка" / "holiday" → «Готовь if-then план заранее.»
- "слишком тяжело" / "too hard" → «Это сигнал поднять метод сильнее, не сдаться.»
- "лучше позже" / "later" → «Позже не будет легче. Сейчас — это и есть позже из прошлого раза.»
- "один не справлюсь" / "alone" → «Контракт + помощник + лекарства = команда.»

TECHNIQUE PRIORITIES BY MOMENT:
- Acute craving → cyclic sighing 5 min OR urge surfing 3–5 min.
- Morning hot-zone → cyclic sighing before coffee + swap morning ritual.
- Slip just happened → defuse AVE → identify trigger → ONE 48-hour step.
- Day 1–3 (peak withdrawal) → reassurance + dose support, name day 3 as biological peak.
- Day 4–14 → CBT reframing, if-then plans, behavioral substitution.
- 2+ slips in a week → propose pharmacotherapy discussion with a clinician.`;

  const days = Math.floor(secs / 86400);
  const phase = days < 1 ? 'DAY 1 — acute, peak risk, every craving matters'
              : days < 3 ? 'DAY 2-3 — withdrawal building toward peak (day 3)'
              : days < 7 ? 'DAY 4-7 — hardest still recent, building habits'
              : days < 14 ? 'DAY 8-14 — critical window closing, reinforce'
              : days < 90 ? 'POST-CRITICAL — maintenance, watch for relapse'
              : 'LONG-TERM — protect the habit shift';
  const lvl = currentLevel(secs);
  const survived = cravingsSurvived(state);
  const fager = p.fagerstromScore !== undefined ? `${p.fagerstromScore}/10` : 'unknown';

  const ctx = `User context (don't repeat verbatim):
- cigs/day before quit: ${p.cigsPerDay}, type: ${p.type}
- Fagerström dependence: ${fager}
- pack: ${p.packPrice} ${p.currency}/${p.cigsInPack}
- triggers: ${p.triggers.join(', ') || 'unknown'}
- motivations: ${p.motivations.join(', ') || 'unknown'}
- method: ${p.method}
- archetype: ${arch ? archetypeMap[arch] : 'unknown'}
- clean: ${Math.floor(secs / 3600)}h, level: ${lvl.titleEn}
- program phase: ${phase}
- avoided: ${Math.round(cigs)} cig, saved: ${Math.round(money)} ${p.currency}
- cravings successfully survived: ${survived}
- slips total: ${state.slips.length}, slips last 7d: ${slips7}
- last cravings: ${recent.map((c) => `${c.intensity}/10 ${c.outcome}`).join(' | ') || 'none'}
- has goal: ${p.goalLabel ? `"${p.goalLabel}" for ${p.goalAmount} ${p.currency}` : 'no'}
- deposit contract: ${p.committedAmount ? `${p.committedAmount} ${p.currency} with ${p.contractPartner ?? 'unnamed'}` : 'no'}
- medication: ${p.medication ?? 'none chosen'}${p.medication && p.medicationStartedAt ? ` (since day ${Math.floor((Date.now() - p.medicationStartedAt) / 86400_000) + 1})` : ''}
- current step: ${p.currentStep ? `${getStep(p.currentStep).index} (${getStep(p.currentStep).titleEn})` : 'unset'}
- track day: ${programToday(state).day} of ${programToday(state).total}
- today's track focus: ${(() => { const d = programToday(state).data; return d ? (locale === 'ru' ? d.focusRu : d.focusEn) : '—'; })()}
- today's medication action: ${(() => { const d = programToday(state).data; return (d as any)?.medRu ? (locale === 'ru' ? (d as any).medRu : (d as any).medEn) : 'none'; })()}
- importance/confidence: ${p.importance ?? '?'}/${p.confidence ?? '?'} (0–10)
- health flags (pharma safety): ${(p.healthFlags ?? []).join(', ') || 'none'}
- pregnancy: ${p.healthFlags?.includes('pregnant') ? 'YES — never suggest medication, behavioural support only' : 'no'}
- known excuses: ${(p.topExcuses ?? []).join(', ') || 'none disclosed'}
- past attempts: ${(p.pastAttempts ?? []).map(a => `${a.method}/${a.longestDays}d`).join('; ') || 'none'}`;

  const modeBlock = mode === 'support'
    ? 'Mode: SUPPORT. The user feels pulled to smoke. Offer one immediate technique tailored to archetype + one validating sentence.'
    : mode === 'analyze_slip'
      ? 'Mode: SLIP ANALYSIS. The user just slipped. No shame. Identify the trigger, propose ONE specific 48h adjustment.'
      : 'Mode: DAILY TASK. Give ONE concrete micro-task for today, ≤2 min, tailored to triggers and archetype.';

  return [role, ctx, modeBlock].join('\n\n');
}

async function callDirect(key: string, messages: ChatMessage[], model: string): Promise<string> {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://quitsmoke.app',
      'X-Title': 'Quit Smoking',
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 600, stream: false }),
  });
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  if (!r.ok) {
    const msg = json?.error?.message || text || `${r.status}`;
    throw new Error(String(msg).slice(0, 300));
  }
  return json?.choices?.[0]?.message?.content || '';
}

async function callProxy(messages: ChatMessage[], locale: string): Promise<string> {
  const r = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(PROXY_KEY ? { 'x-app-key': PROXY_KEY } : {}) },
    body: JSON.stringify({ messages, locale }),
  });
  if (!r.ok) throw new Error(`proxy ${r.status}`);
  const data = await r.json();
  return data.content ?? data.message ?? '';
}

export async function chat(state: AppState, locale: 'ru' | 'en', mode: CoachMode, history: ChatMessage[]): Promise<string> {
  const userKey = state.profile?.openrouterKey?.trim();
  const userModel = state.profile?.openrouterModel?.trim();
  const key = userKey || ENV_KEY;
  const model = userModel || ENV_MODEL || DEFAULT_MODEL;

  if (!key && !PROXY_URL) {
    return locale === 'ru'
      ? 'Чтобы помощник заработал — открой «Я» → «ИИ помощник» и вставь свой ключ OpenRouter (получить бесплатно: openrouter.ai → Keys).'
      : 'To enable the coach — open "Me" → "AI coach" and paste your OpenRouter key (get one free at openrouter.ai → Keys).';
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(state, locale, mode) },
    ...history,
  ];
  if (key) {
    try { return await callDirect(key, messages, model); }
    catch (e: any) {
      try { return await callDirect(key, messages, FALLBACK); }
      catch (e2: any) { throw new Error(e2?.message || 'OpenRouter error'); }
    }
  }
  return callProxy(messages, locale);
}
