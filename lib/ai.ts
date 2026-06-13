import type { AppState } from './storage';
import { secondsClean } from './health';
import { relapseStatus } from './relapse';
import { cigsAvoided, moneySaved } from './money';
import { cravingsSurvived, currentLevel, programToday } from './program';
import { getStep, preQuitGraceEnd, methodQuitDay } from './stepped';
import { getPersona } from './personas';
import { factsBlock } from './aiMemory';
import { computeInsights, triggerName } from './insights';
import type { PersonaId } from './storage';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type CoachMode = 'support' | 'analyze_slip' | 'daily_task';
// 'call' is an internal voice-call prompt, not a coach tab mode.
export type PromptMode = CoachMode | 'call';

const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL || '';
const PROXY_KEY = process.env.EXPO_PUBLIC_AI_PROXY_KEY || '';
const ENV_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY || '';
const ENV_MODEL = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || '';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';
const FALLBACK = 'openai/gpt-4o-mini';
// The voice call must feel real-time — never route it through a slow flagship
// model. A small, fast model keeps the back-and-forth snappy.
const CALL_MODEL = process.env.EXPO_PUBLIC_CALL_MODEL || 'google/gemini-2.5-flash-lite';

// A compact, data-driven «what works / when it hits» line built from the user's
// own logged cravings — so the coach speaks from THIS person's pattern, not
// generic advice.
function cravingStatsLine(state: AppState): string {
  const ins = computeInsights(state.cravings);
  if (ins.total < 3) return 'craving stats: not enough logged cravings yet';
  const bits: string[] = [];
  bits.push(`holds ${Math.round(ins.resistRate * 100)}% of cravings`);
  if (ins.peakHourLabel) bits.push(`riskiest window ${ins.peakHourLabel}`);
  if (ins.topTriggers[0]) bits.push(`top trigger ${triggerName(ins.topTriggers[0].trigger, false)}`);
  if (ins.intensityTrend !== 'flat') bits.push(`intensity trending ${ins.intensityTrend}`);
  return `craving stats (from this user's own log): ${bits.join('; ')}`;
}

// If a craving was logged in the last ~20 min (e.g. the user just rode the SOS
// wave from a [[sos]] button and came back to chat), surface it so the coach
// closes the loop instead of starting cold.
function recentCravingLine(state: AppState): string {
  const last = state.cravings[state.cravings.length - 1];
  if (!last) return '';
  const minsAgo = Math.floor((Date.now() - last.ts) / 60000);
  if (minsAgo > 25) return '';
  const what = last.outcome === 'resisted'
    ? `the user JUST rode out a craving (${minsAgo} min ago, intensity ${last.intensity}/10) WITHOUT smoking`
    : `the user smoked ${minsAgo} min ago`;
  return `\n- LOOP-CLOSE: ${what} — acknowledge it naturally and continue from there (e.g. "видел, волна прошла — как было на пике?"), don't restart cold.`;
}

