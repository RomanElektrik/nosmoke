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
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const [state] = useAppState();

  // In-place practice swap: prev/next swaps content without re-navigating, so
  // there's no slide-from-bottom animation between practices — like every
  // normal music player.
  const [curId, setCurId] = useState<string>(routeId);
  const practice = getPractice(curId);
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
  const [showScript, setShowScript] = useState(false);

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
  // practices like tracks in a playlist. Wraps around. Stays on the same
  // screen — no navigation animation.
  const pIdx = Math.max(0, PRACTICES.findIndex((p) => p.id === curId));
  const prevP = PRACTICES[(pIdx - 1 + PRACTICES.length) % PRACTICES.length];
  const nextP = PRACTICES[(pIdx + 1) % PRACTICES.length];
  function goPractice(target: typeof PRACTICES[number]) {
    if (!target || target.id === curId) return;
    Haptics.selectionAsync();
    genRef.current++;
    stopAudio(audioId);
    setPos(0); setDur(0); setPlaying(false); setFinished(false); setIdx(0); idxRef.current = 0;
    setCurId(target.id);
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
    }, 200);
    return () => clearInterval(iv);
  }, [curId]);

  function recToggle() {
    Haptics.selectionAsync();
    if (playing) { trackPause(); setPlaying(false); rest(); }
    else { trackResume(); setPlaying(true); gentle(); }
  }
  function recSkip(delta: number) { Haptics.selectionAsync(); const s = Math.max(0, Math.min(dur || 0, pos + delta)); trackSeek(s); setPos(s); }
  // Drag-then-seek: visual updates live, the actual seekTo() only fires on
  // release — same UX as native players, no thrash on the audio engine.
  function onScrub(frac: number, final: boolean) {
    const s = frac * (dur || 0);
    setPos(s);
    if (final) {
      draggingRef.current = false;
      trackSeek(s);
      Haptics.selectionAsync();
    } else {
      draggingRef.current = true;
    }
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
  }, [curId]);

  // Hard-stop on unmount AND blur.
  useEffect(() => () => { genRef.current++; releaseAudio(audioId); cancelAnimation(orb); }, []);
  useFocusEffect(useCallback(() => () => { genRef.current++; releaseAudio(audioId); }, []));

  // Iridescent full-screen aurora: two big colour blobs rotate at different
  // speeds over a dark base → a slow, shimmering, meditative flow.
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 17000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 23000, easing: Easing.linear }), -1, false);
    return () => { cancelAnimation(rot1); cancelAnimation(rot2); };
  }, []);
  const aRot1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot1.value}deg` }] }));
  const aRot2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot2.value}deg` }] }));

  if (!practice) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F14', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9AA3AF' }}>{ru ? 'Практика не найдена' : 'Practice not found'}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}><Text style={{ color: '#30D158' }}>{ru ? 'Назад' : 'Back'}</Text></Pressable>
      </SafeAreaView>
    );
  }

  const c = practice.color;
  const isPlaying = playing;
  const cycleRate = () => { const i = RATES.indexOf(rate); changeRate(RATES[(i + 1) % RATES.length]); };

  return (
    <View style={{ flex: 1, backgroundColor: '#06080C' }}>
      {/* full-screen flowing aurora — two colour blobs slowly rotating */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <LinearGradient colors={[c + '4D', '#0A0E13', '#06080C']} locations={[0, 0.5, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <Animated.View style={[{ position: 'absolute', width: 560, height: 560, top: -180, left: -150 }, aRot1]}>
          <LinearGradient colors={[c + '66', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, borderRadius: 280 }} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', width: 520, height: 520, bottom: -200, right: -170, opacity: 0.85 }, aRot2]}>
          <LinearGradient colors={[c + '4D', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, borderRadius: 260 }} />
        </Animated.View>
      </View>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'space-between' }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF14', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 24, marginTop: -2 }}>←</Text>
          </Pressable>
          <Pressable onPress={() => { Haptics.selectionAsync(); setShowScript((s) => !s); }} hitSlop={12} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: showScript ? '#FFFFFF2E' : '#FFFFFF14', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 19 }}>📖</Text>
          </Pressable>
        </View>

        {/* Center — title, subtitle, big timer; or the read-along script */}
        <View {...swipePan.panHandlers} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {showScript ? (
            <ScrollView style={{ alignSelf: 'stretch' }} contentContainerStyle={{ paddingVertical: 24, gap: 18 }} showsVerticalScrollIndicator={false}>
              {steps.map((s, i) => (
                <Text key={i} style={{ color: '#E8EEF4', fontSize: 18, lineHeight: 27, textAlign: 'center' }}>{ru ? s.ru : s.en}</Text>
              ))}
            </ScrollView>
          ) : (
            <>
              <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center', paddingHorizontal: 12 }}>{ru ? practice.titleRu : practice.titleEn}</Text>
              <Text style={{ color: '#FFFFFFA8', fontSize: 15, marginTop: 6, textAlign: 'center', paddingHorizontal: 24, lineHeight: 21 }}>{ru ? practice.subRu : practice.subEn}</Text>
              {recorded ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text style={{ color: '#fff', fontSize: 66, fontWeight: '300', letterSpacing: 1, fontVariant: ['tabular-nums'] as any }}>{fmt(pos)}</Text>
                  <Text style={{ color: '#FFFFFF7A', fontSize: 18, marginTop: 2, fontVariant: ['tabular-nums'] as any }}>{fmt(dur)}</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 170, alignSelf: 'stretch', marginTop: 26 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 10 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ color: '#F2F6FA', fontSize: 22, fontWeight: '500', lineHeight: 32, textAlign: 'center', letterSpacing: -0.2 }}>{caption}</Text>
                </ScrollView>
              )}
            </>
          )}
        </View>

        {/* Bottom — scrubber + transport */}
        <View style={{ paddingBottom: 12, gap: 22 }}>
          {recorded ? (
            <SeekBar pos={pos} dur={dur} color={c} onScrub={onScrub} />
          ) : (
            <View style={{ height: 6, borderRadius: 4, backgroundColor: '#FFFFFF1A', overflow: 'hidden' }}>
              <View style={{ width: `${total > 1 ? Math.round((finished ? 1 : idx / (total - 1)) * 100) : 0}%`, height: '100%', backgroundColor: c, borderRadius: 4 }} />
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* speed */}
            <Pressable onPress={cycleRate} style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{rate}x</Text>
            </Pressable>
            {/* prev practice */}
            <Pressable onPress={() => goPractice(prevP)} hitSlop={6} style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Icon.skipBack size={24} color="#fff" />
            </Pressable>
            {/* play / pause — warm glow */}
            <Pressable onPress={recorded ? recToggle : (isPlaying ? ttsPause : ttsPlay)}
              style={({ pressed }) => ({ width: 84, height: 84, borderRadius: 42, backgroundColor: '#FF8A4C', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.9 : 1,
                shadowColor: '#FF8A4C', shadowOpacity: 0.6, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } })}>
              {isPlaying ? (
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  <View style={{ width: 7, height: 28, borderRadius: 3, backgroundColor: '#fff' }} />
                  <View style={{ width: 7, height: 28, borderRadius: 3, backgroundColor: '#fff' }} />
                </View>
              ) : (
                <View style={{ width: 0, height: 0, borderTopWidth: 15, borderBottomWidth: 15, borderLeftWidth: 25, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 6 }} />
              )}
            </Pressable>
            {/* next practice */}
            <Pressable onPress={() => goPractice(nextP)} hitSlop={6} style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Icon.skipFwd size={24} color="#fff" />
            </Pressable>
            {/* read-along script */}
            <Pressable onPress={() => { Haptics.selectionAsync(); setShowScript((s) => !s); }} style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, backgroundColor: showScript ? '#FFFFFF26' : '#FFFFFF12', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Icon.list size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Draggable scrubber — plain RN responder on the bar View. locationX from a
