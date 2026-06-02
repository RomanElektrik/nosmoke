// Premium voice via ElevenLabs TTS (turn-based). Each line is synthesized to
// a cached mp3 and played by the call screen. Everything degrades gracefully:
// no key / error / missing native module → returns null and the caller falls
// back to the free system voice, then to captions. The call NEVER breaks.
//
// Setup: put your key in eas.json production env as EXPO_PUBLIC_ELEVENLABS_KEY
// (free tier at elevenlabs.io). Optional EXPO_PUBLIC_ELEVENLABS_VOICE to pick
// a voice id. Only premium users trigger this (free = system voice) — so the
// per-call cost is only ever spent on paying users.

const ELEVEN_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_KEY || '';
// Default: a warm, calm multilingual voice (eleven_multilingual_v2 speaks RU).
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE || 'XrExE9yKIg1WjnnlVkGX';

export const hasElevenVoice = !!ELEVEN_KEY;

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
export async function synthLine(text: string, lang: 'ru' | 'en'): Promise<string | null> {
  if (!ELEVEN_KEY || !FS?.writeAsStringAsync || !FS?.cacheDirectory) return null;
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
      }),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const b64 = bytesToBase64(new Uint8Array(buf));
    const uri = `${FS.cacheDirectory}breeze_voice_${counter++}.mp3`;
    await FS.writeAsStringAsync(uri, b64, { encoding: FS.EncodingType?.Base64 ?? 'base64' });
    return uri;
  } catch {
    return null;
  }
}
