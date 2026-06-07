// Audio practice player. Two modes:
//  • Recorded (practice.audio set): one continuous track + a REAL draggable
//    scrubber, ±15s, speed. Like a normal player.
//  • TTS fallback (no file yet): the cached Gemini voice speaks the steps,
//    with prev/next-step, speed and voice. No "step N/M" clutter.
// All audio goes through lib/audio (single owner, hard-stop on exit).

import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, Easing, cancelAnimation } from 'react-native-reanimated';
import { spacing } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { useAppState, update } from '../../lib/storage';
import { Icon } from '../../components/Icon';
import { getPractice, PRACTICES } from '../../lib/audioPractice';
import { synthLine, hasVoice, VOICES, geminiVoiceFor } from '../../lib/voice';
import {
  playFile, speakFallback, ensureSpeaker, claimAudio, releaseAudio, newOwner, stopAudio,
  playTrack, trackPause, trackResume, trackSeek, trackSetRate, trackStatus,
} from '../../lib/audio';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const RATES = [0.75, 1, 1.25, 1.5];
const fmt = (s: number) => { s = Math.max(0, Math.floor(s || 0)); const m = Math.floor(s / 60); const ss = s % 60; return `${m}:${ss < 10 ? '0' : ''}${ss}`; };

export default function AudioPlayer() {
  const router = useRouter();
  const lang = currentLang();
  const ru = lang === 'ru';
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state] = useAppState();
  const practice = getPractice(id);
  const steps = practice?.steps ?? [];
  const total = steps.length;
  const recorded = !!practice?.audio;

  const [voiceId, setVoiceId] = useState<string>(state.profile?.voiceId || 'female');
  const [rate, setRate] = useState(1);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);

  const idxRef = useRef(0);
  const rateRef = useRef(1);
  const voiceRef = useRef(voiceId);
  const genRef = useRef(0);
  const playingRef = useRef(false);
  const draggingRef = useRef(false);
  const audioIdRef = useRef<string | undefined>(undefined);
  if (!audioIdRef.current) audioIdRef.current = newOwner();
  const audioId = audioIdRef.current;
  const orb = useSharedValue(1);

  // Sibling navigation — left/right buttons (and horizontal swipe) flip through
  // practices like tracks in a playlist. Wraps around.
  const pIdx = Math.max(0, PRACTICES.findIndex((p) => p.id === id));
  const prevP = PRACTICES[(pIdx - 1 + PRACTICES.length) % PRACTICES.length];
  const nextP = PRACTICES[(pIdx + 1) % PRACTICES.length];
  function goPractice(target: typeof PRACTICES[number]) {
    if (!target || target.id === id) return;
    Haptics.selectionAsync();
    genRef.current++;
    stopAudio(audioId);
    router.replace(`/audio/${target.id}` as any);
  }

  // Horizontal swipe on the body — left/right swaps practice.
  const swipePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
    onPanResponderRelease: (_e, g) => { if (g.dx < -60) goPractice(nextP); else if (g.dx > 60) goPractice(prevP); },
  })).current;

  const current = steps[idx];
  const caption = finished
    ? (ru ? 'Готово. Ты дал себе пару спокойных минут.' : 'Done. You gave yourself a few calm minutes.')
    : current ? (ru ? current.ru : current.en) : '';

  function gentle() { cancelAnimation(orb); orb.value = withRepeat(withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.ease) }), -1, true); }
  function breathe() { cancelAnimation(orb); orb.value = withRepeat(withTiming(1.34, { duration: 4200, easing: Easing.inOut(Easing.ease) }), -1, true); }
  function rest() { cancelAnimation(orb); orb.value = withSpring(1); }

  // ─────────────── RECORDED MODE ───────────────
  useEffect(() => {
    if (!recorded || !practice?.audio) return;
    claimAudio(audioId);
    ensureSpeaker();
    playTrack(practice.audio, { rate: rateRef.current, id: audioId, onFinish: () => { setPlaying(false); rest(); } });
    setPlaying(true); gentle();
    const iv = setInterval(() => {
      const st = trackStatus();
      if (st.dur) setDur(st.dur);
      if (!draggingRef.current) setPos(st.pos);
      setPlaying(st.playing);
    }, 250);
    return () => clearInterval(iv);
  }, []);

  function recToggle() {
    Haptics.selectionAsync();
    if (playing) { trackPause(); setPlaying(false); rest(); }
    else { trackResume(); setPlaying(true); gentle(); }
  }
  function recSkip(delta: number) { Haptics.selectionAsync(); const s = Math.max(0, Math.min(dur || 0, pos + delta)); trackSeek(s); setPos(s); }
  function onScrub(frac: number, final: boolean) {
    const s = frac * (dur || 0);
    setPos(s);
    if (final) { trackSeek(s); draggingRef.current = false; } else { draggingRef.current = true; }
  }

  // ─────────────── TTS FALLBACK MODE ───────────────
  async function playLine(text: string, myGen: number) {
    let uri: string | null = null;
    if (hasVoice) uri = await synthLine(text, ru ? 'ru' : 'en', geminiVoiceFor(voiceRef.current));
    if (myGen !== genRef.current) return;
    if (uri) { const ok = await playFile(uri, rateRef.current, audioId); if (ok) return; }
    if (myGen !== genRef.current) return;
    await speakFallback(text, ru ? 'ru' : 'en', rateRef.current, audioId);
  }
  async function holdFor(sec: number, myGen: number) {
    const n = Math.ceil((sec * 1000) / 300);
    for (let i = 0; i < n; i++) { if (myGen !== genRef.current) return; await sleep(300); }
  }
  async function runLoop() {
    const myGen = ++genRef.current;
    claimAudio(audioId);
    playingRef.current = true; setPlaying(true); setFinished(false);
    await ensureSpeaker();
    while (idxRef.current < steps.length) {
      if (myGen !== genRef.current) return;
      const i = idxRef.current; setIdx(i);
      const step = steps[i];
      step.kind === 'breathe' ? breathe() : gentle();
      await playLine(ru ? step.ru : step.en, myGen);
      if (myGen !== genRef.current) return;
      if (step.hold) { await holdFor(step.hold, myGen); if (myGen !== genRef.current) return; }
      idxRef.current = i + 1;
    }
    playingRef.current = false; setPlaying(false); setFinished(true); rest();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  function ttsPause() { Haptics.selectionAsync(); genRef.current++; stopAudio(audioId); playingRef.current = false; setPlaying(false); rest(); }
  function ttsPlay() { Haptics.selectionAsync(); if (finished) { idxRef.current = 0; setIdx(0); } runLoop(); }
  function ttsSkip(delta: number) {
    Haptics.selectionAsync();
    const ni = Math.max(0, Math.min(steps.length - 1, idxRef.current + delta));
    idxRef.current = ni; setIdx(ni); setFinished(false);
    if (playingRef.current) { genRef.current++; stopAudio(audioId); runLoop(); }
  }
  function changeRate(r: number) {
    Haptics.selectionAsync(); rateRef.current = r; setRate(r);
    if (recorded) { trackSetRate(r); return; }
    if (playingRef.current) { genRef.current++; stopAudio(audioId); runLoop(); }
  }
  function pickVoice(vid: string) {
    if (vid === voiceRef.current) return;
    Haptics.selectionAsync(); voiceRef.current = vid; setVoiceId(vid);
    update((s) => ({ ...s, profile: s.profile ? { ...s.profile, voiceId: vid } : s.profile }));
    if (playingRef.current) { genRef.current++; stopAudio(audioId); runLoop(); }
  }

  // Auto-start TTS mode + warm cache.
  useEffect(() => {
    if (!practice || recorded) return;
    if (hasVoice) steps.slice(0, 4).forEach((s) => synthLine(ru ? s.ru : s.en, ru ? 'ru' : 'en', geminiVoiceFor(voiceId)).catch(() => {}));
    const tid = setTimeout(() => runLoop(), 350);
    return () => clearTimeout(tid);
  }, []);

  // Hard-stop on unmount AND blur.
  useEffect(() => () => { genRef.current++; releaseAudio(audioId); cancelAnimation(orb); }, []);
  useFocusEffect(useCallback(() => () => { genRef.current++; releaseAudio(audioId); }, []));

  const aInner = useAnimatedStyle(() => ({ transform: [{ scale: orb.value }] }));
  const aMid = useAnimatedStyle(() => ({ transform: [{ scale: 1 + (orb.value - 1) * 0.6 }], opacity: 0.55 }));
  const aOuter = useAnimatedStyle(() => ({ transform: [{ scale: 1 + (orb.value - 1) * 0.32 }], opacity: 0.3 }));

  if (!practice) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F14', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9AA3AF' }}>{ru ? 'Практика не найдена' : 'Practice not found'}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}><Text style={{ color: '#30D158' }}>{ru ? 'Назад' : 'Back'}</Text></Pressable>
      </SafeAreaView>
    );
  }

  const c = practice.color;
  const isPlaying = recorded ? playing : playing;

  return (
    <View style={{ flex: 1, backgroundColor: '#070A0E' }}>
      <LinearGradient colors={[c + '4D', '#0A0E13', '#070A0E']} locations={[0, 0.5, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'space-between' }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 6 }}>
          <View style={{ width: 38 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>{ru ? practice.titleRu : practice.titleEn}</Text>
            <Text style={{ color: '#7E90A0', fontSize: 11, marginTop: 2 }}>{ru ? practice.subRu : practice.subEn}</Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Breathing rings + (TTS only) caption */}
        <View {...swipePan.panHandlers} style={{ alignItems: 'center', justifyContent: 'center', flex: 1, gap: 36 }}>
          <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: c + '12' }, aOuter]} />
            <Animated.View style={[{ position: 'absolute', width: 224, height: 224, borderRadius: 112, borderWidth: 1, borderColor: c + '55', backgroundColor: c + '0F' }, aMid]} />
            <Animated.View style={[{
              width: 156, height: 156, borderRadius: 78, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              shadowColor: c, shadowOpacity: 0.7, shadowRadius: 34, shadowOffset: { width: 0, height: 0 },
            }, aInner]}>
              <LinearGradient colors={[c, '#0A84FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', width: 156, height: 156 }} />
              {(() => { const I = Icon[practice.icon]; return <I size={42} color="#FFFFFFF2" />; })()}
            </Animated.View>
          </View>

          {!recorded && (
            <ScrollView style={{ maxHeight: 120, alignSelf: 'stretch' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 10 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color: '#F2F6FA', fontSize: 22, fontWeight: '500', lineHeight: 32, textAlign: 'center', letterSpacing: -0.2 }}>{caption}</Text>
            </ScrollView>
          )}
        </View>

        {/* Frosted control panel */}
        <BlurView intensity={40} tint="dark" style={{ borderRadius: 30, overflow: 'hidden', marginBottom: 6 }}>
          <View style={{ padding: 18, gap: 16, borderRadius: 30, borderWidth: 1, borderColor: '#FFFFFF14', backgroundColor: '#FFFFFF08' }}>

            {recorded ? (
              <SeekBar pos={pos} dur={dur} color={c} onScrub={onScrub} />
            ) : (
              <View style={{ height: 4, borderRadius: 4, backgroundColor: '#FFFFFF1A', overflow: 'hidden' }}>
                <View style={{ width: `${total > 1 ? Math.round((finished ? 1 : idx / (total - 1)) * 100) : 0}%`, height: '100%', backgroundColor: c, borderRadius: 4 }} />
              </View>
            )}

            {/* transport — ⏮ prev practice / ⏯ play-pause / ⏭ next practice */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
              <Pressable onPress={() => goPractice(prevP)} hitSlop={8}
                style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                <Icon.skipBack size={26} color="#fff" />
              </Pressable>
              <Pressable onPress={recorded ? recToggle : (isPlaying ? ttsPause : ttsPlay)}
                style={({ pressed }) => ({ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: pressed ? 0.9 : 1 })}>
                <LinearGradient colors={[c, '#0A84FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', width: 80, height: 80 }} />
                {isPlaying ? (
                  <View style={{ flexDirection: 'row', gap: 7 }}>
                    <View style={{ width: 7, height: 27, borderRadius: 3, backgroundColor: '#fff' }} />
                    <View style={{ width: 7, height: 27, borderRadius: 3, backgroundColor: '#fff' }} />
                  </View>
                ) : (
                  <View style={{ width: 0, height: 0, borderTopWidth: 15, borderBottomWidth: 15, borderLeftWidth: 24, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 6 }} />
                )}
              </Pressable>
              <Pressable onPress={() => goPractice(nextP)} hitSlop={8}
                style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                <Icon.skipFwd size={26} color="#fff" />
              </Pressable>
            </View>

            {/* Next-up hint */}
            <Text style={{ color: '#7E90A0', fontSize: 11, textAlign: 'center', marginTop: -4 }}>
              {ru ? 'Дальше: ' : 'Next: '}{ru ? nextP.titleRu : nextP.titleEn}
            </Text>

            {/* speed */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {RATES.map((r) => {
                const active = r === rate;
                return (
                  <Pressable key={r} onPress={() => changeRate(r)}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: active ? c + '2E' : '#FFFFFF0D', borderWidth: 1, borderColor: active ? c : '#FFFFFF1A' }}>
                    <Text style={{ color: active ? '#fff' : '#9FB0C0', fontSize: 13, fontWeight: active ? '700' : '500' }}>{r}×</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* voice — TTS mode only (recorded files have a fixed voice) */}
            {!recorded && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {VOICES.map((v) => {
                  const active = v.id === voiceId;
                  return (
                    <Pressable key={v.id} onPress={() => pickVoice(v.id)}
                      style={{ flex: 1, paddingVertical: 11, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: active ? c + '2E' : '#FFFFFF0D', borderWidth: 1, borderColor: active ? c : '#FFFFFF1A' }}>
                      <Text style={{ fontSize: 14, color: active ? '#fff' : '#9FB0C0' }}>{v.gender === 'f' ? '♀' : '♂'}</Text>
                      <Text style={{ color: active ? '#fff' : '#9FB0C0', fontSize: 14, fontWeight: active ? '700' : '500' }}>{ru ? v.ru : v.en}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </BlurView>
      </SafeAreaView>
    </View>
  );
}

// Draggable scrubber for recorded mode (PanResponder — no extra deps).
function SeekBar({ pos, dur, color, onScrub }: { pos: number; dur: number; color: string; onScrub: (frac: number, final: boolean) => void }) {
  const wRef = useRef(0);
  const [dragFrac, setDragFrac] = useState<number | null>(null);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { const f = clamp(e.nativeEvent.locationX / (wRef.current || 1)); setDragFrac(f); onScrub(f, false); },
    onPanResponderMove: (e) => { const f = clamp(e.nativeEvent.locationX / (wRef.current || 1)); setDragFrac(f); onScrub(f, false); },
    onPanResponderRelease: (e) => { const f = clamp(e.nativeEvent.locationX / (wRef.current || 1)); setDragFrac(null); onScrub(f, true); },
    onPanResponderTerminate: () => { setDragFrac(null); },
  })).current;
  const frac = dragFrac != null ? dragFrac : (dur > 0 ? clamp(pos / dur) : 0);
  return (
    <View style={{ gap: 6 }}>
      <View onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; }} {...pan.panHandlers} style={{ height: 26, justifyContent: 'center' }}>
        <View style={{ height: 4, borderRadius: 4, backgroundColor: '#FFFFFF1A' }}>
          <View style={{ width: `${frac * 100}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
        </View>
        <View style={{ position: 'absolute', left: `${frac * 100}%`, marginLeft: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#7E90A0', fontSize: 11 }}>{fmt(frac * dur)}</Text>
        <Text style={{ color: '#7E90A0', fontSize: 11 }}>{fmt(dur)}</Text>
      </View>
    </View>
  );
}
