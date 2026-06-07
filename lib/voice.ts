// Voice for the call — routed through OpenRouter TTS (no ElevenLabs payment
// problem: uses the SAME OpenRouter key the AI chat already uses).
// Default model Gemini 3.1 Flash TTS (native Russian, PCM output). Synthesized
// audio is cached by text, so repeated lines (e.g. the opening) cost nothing.
// Override via EXPO_PUBLIC_TTS_MODEL / EXPO_PUBLIC_TTS_VOICE.
//
// Everything degrades gracefully (returns null) → caller falls back to the
// system voice, then captions. The call NEVER breaks.

const OR_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY || '';
// Gemini 3.1 Flash TTS — native, accent-free Russian. Outputs PCM (handled below).
const TTS_MODEL = process.env.EXPO_PUBLIC_TTS_MODEL || 'google/gemini-3.1-flash-tts-preview';
const TTS_VOICE = process.env.EXPO_PUBLIC_TTS_VOICE || 'Sulafat';
const STT_MODEL = process.env.EXPO_PUBLIC_STT_MODEL || 'openai/gpt-4o-mini-transcribe';
// Tone steering (supported by gpt-4o-mini-tts) — a warm, calm coach.
const TTS_INSTRUCTIONS = 'Speak in a warm, calm, caring tone — like a close friend talking someone through a hard moment. Unhurried, grounded, reassuring.';
// Gemini TTS understands a natural-language style prefix — this is what turns a
// flat, robotic read into a warm human delivery. Bump STYLE_VER to bust cache.
const TTS_STYLE = 'Say this warmly, gently and very humanly, unhurried, like a caring friend speaking softly:';
const STYLE_VER = 'v2';

// Two clean selectable voices (Gemini).
export type VoiceGender = 'f' | 'm';
export const VOICES: { id: string; gemini: string; ru: string; en: string; gender: VoiceGender }[] = [
  { id: 'female', gemini: 'Sulafat', ru: 'Женский', en: 'Female', gender: 'f' },
  { id: 'male',   gemini: 'Charon',  ru: 'Мужской', en: 'Male',   gender: 'm' },
];
export function geminiVoiceFor(voiceId?: string): string {
  return VOICES.find((v) => v.id === voiceId)?.gemini || TTS_VOICE;
}

export const hasVoice = !!OR_KEY;

// Gemini TTS returns raw PCM and only accepts response_format="pcm".
const isPcmModel = /gemini/i.test(TTS_MODEL);

// Legacy file API is the battle-tested path for writing binary → file.
let FS: any = null;
try { FS = require('expo-file-system/legacy'); } catch {}
try { if (!FS?.writeAsStringAsync) FS = require('expo-file-system'); } catch {}

// Cache synthesized audio by (model, voice, text). The opening line is the
// same every call and many short phrases repeat — synth once, then it's free.
const memTtsCache = new Map<string, string>();
function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function bytesToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    result += chars[bytes[i] >> 2];
    result += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += chars[bytes[i + 2] & 63];
  }
  if (i < bytes.length) {
    result += chars[bytes[i] >> 2];
    if (i === bytes.length - 1) {
      result += chars[(bytes[i] & 3) << 4];
      result += '==';
    } else {
      result += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      result += chars[(bytes[i + 1] & 15) << 2];
      result += '=';
    }
  }
  return result;
}

// Wrap raw 16-bit PCM (Gemini outputs 24kHz mono) in a WAV container so the
// audio player can play it.
function pcmToWav(pcm: Uint8Array, sampleRate = 24000, channels = 1, bits = 16): Uint8Array<ArrayBuffer> {
  const blockAlign = (channels * bits) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataLen = pcm.length;
  const out = new Uint8Array(44 + dataLen);
  const dv = new DataView(out.buffer);
  let o = 0;
  const ws = (s: string) => { for (let i = 0; i < s.length; i++) out[o++] = s.charCodeAt(i); };
  ws('RIFF'); dv.setUint32(o, 36 + dataLen, true); o += 4; ws('WAVE');
  ws('fmt '); dv.setUint32(o, 16, true); o += 4; dv.setUint16(o, 1, true); o += 2;
  dv.setUint16(o, channels, true); o += 2; dv.setUint32(o, sampleRate, true); o += 4;
  dv.setUint32(o, byteRate, true); o += 4; dv.setUint16(o, blockAlign, true); o += 2;
  dv.setUint16(o, bits, true); o += 2;
  ws('data'); dv.setUint32(o, dataLen, true); o += 4;
  out.set(pcm, 44);
  return out;
}

