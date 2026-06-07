// Single shared audio engine with OWNERSHIP — guarantees exactly one sound in
// the whole app at any moment, and a hard stop on exit.
//
// Why ownership: if the user taps fast and two player/call screens mount, they
// all share this module. Each screen claims ownership; only the current owner
// may play. A superseded screen's calls become no-ops (resolve false) instead
// of fighting over the speaker — kills the "several voices / bam-bam" overlap.
//
// `epoch` invalidates any in-flight playback the instant something supersedes it
// (new line, pause, stop, claim) so audio never lingers after you leave.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let Speech: any = null;
try { Speech = require('expo-speech'); } catch {}

let active: any = null;     // the one live player
let epoch = 0;             // bumps on every play/stop/claim — invalidates stale callbacks
let owner: string | null = null;
let seq = 0;

export function newOwner(): string { return 'o' + (++seq); }

export async function ensureSpeaker(): Promise<void> {
  try { await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }); } catch {}
}

function killActive() {
  const p = active; active = null;
  if (p) { try { p.pause?.(); } catch {} try { p.remove?.(); } catch {} }
  try { Speech?.stop?.(); } catch {}
}

// Take exclusive control. Anything currently playing (from any screen) stops.
export function claimAudio(id: string) { owner = id; epoch++; killActive(); }

// Give up control (on unmount/blur). Only stops if you still hold it, so a
// stale screen unmounting underneath a new one can't kill the new one's audio.
export function releaseAudio(id: string) { if (owner !== id) return; owner = null; epoch++; killActive(); }

// Stop current sound but KEEP ownership (used for pause). No-op if not owner.
export function stopAudio(id?: string) { if (id && owner && owner !== id) return; epoch++; killActive(); }

function applyRate(player: any, rate: number) {
  if (!rate || rate === 1) return;
  try { player.shouldCorrectPitch = true; } catch {}
  try { player.setPlaybackRate?.(rate, true); } catch {}
  try { player.playbackRate = rate; } catch {}
}

// Play a file. Resolves true only if it actually played to the end. Resolves
// false immediately if the caller isn't the owner (locked out) or it's superseded.
export function playFile(uri: string, rate = 1, id?: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (id && owner && owner !== id) { resolve(false); return; }   // locked out
    epoch++; const my = epoch; killActive();
    let done = false, started = false, ever = false;
    const fin = (ok: boolean) => { if (done) return; done = true; resolve(ok); };
    try {
      const player = createAudioPlayer({ uri });
      active = player;
      try { player.volume = 1.0; } catch {}
      applyRate(player, rate);
      const sub = player.addListener('playbackStatusUpdate', (st: any) => {
        if (my !== epoch) { try { sub?.remove?.(); } catch {} try { player.pause?.(); } catch {} try { player.remove?.(); } catch {} fin(false); return; }
        if (st?.isLoaded && !started) { started = true; applyRate(player, rate); try { player.play(); } catch {} }
        if (st?.playing) ever = true;
        if (st?.didJustFinish || st?.error) {
          if (st?.error) console.warn('[audio] play error', st.error);
          try { sub?.remove?.(); } catch {} try { player.remove?.(); } catch {}
          if (active === player) active = null;
          fin(ever && !st?.error);
        }
      });
      try { player.play(); } catch {}
      setTimeout(() => { if (my === epoch && !ever) { try { player.remove?.(); } catch {} if (active === player) active = null; fin(false); } }, 4000);
      setTimeout(() => fin(ever), 180000);
    } catch (e: any) { console.warn('[audio] error', e?.message); fin(false); }
  });
}

// ── Continuous track playback (recorded audio practices) ───────────────────
// A persistent player you control (play/pause/seek) and poll for position — so
// the practice player can have a real draggable scrubber. Goes through the same
// ownership/epoch, so it can't overlap with the call or another player.
export function playTrack(source: number | string, opts: { rate?: number; id?: string; onFinish?: () => void } = {}): boolean {
  const { rate = 1, id, onFinish } = opts;
  if (id && owner && owner !== id) return false;
  epoch++; const my = epoch; killActive();
  try {
    const player = createAudioPlayer(typeof source === 'number' ? source : { uri: source });
    active = player;
    try { player.volume = 1.0; } catch {}
    applyRate(player, rate);
    const sub = player.addListener('playbackStatusUpdate', (st: any) => {
      if (my !== epoch) { try { sub?.remove?.(); } catch {} try { player.pause?.(); } catch {} try { player.remove?.(); } catch {} return; }
      if (st?.error) console.warn('[audio] track error', st.error);
      if (st?.didJustFinish) { try { onFinish?.(); } catch {} }
    });
    try { player.play(); } catch {}
    return true;
  } catch (e: any) { console.warn('[audio] track error', e?.message); return false; }
}
export function trackPause() { try { active?.pause?.(); } catch {} }
export function trackResume() { try { active?.play?.(); } catch {} }
export function trackSeek(sec: number) { try { active?.seekTo?.(sec); } catch {} }
export function trackSetRate(rate: number) { if (active) applyRate(active, rate); }
export function trackStatus(): { pos: number; dur: number; playing: boolean } {
  try { return { pos: active?.currentTime ?? 0, dur: active?.duration ?? 0, playing: !!active?.playing }; }
  catch { return { pos: 0, dur: 0, playing: false }; }
}

// System TTS fallback — also gated by ownership + exclusive.
export function speakFallback(text: string, lang: 'ru' | 'en', rate = 1, id?: string): Promise<void> {
  return new Promise<void>((resolve) => {
    if (id && owner && owner !== id) { resolve(); return; }
    epoch++; try { Speech?.stop?.(); } catch {}
    let done = false;
    const fin = () => { if (done) return; done = true; resolve(); };
    try { Speech?.speak?.(text, { language: lang === 'ru' ? 'ru-RU' : 'en-US', rate: 0.95 * rate, onDone: fin, onError: fin }); }
    catch { fin(); }
    if (!Speech?.speak) { setTimeout(fin, 1200 + text.length * 45); return; }
    setTimeout(fin, (2600 + text.length * 60) / Math.max(0.6, rate));
  });
}