// touch that lands inside this View is relative to the View's left edge, so
// frac = locationX / width. No PanResponder, no gesture-handler worklets
// (those were crashing the screen), no measureInWindow.
function SeekBar({ pos, dur, color, onScrub }: { pos: number; dur: number; color: string; onScrub: (frac: number, final: boolean) => void }) {
  const wRef = useRef(0);
  const [dragFrac, setDragFrac] = useState<number | null>(null);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const at = (locationX: number, final: boolean) => {
    const w = wRef.current || 1;
    const f = clamp(locationX / w);
    if (final) setDragFrac(null); else setDragFrac(f);
    onScrub(f, final);
  };

  const frac = dragFrac != null ? dragFrac : (dur > 0 ? clamp(pos / dur) : 0);

  return (
    <View style={{ gap: 6 }}>
      <View
        onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => at(e.nativeEvent.locationX, false)}
        onResponderMove={(e) => at(e.nativeEvent.locationX, false)}
        onResponderRelease={(e) => at(e.nativeEvent.locationX, true)}
        onResponderTerminate={(e) => at(e.nativeEvent.locationX, true)}
        style={{ height: 36, justifyContent: 'center' }}>
        <View style={{ height: 5, borderRadius: 4, backgroundColor: '#FFFFFF1F' }}>
          <View style={{ width: `${frac * 100}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', left: `${frac * 100}%`, marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#9FB0C0', fontSize: 12, fontVariant: ['tabular-nums'] }}>{fmt(frac * dur)}</Text>
        <Text style={{ color: '#9FB0C0', fontSize: 12, fontVariant: ['tabular-nums'] }}>{fmt(dur)}</Text>
      </View>
    </View>
  );
}