// Synthesize one line → local audio file uri, or null if unavailable.
// Handles both mp3 (OpenAI) and raw PCM (Gemini) responses by content-type.
export async function synthLine(text: string, _lang: 'ru' | 'en', voice?: string): Promise<string | null> {
  if (!OR_KEY || !FS?.writeAsStringAsync || !FS?.cacheDirectory) return null;

  // Reuse a cached file if we've synthesized this exact line+voice before (free).
  const useVoice = voice || TTS_VOICE;
  const ext = isPcmModel ? 'wav' : 'mp3';
  const key = hashKey(`${TTS_MODEL}|${useVoice}|${STYLE_VER}|${text}`);
  const cacheUri = `${FS.cacheDirectory}breeze_tts_${key}.${ext}`;
  const mem = memTtsCache.get(key);
  if (mem) return mem;
  try { const info = await FS.getInfoAsync?.(cacheUri); if (info?.exists && (info.size ?? 0) > 64) { memTtsCache.set(key, cacheUri); return cacheUri; } } catch {}

  try {
    const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://breeze.app',
        'X-Title': 'Breeze',
      },
      body: JSON.stringify(
        isPcmModel
          ? { model: TTS_MODEL, input: `${TTS_STYLE} ${text}`, voice: useVoice, response_format: 'pcm' }
          : { model: TTS_MODEL, input: text, voice: useVoice, instructions: TTS_INSTRUCTIONS, response_format: 'mp3' }
      ),
    });
    if (!res.ok) { try { console.warn('[TTS] HTTP', res.status, (await res.text()).slice(0, 300)); } catch {} return null; }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    let bytes: Uint8Array = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength < 64) { console.warn('[TTS] tiny/empty audio', bytes.byteLength, ct); return null; }
    if (isPcmModel || ct.includes('pcm') || ct.includes('l16') || ct.includes('raw')) bytes = pcmToWav(bytes) as Uint8Array;
    const b64 = bytesToBase64(bytes);
    await FS.writeAsStringAsync(cacheUri, b64, { encoding: FS.EncodingType?.Base64 ?? 'base64' });
    memTtsCache.set(key, cacheUri);
    return cacheUri;
  } catch (e: any) {
    console.warn('[TTS] error', e?.message);
    return null;
  }
}

// Speech-to-text: transcribe a recorded audio file → text (or null).
// OpenRouter STT wants a JSON body with base64 input_audio (not multipart).
export async function transcribe(fileUri: string, lang: 'ru' | 'en'): Promise<string | null> {
  if (!OR_KEY || !fileUri || !FS?.readAsStringAsync) return null;
  try {
    const b64 = await FS.readAsStringAsync(fileUri, { encoding: FS.EncodingType?.Base64 ?? 'base64' });
    const fmt = fileUri.toLowerCase().endsWith('.wav') ? 'wav'
      : fileUri.toLowerCase().endsWith('.mp3') ? 'mp3'
      : fileUri.toLowerCase().endsWith('.caf') ? 'caf' : 'm4a';
    const res = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: STT_MODEL,
        input_audio: { data: b64, format: fmt },
        language: lang,
      }),
    });
    if (!res.ok) { try { console.warn('[STT] HTTP', res.status, (await res.text()).slice(0, 300)); } catch {} return null; }
    const data = await res.json();
    const text = (data?.text ?? data?.transcript ?? data?.transcription ?? '').trim();
    if (!text) console.warn('[STT] empty result, keys:', Object.keys(data || {}).join(','));
    return text || null;
  } catch (e: any) {
    console.warn('[STT] error', e?.message);
    return null;
  }
}
