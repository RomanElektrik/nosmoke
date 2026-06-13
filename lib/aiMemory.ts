// Long-term memory for the coach. After a conversation, a cheap model distills
// durable personal facts («дочь Алиса», «работает сменами», «дыхание не
// помогает, помогает прогулка») and they are injected into every future system
// prompt — so Breeze remembers the person across sessions, not just within one
// thread. Extraction is fire-and-forget and throttled; failures are silent.

import type { AppState } from './storage';
import { update } from './storage';

type ChatMessage = { role: string; content: string };

export type AiFact = { text: string; ts: number };

export const MAX_AI_FACTS = 25;
// Extract at most once per this many NEW user messages in a thread.
export const EXTRACT_EVERY_N_USER_MSGS = 4;

const ENV_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY || '';
// Cheapest adequate model — extraction & summary are trivial work.
const EXTRACT_MODEL = 'google/gemini-2.5-flash-lite';

// Above this many messages in a thread we roll the older ones into a summary
// and only send the live tail to the model — a month-long relationship stays
// in context without paying for the whole history each turn.
export const SUMMARIZE_OVER = 24;
export const KEEP_TAIL = 12;

const EXTRACT_PROMPT = `You extract DURABLE personal facts about a user from a quit-smoking support chat.
Return a JSON array of 0-3 SHORT facts in Russian (each ≤ 90 chars). Only include facts that will still matter in a month:
- names/relations of close people, job/schedule, city
- what concretely HELPS or DOES NOT help this user against cravings
- important life events, strong personal reasons for quitting
DO NOT include: moods of the day, greetings, current craving levels, anything already obvious from app data (days clean, money).
If nothing durable — return [].
Answer with ONLY the JSON array, no prose.`;

export function knownFacts(state: AppState): AiFact[] {
  return state.profile?.aiFacts ?? [];
}

export function factsBlock(state: AppState): string {
  const facts = knownFacts(state);
  if (facts.length === 0) return '';
  return `\nKNOWN FACTS ABOUT THE USER (from previous conversations — use them naturally, never recite the list):\n${facts.map((f) => `- ${f.text}`).join('\n')}`;
}

// Fire-and-forget: distill new facts from the tail of a conversation and merge
// them into the profile. Never throws.
export async function extractFacts(state: AppState, messages: ChatMessage[]): Promise<void> {
  try {
    const key = state.profile?.openrouterKey?.trim() || ENV_KEY;
    if (!key) return;
    const tail = messages.slice(-8)
      .map((m) => `${m.role === 'user' ? 'USER' : 'COACH'}: ${m.content}`)
      .join('\n');
    const existing = knownFacts(state).map((f) => f.text).join('\n');
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EXTRACT_MODEL,
        temperature: 0,
        max_tokens: 200,
        messages: [
          { role: 'system', content: EXTRACT_PROMPT },
          { role: 'user', content: `ALREADY KNOWN (do not repeat):\n${existing || '—'}\n\nCHAT:\n${tail}` },
        ],
      }),
    });
    if (!r.ok) return;
    const data = await r.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '[]';
    const jsonStr = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
    const fresh: unknown = JSON.parse(jsonStr);
    if (!Array.isArray(fresh)) return;
    const cleaned = fresh
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter((x) => x.length > 3 && x.length <= 120);
    if (cleaned.length === 0) return;
    await update((s) => {
      const cur = s.profile?.aiFacts ?? [];
      const known = new Set(cur.map((f) => f.text.toLowerCase()));
      const add = cleaned
        .filter((x) => !known.has(x.toLowerCase()))
        .map((text) => ({ text, ts: Date.now() }));
      if (add.length === 0 || !s.profile) return s;
      return {
        ...s,
        profile: { ...s.profile, aiFacts: [...cur, ...add].slice(-MAX_AI_FACTS) },
      };
    });
  } catch {
    // memory is a bonus, never an error surface
  }
}

const SUMMARY_PROMPT = `You compress a long quit-smoking coaching conversation into a running summary for the coach's own memory.
Write 2-4 short sentences in Russian, third-person, capturing only what matters for continuing the relationship: what the user is going through, what was tried and how it went, agreements/next steps, emotional state. Merge the PREVIOUS SUMMARY with the NEW MESSAGES. No greetings, no meta, no markdown. Output ONLY the summary text.`;

// Roll the older half of a long thread into a compact summary. Returns the new
// summary text or null on failure / nothing to do. Caller stores it on the
// thread and sends only the tail afterwards. Never throws.
export async function summarizeOlderMessages(
  state: AppState,
  messages: ChatMessage[],
  prevSummary: string | undefined,
): Promise<string | null> {
  try {
    const key = state.profile?.openrouterKey?.trim() || ENV_KEY;
    if (!key) return null;
    const older = messages.slice(0, Math.max(0, messages.length - KEEP_TAIL));
    if (older.length === 0) return null;
    const block = older
      .map((m) => `${m.role === 'user' ? 'USER' : 'COACH'}: ${m.content}`)
      .join('\n');
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EXTRACT_MODEL,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: 'system', content: SUMMARY_PROMPT },
          { role: 'user', content: `PREVIOUS SUMMARY:\n${prevSummary || '—'}\n\nNEW MESSAGES:\n${block}` },
        ],
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const text: string = (data?.choices?.[0]?.message?.content ?? '').trim();
    return text.length > 10 ? text.slice(0, 600) : null;
  } catch {
    return null;
  }
}