export function buildSystemPrompt(state: AppState, locale: 'ru' | 'en', mode: PromptMode, personaId?: PersonaId, priorSummary?: string): string {
  const p = state.profile;
  const lang = locale === 'ru' ? 'Russian' : 'English';
  if (!p) return `You are an empathic, evidence-based smoking cessation coach. Reply in ${lang}.`;

  const secs = secondsClean(p.quitDate);

  // Dedicated voice-call prompt — conversational, short, NOT a technique
  // dispenser (fixes the "always suggests breathing" loop) + faster replies.
  if (mode === 'call') {
    const d = Math.floor(secs / 86400);
    const mots = (p.motivations ?? []).join(', ') || '—';
    const trigs = (p.triggers ?? []).join(', ') || '—';
    const stmt = p.identityStatement?.trim();
    return `You are Бриз — a warm, real friend on a PHONE CALL with someone fighting a cigarette craving right now. This is a SPOKEN conversation, not a chat. Reply ONLY in ${lang}.

HARD RULES:
- 1–2 SHORT spoken sentences. Never long, never a list. This is talking, not writing.
- Sound like a close friend, not a coach or a script. Warm, calm, human.
- VARY every reply. Do NOT repeat advice. Do NOT suggest breathing more than ONCE in the whole call — usually just listen, reflect, reassure.
- Mostly: reflect what they feel, reassure, remind them who they're becoming, and ask one short question back.
- Offer a tiny concrete action only occasionally and NEVER the same one twice (a sip of water, step outside, hold something cold, text someone, name the trigger out loud).
- No markers, no links, no emoji, no markdown. A slip is never shame.

Them: ${d} days smoke-free. Quitting for: ${mots}. Triggers: ${trigs}.${stmt ? ` Becoming: "${stmt}".` : ''}${factsBlock(state)}`;
  }

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
- NEVER say a cigarette would "reset", "zero out" or "erase" the user's days/progress («обнулишь дни» is FORBIDDEN). The app's core promise: a slip never resets anything — brain adaptations and clean days remain. Frame risk as «запустишь старую петлю», never as обнуление.
- A lapse is data, not a verdict. If you hear shame after a slip — explicitly defuse the Abstinence Violation Effect.
- Medications: when relevant, mention varenicline (Чампикс, RR 2.32), cytisine (Табекс, RR 1.30), combined NRT (RR 2.25), bupropion (RR 1.64) as Cochrane-evidence options. ALWAYS frame as "worth discussing with a clinician", never as prescription. Never invent dosing factors (weight/BP do not set the Tabex schedule) — point to the manufacturer leaflet and a doctor.
- CRISIS PROTOCOL: if self-harm or severe distress is voiced — name what you heard, validate, and give ONLY these verified Russian helplines, never invent numbers: «Телефон неотложной психологической помощи 051 (с мобильного +7 495 051, Москва), горячая линия психологической помощи МЧС +7 495 989-50-50, при прямой опасности — 112». Stay with the user, no smoking techniques in this moment.
- Address the user ONLY as «ты», never «вы». One consistent warm voice.
- Plain conversational text: no markdown headers/bold lists in chat replies; short paragraphs only.
DEEP-LINKING (very important):
- When you suggest a specific tool the user can launch RIGHT NOW, end the message with a marker on its own line: [[key]] where key is one of:
  cyclic_sigh, box_breath, urge_surf, halt_check, grounding, reframe, mindfulness, pharma, fagerstrom, taper, journal, goal, checkin, method, sos, audio
  ([[sos]] opens the 3-minute craving wave timer; [[audio]] opens a voiced calming audio practice)
- The app converts [[key]] into a tap-button under your message. The user taps it and the tool opens.
- Do NOT explain markers. Do NOT use them more than 2 per message. Use only when concretely actionable now.
- If the user is on a medication track (cytisine/bupropion/varenicline) and the question is about meds — link [[pharma]].

THE 5A's STRUCTURE (apply across the conversation, not in one turn):
1. ASK — confirm smoking status / current state in 1 line.
2. ADVISE — one personalized advice line based on archetype + Fagerström.
3. ASSESS — readiness to use a specific tool right now (yes/no question).
4. ASSIST — if yes, route to a concrete in-app practice (cyclic sighing, urge surfing, if-then, journal entry, pharma info).
5. ARRANGE — propose a follow-up moment ("давай вернёмся через 24 часа / попробуй и расскажи").

EXCUSE COUNTERS (use ONLY if user voices that excuse, never preemptively; REPHRASE in your own warm words — never quote these lines verbatim):
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

CONVERSATION & TECHNIQUE RULES (critical):
- DEFAULT BEHAVIOR IS LISTENING, not prescribing. Most turns: reflect what the user said, validate, ask at most one short question, or simply keep the conversation going. A technique is the exception, not the rule.
- EXPLICIT-REQUEST OVERRIDE: if the user directly ASKS for help, a tool, or "how do I cope with the craving" — answer with EXACTLY ONE concrete suggestion IMMEDIATELY, with its [[marker]] button. ONE, not a menu of options. Refusing to suggest anything when asked is as bad as spamming techniques. Best first answers for an acute urge: the SOS wave [[sos]] or a guided audio practice [[audio]] — NOT breathing.
- Offer an UNREQUESTED technique at most once every 3–4 turns, and only when the user signals an acute urge right now. Never open the conversation with a technique.
- NEVER suggest the same technique twice in a row. Check your previous messages in this conversation: if you already suggested breathing / urge surfing / anything, pick something different or offer nothing.
- Breathing exercises (cyclic sighing, box breathing) are ONLY appropriate when the user describes acute PHYSICAL agitation right now (racing heart, shaking, panic) AND you have not suggested breathing in this conversation. They are NOT a default answer to cravings, boredom, sadness, or routine check-ins.
- When a technique IS warranted, vary the toolbox and match it to what the user actually described: urge surfing, HALT check, grounding 5-4-3-2-1, cognitive reframe, a 2-minute walk, cold water, texting a friend, journaling the trigger, the money jar, an if-then plan.
- TIMING CONTEXT (background knowledge, not a script):
  - Slip just happened → defuse AVE first, then identify the trigger, then ONE small 48-hour step.
  - Day 1–3 → reassurance; name day 3 as the biological peak; no technique unless asked.
  - Day 4–14 → reframing and habit substitution fit best.
  - 2+ slips in a week → gently raise discussing pharmacotherapy with a clinician.`;

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
- smoking status NOW: ${(() => { const r = relapseStatus(state); return r.activelySmoking ? `ACTIVELY SMOKING again (${r.smokeDays7}/7 days). Treat with compassion: this is a relapse, not a one-off. Don't congratulate a "clean streak". Gently support a fresh restart and the next single step.` : `not actively smoking (${r.smokeDays7}/7 recent smoking days)`; })()}
- last cravings: ${recent.map((c) => `${c.intensity}/10 ${c.outcome}`).join(' | ') || 'none'}
- has goal: ${p.goalLabel ? `"${p.goalLabel}" for ${p.goalAmount} ${p.currency}` : 'no'}
- deposit contract: ${p.committedAmount ? `${p.committedAmount} ${p.currency} with ${p.contractPartner ?? 'unnamed'}` : 'no'}
- medication: ${p.medication ?? 'none chosen'}${p.medication && p.medicationStartedAt ? ` (since day ${Math.floor((Date.now() - p.medicationStartedAt) / 86400_000) + 1})` : ''}
- current step: ${p.currentStep ? `${getStep(p.currentStep).index} (${getStep(p.currentStep).titleEn})` : 'unset'}
- protocol phase: ${(() => { const g = preQuitGraceEnd(p); if (Date.now() < g) { const qd = methodQuitDay(p.currentStep); return `PRE-QUIT PREPARATION — smoking is still ALLOWED per the medication protocol until quit day (day ${qd} of the course). If the user says they smoked, this is NOT a lapse: reassure, do not run slip analysis, remind that the quit day is coming.`; } return 'past quit day — abstinence phase, a smoked cigarette is a lapse'; })()}
- track day: ${programToday(state).day} of ${programToday(state).total}
- today's track focus: ${(() => { const d = programToday(state).data; return d ? (locale === 'ru' ? d.focusRu : d.focusEn) : '—'; })()}
- today's medication action: ${(() => { const d = programToday(state).data; return (d as any)?.medRu ? (locale === 'ru' ? (d as any).medRu : (d as any).medEn) : 'none'; })()}
- importance/confidence: ${p.importance ?? '?'}/${p.confidence ?? '?'} (0–10)
- health flags (pharma safety): ${(p.healthFlags ?? []).join(', ') || 'none'}
- pregnancy: ${p.healthFlags?.includes('pregnant') ? 'YES — never suggest medication, behavioural support only' : 'no'}
- known excuses: ${(p.topExcuses ?? []).join(', ') || 'none disclosed'}
- past attempts: ${(p.pastAttempts ?? []).map(a => `${a.method}/${a.longestDays}d`).join('; ') || 'none'}
- right now it is: ${(() => { const d = new Date(); const h = d.getHours(); const part = h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; const wd = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]; return `${wd} ${part}, ${h}:${String(d.getMinutes()).padStart(2, '0')} local — greet/talk accordingly`; })()}
- ${cravingStatsLine(state)}${recentCravingLine(state)}${factsBlock(state)}${priorSummary ? `\n\nPRIOR CONVERSATION SUMMARY (earlier in this same relationship — continue from it, don't ask things already covered):\n${priorSummary}` : ''}`;

  const modeBlock = mode === 'support'
    ? 'Mode: SUPPORT. The user opened a conversation — they may be craving, venting, or just wanting to talk. FIRST listen and reflect; understand what is actually going on before doing anything else. Do NOT offer a technique in your first reply unless the user describes an acute urge happening right now. Follow the CONVERSATION & TECHNIQUE RULES strictly.'
    : mode === 'analyze_slip'
      ? 'Mode: SLIP ANALYSIS. The user just slipped. No shame. Identify the trigger, propose ONE specific 48h adjustment.'
      : 'Mode: DAILY TASK. Give ONE concrete micro-task for today, ≤2 min, tailored to triggers and archetype.';

  const personaBlock = getPersona(personaId).promptBlock;
  return [role, personaBlock, ctx, modeBlock].join('\n\n');
}

async function callDirect(key: string, messages: ChatMessage[], model: string, maxTokens = 600): Promise<string> {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://quitsmoke.app',
      'X-Title': 'Quit Smoking',
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens, stream: false }),
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

// Parse OpenRouter SSE text into the concatenated assistant content so far.
function parseSSE(raw: string): string {
  let out = '';
  for (const line of raw.split('\n')) {
    const l = line.trim();
    if (!l.startsWith('data:')) continue;
    const payload = l.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try { out += JSON.parse(payload)?.choices?.[0]?.delta?.content ?? ''; } catch {}
  }
  return out;
}

// Streaming chat — tokens arrive progressively via onToken(fullSoFar). RN fetch
// can't stream a body reader, so we use XHR.onprogress. Rejects on error so the
// caller can fall back to the non-streaming chat().
export function chatStream(
  state: AppState, locale: 'ru' | 'en', mode: PromptMode, history: ChatMessage[],
  onToken: (fullSoFar: string) => void, personaId?: PersonaId, priorSummary?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const userKey = state.profile?.openrouterKey?.trim();
    const userModel = state.profile?.openrouterModel?.trim();
    const key = userKey || ENV_KEY;
    if (!key) { reject(new Error('no-key')); return; }
    const isCall = mode === 'call';
    const model = isCall ? CALL_MODEL : (userModel || ENV_MODEL || DEFAULT_MODEL);
    const maxTokens = isCall ? 120 : 600;
    const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(state, locale, mode, personaId, priorSummary) }, ...history];
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://openrouter.ai/api/v1/chat/completions');
      xhr.setRequestHeader('Authorization', `Bearer ${key}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('HTTP-Referer', 'https://quitsmoke.app');
      xhr.setRequestHeader('X-Title', 'Quit Smoking');
      xhr.timeout = 60000;
      xhr.onprogress = () => { try { onToken(parseSSE(xhr.responseText)); } catch {} };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(parseSSE(xhr.responseText));
        else reject(new Error(`http ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('network'));
      xhr.ontimeout = () => reject(new Error('timeout'));
      xhr.send(JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens, stream: true }));
    } catch (e) { reject(e as Error); }
  });
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

export async function chat(state: AppState, locale: 'ru' | 'en', mode: PromptMode, history: ChatMessage[], personaId?: PersonaId, priorSummary?: string): Promise<string> {
  const userKey = state.profile?.openrouterKey?.trim();
  const userModel = state.profile?.openrouterModel?.trim();
  const key = userKey || ENV_KEY;
  const isCall = mode === 'call';
  // The call is real-time: force a fast model + tiny token budget (1–2 spoken
  // sentences) so replies come back in ~1s, not the multi-second flagship lag.
  const model = isCall ? CALL_MODEL : (userModel || ENV_MODEL || DEFAULT_MODEL);
  const maxTokens = isCall ? 120 : 600;

  if (!key && !PROXY_URL) {
    return locale === 'ru'
      ? 'Чтобы помощник заработал — открой «Я» → «ИИ помощник» и вставь свой ключ OpenRouter (получить бесплатно: openrouter.ai → Keys).'
      : 'To enable the coach — open "Me" → "AI coach" and paste your OpenRouter key (get one free at openrouter.ai → Keys).';
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(state, locale, mode, personaId, priorSummary) },
    ...history,
  ];
  if (key) {
    try { return await callDirect(key, messages, model, maxTokens); }
    catch (e: any) {
      try { return await callDirect(key, messages, FALLBACK, maxTokens); }
      catch (e2: any) { throw new Error(e2?.message || 'OpenRouter error'); }
    }
  }
  return callProxy(messages, locale);
}

// A proactive FIRST line from Breeze when a chat is opened with intent (from a
// push or SOS), instead of a static "how can I help?". Generated from full
// context so it lands personal: time of day, recent craving, the week's data,
// known facts. Returns null on any failure (caller falls back to static text).
export type Opener = 'generic' | 'evening' | 'weekly' | 'sos' | 'morning';

const OPENER_DIRECTIVE: Record<Opener, { ru: string; en: string }> = {
  generic: { ru: 'Открой разговор тёплой персональной репликой по контексту (время суток, день программы). 1–2 фразы + один открытый вопрос.', en: 'Open with a warm personal line from context (time of day, program day). 1–2 sentences + one open question.' },
  morning: { ru: 'Утро. Поздоровайся по-утреннему, отметь день программы, и спроси, как настрой на день. 1–2 фразы.', en: 'Morning. Greet, note the program day, ask about the day ahead. 1–2 sentences.' },
  evening: { ru: 'Вечер, конец дня. Тепло спроси, как прошёл день, отметив контекст (день программы, опасное время если близко). 1–2 фразы.', en: 'Evening. Warmly ask how the day went, noting context. 1–2 sentences.' },
  sos: { ru: 'Юзер только что был в кризис-режиме (тяга). Спокойно подхвати: отметь, что он пришёл, и спроси, что сейчас происходит. 1–2 фразы.', en: 'The user just came from a craving SOS. Calmly pick it up: note they reached out, ask what is happening now. 1–2 sentences.' },
  weekly: { ru: 'Воскресный разбор недели. Коротко отрази 1–2 реальных факта недели из данных (дни без сигарет, деньги, паттерн тяги или прогресс) тёплыми словами и задай один вопрос про следующую неделю. 2–3 фразы, без списков.', en: 'Sunday weekly reflection. Briefly reflect 1–2 real facts from this week\'s data warmly, then ask one question about next week. 2–3 sentences, no lists.' },
};

export async function proactiveOpener(
  state: AppState, locale: 'ru' | 'en', opener: Opener = 'generic', personaId?: PersonaId,
): Promise<string | null> {
  try {
    const key = state.profile?.openrouterKey?.trim() || ENV_KEY;
    if (!key) return null;
    const dir = OPENER_DIRECTIVE[opener] ?? OPENER_DIRECTIVE.generic;
    const sys = buildSystemPrompt(state, locale, 'support', personaId);
    const instruction = `${locale === 'ru' ? dir.ru : dir.en}\nYou are speaking FIRST, the user has not written anything yet. Reply ONLY in ${locale === 'ru' ? 'Russian' : 'English'}, plain text, no markers, no markdown.`;
    const messages: ChatMessage[] = [
      { role: 'system', content: sys },
      { role: 'user', content: `[SYSTEM: ${instruction}]` },
    ];
    const text = await callDirect(key, messages, ENV_MODEL || DEFAULT_MODEL, 200);
    const clean = text.trim();
    return clean.length > 4 ? clean : null;
  } catch {
    return null;
  }
}
