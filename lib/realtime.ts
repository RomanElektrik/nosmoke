// Real-time voice scaffold (NOT wired yet — see REALTIME.md).
//
// True low-latency duplex ("живой разговор") with Бриз needs:
//   1. A dev build (react-native-webrtc / native WebSocket audio) — NOT Expo Go.
//   2. A tiny backend that mints EPHEMERAL session keys (never ship the real key).
//   3. OpenAI Realtime (gpt-4o-realtime, WebRTC) or Gemini Live (WebSocket).
//
// This module defines the shape the call screen will consume so the UI work can
// land now and the transport can be dropped in later behind a flag.

export type RealtimeStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'closed';

export type RealtimeSession = {
  status: RealtimeStatus;
  /** Begin the live session (mic open, model streaming audio back). */
  start(): Promise<void>;
  /** End and release mic/connection. */
  stop(): void;
  /** Subscribe to status changes. Returns an unsubscribe fn. */
  onStatus(cb: (s: RealtimeStatus) => void): () => void;
  /** Subscribe to live transcript (partial + final). */
  onTranscript(cb: (text: string, final: boolean) => void): () => void;
};

export const REALTIME_ENABLED =
  (process.env.EXPO_PUBLIC_REALTIME_ENABLED || '') === '1';
export const REALTIME_TOKEN_URL = process.env.EXPO_PUBLIC_REALTIME_TOKEN_URL || '';

// Placeholder factory — throws until a transport is implemented in a dev build.
export function createRealtimeSession(): RealtimeSession {
  throw new Error('Realtime not available: requires a dev build + token backend (see REALTIME.md).');
}
