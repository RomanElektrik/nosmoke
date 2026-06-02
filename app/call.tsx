// «Бриз звонит тебе» — incoming-call-style crisis support.
// Looks like a call (ringing UI + accept/decline), then the coach "speaks"
// a personalized script via expo-speech (with a captions fallback if the
// native voice module isn't in this build yet) + tap-to-reply branches.

import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';
import { callOpening, callChoices, callReply, callClosing, type CallChoice } from '../lib/call';
import { synthLine, hasVoice } from '../lib/voice';

// Native voice modules may not be in the current build yet — load them safely
// so the call still works (captions) until the app is rebuilt. Voice tiers:
// OpenRouter TTS (expo-audio) · system voice (expo-speech) · captions.
let Speech: any = null;
try { Speech = require('expo-speech'); } catch {}
let Audio: any = null;
try { Audio = require('expo-audio'); } catch {}

type Stage = 'opening' | 'reply' | 'closing';

export default function Call() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();

  const [phase, setPhase] = useState<'ringing' | 'talking'>('ringing');
  const [lines, setLines] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>('opening');
  const [showChoices, setShowChoices] = useState(false);
  const [ended, setEnded] = useState(false);
  const spokeRef = useRef(-1);
  const playerRef = useRef<any>(null);

  const pulse = useSharedValue(1);

  // Ringing: pulse + repeated haptic until answered.
  useEffect(() => {
    if (phase !== 'ringing') return;
    pulse.value = withRepeat(withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    const id = setInterval(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1400);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return () => clearInterval(id);
  }, [phase]);

  // Speak / advance through the current line queue (tiered voice).
  useEffect(() => {
    if (phase !== 'talking') return;
    if (idx >= lines.length) {
      if (stage === 'opening') setShowChoices(true);
      else if (stage === 'reply') { spokeRef.current = -1; setLines(callClosing(state, lang)); setIdx(0); setStage('closing'); }
      else if (stage === 'closing') setEnded(true);
      return;
    }
    if (spokeRef.current === idx) return;
    spokeRef.current = idx;
    const line = lines[idx];
    let cancelled = false;
    let timer: any = null;
    const advance = () => { if (!cancelled) setIdx((i) => (i === idx ? i + 1 : i)); };

    (async () => {
      // 1) Real voice via OpenRouter TTS (cheap — available to everyone)
      if (hasVoice && Audio?.createAudioPlayer) {
        const uri = await synthLine(line, lang === 'ru' ? 'ru' : 'en');
        if (cancelled) return;
        if (uri) {
          try {
            const player = Audio.createAudioPlayer({ uri });
            playerRef.current = player;
            const sub = player.addListener('playbackStatusUpdate', (st: any) => {
              if (st?.didJustFinish) { try { sub?.remove?.(); } catch {} try { player.remove?.(); } catch {} advance(); }
            });
            player.play();
            timer = setTimeout(advance, 14000); // hard backstop
            return;
          } catch {}
        }
      }
      // 2) Free: system voice
      if (Speech?.speak) {
        try {
          Speech.stop();
          Speech.speak(line, { language: lang === 'ru' ? 'ru-RU' : 'en-US', rate: 0.96, pitch: 1.02, onDone: advance, onError: advance });
        } catch {}
        timer = setTimeout(advance, 2600 + line.length * 55);
        return;
      }
      // 3) Captions only
      timer = setTimeout(advance, 2200 + line.length * 45);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      try { playerRef.current?.remove?.(); } catch {}
      try { Speech?.stop?.(); } catch {}
    };
  }, [phase, idx, lines, stage]);

  useEffect(() => () => { try { Speech?.stop?.(); } catch {} try { playerRef.current?.remove?.(); } catch {} }, []);

  function answer() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { Audio?.setAudioModeAsync?.({ playsInSilentMode: true }); } catch {}
    setLines(callOpening(state, lang)); setIdx(0); setStage('opening'); spokeRef.current = -1;
    setPhase('talking');
  }
  function hangUp() {
    try { Speech?.stop?.(); } catch {}
    try { playerRef.current?.remove?.(); } catch {}
    Haptics.selectionAsync();
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  }
  function choose(key: CallChoice) {
    Haptics.selectionAsync();
    setShowChoices(false); spokeRef.current = -1;
    setLines(callReply(key, state, lang)); setIdx(0); setStage('reply');
  }
  async function resisted() {
    try { Speech?.stop?.(); } catch {}
    try { playerRef.current?.remove?.(); } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({ ...s, cravings: [...s.cravings, { ts: Date.now(), intensity: 6, outcome: 'resisted' as const }] }));
    router.replace('/(tabs)');
  }

  const aPulse = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // ─── Ringing ───────────────────────────────────────────────
  if (phase === 'ringing') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F14' }}>
        <LinearGradient colors={['#15324a', '#0B0F14']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 480 }} />
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60 }}>
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#8FA6B8', fontSize: 15, letterSpacing: 0.5 }}>{lang === 'ru' ? 'входящий звонок' : 'incoming call'}</Text>
            <Animated.View style={[{ width: 132, height: 132, borderRadius: 66, marginTop: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, aPulse]}>
              <LinearGradient colors={['#3BD168', '#0A84FF']} style={{ position: 'absolute', width: 132, height: 132 }} />
              <Icon.wind size={56} color="#fff" />
            </Animated.View>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 24, letterSpacing: -0.5 }}>Бриз</Text>
            <Text style={{ color: '#8FA6B8', fontSize: 15, marginTop: 6 }}>{lang === 'ru' ? 'хочет помочь прямо сейчас' : 'wants to help right now'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 40 }}>
            <CircleBtn color="#FF453A" icon={<Text style={{ fontSize: 30, color: '#fff', lineHeight: 34 }}>✕</Text>} label={lang === 'ru' ? 'Отклонить' : 'Decline'} onPress={hangUp} />
            <CircleBtn color="#34C759" icon={<Text style={{ fontSize: 30 }}>📞</Text>} label={lang === 'ru' ? 'Ответить' : 'Answer'} onPress={answer} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Talking ───────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F14' }}>
      <LinearGradient colors={['#15324a', '#0B0F14']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: spacing.lg, paddingVertical: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <LinearGradient colors={['#3BD168', '#0A84FF']} style={{ position: 'absolute', width: 84, height: 84 }} />
            <Icon.wind size={38} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 }}>Бриз</Text>
          <Text style={{ color: '#8FA6BF', fontSize: 13, marginTop: 2 }}>{ended ? (lang === 'ru' ? 'звонок завершён' : 'call ended') : (lang === 'ru' ? 'на связи…' : 'on the line…')}</Text>
        </View>

        {/* Live caption */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '600', lineHeight: 33, textAlign: 'center', letterSpacing: -0.3 }}>
            {ended
              ? (lang === 'ru' ? 'Ты — тот, кто не курит.' : "You're someone who doesn't smoke.")
              : (lines[Math.min(idx, lines.length - 1)] ?? '')}
          </Text>
        </View>

        {/* Choices / end actions */}
        <View style={{ gap: 10 }}>
          {showChoices && !ended && callChoices(lang).map((c) => (
            <Pressable key={c.key} onPress={() => choose(c.key)}
              style={{ padding: 16, borderRadius: radius.lg, backgroundColor: '#FFFFFF12', borderWidth: 1, borderColor: '#FFFFFF22', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{c.label}</Text>
            </Pressable>
          ))}

          {ended ? (
            <>
              <Pressable onPress={resisted} style={{ padding: 18, borderRadius: radius.xl, backgroundColor: '#34C759', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{lang === 'ru' ? 'Я удержался ✊' : "I held on ✊"}</Text>
              </Pressable>
              <Pressable onPress={hangUp} style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ color: '#8FA6BF', fontSize: 14 }}>{lang === 'ru' ? 'Закрыть' : 'Close'}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={hangUp} style={{ alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF453A', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 26, color: '#fff', lineHeight: 30 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function CircleBtn({ color, icon, label, onPress }: { color: string; icon: any; label: string; onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onPress} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Pressable>
      <Text style={{ color: '#cdd8e3', fontSize: 13 }}>{label}</Text>
    </View>
  );
}
