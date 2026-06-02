// Voice for the call — routed through OpenRouter TTS (no ElevenLabs payment
// problem: uses the SAME OpenRouter key the AI chat already uses).
// Default model GPT-4o Mini TTS (~$0.0005/call, supports Russian). Override via
// EXPO_PUBLIC_TTS_MODEL / EXPO_PUBLIC_TTS_VOICE to use Grok/Gemini/etc.
//
// Everything degrades gracefully (returns null) → caller falls back to the
// system voice, then captions. The call NEVER breaks.

const OR_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY || '';
const TTS_MODEL = process.env.EXPO_PUBLIC_TTS_MODEL || 'openai/gpt-4o-mini-tts';
const TTS_VOICE = process.env.EXPO_PUBLIC_TTS_VOICE || 'alloy';

export const hasVoice = !!OR_KEY;

// Legacy file API is the battle-tested path for writing binary → file.
let FS: any = null;
try { FS = require('expo-file-system/legacy'); } catch {}
try { if (!FS?.writeAsStringAsync) FS = require('expo-file-system'); } catch {}

let counter = 0;

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

// Synthesize one line → local mp3 file uri, or null if unavailable.
export async function synthLine(text: string, _lang: 'ru' | 'en'): Promise<string | null> {
  if (!OR_KEY || !FS?.writeAsStringAsync || !FS?.cacheDirectory) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://breeze.app',
        'X-Title': 'Breeze',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: text,
        voice: TTS_VOICE,
        response_format: 'mp3',
      }),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength < 64) return null;
    const b64 = bytesToBase64(new Uint8Array(buf));
    const uri = `${FS.cacheDirectory}breeze_voice_${counter++}.mp3`;
    await FS.writeAsStringAsync(uri, b64, { encoding: FS.EncodingType?.Base64 ?? 'base64' });
    return uri;
  } catch {
    return null;
  }
}
