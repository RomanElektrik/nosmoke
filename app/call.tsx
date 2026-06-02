// «Бриз звонит тебе» — a real two-way voice call.
// Ring → answer → the coach speaks a personalized opening (one smooth TTS,
// no gaps) → then you HOLD the mic and actually talk; your speech is
// transcribed, the AI replies with full context, and speaks back. Quick
// tap-chips remain as a fallback. Everything degrades to system voice / text.

import { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';
import { callOpening, callChoices } from '../lib/call';
import { synthLine, transcribe, hasVoice } from '../lib/voice';
import { chat, type ChatMessage } from '../lib/ai';

let Speech: any = null;
try { Speech = require('expo-speech'); } catch {}

const strip = (t: string) => t.replace(/\[\[[^\]\n]+\]\]/g, '').replace(/\{\{[^}\n]+\}\}/g, '').replace(/\s{2,}/g, ' ').trim();

type Convo = 'idle' | 'speaking' | 'listening' | 'thinking';

export default function Call() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<'ringing' | 'live'>('ringing');
  const [convo, setConvo] = useState<Convo>('idle');
  const [caption, setCaption] = useState('');
  const [ended, setEnded] = useState(false);
  const historyRef = useRef<ChatMessage[]>([]);
  const playerRef = useRef<any>(null);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (phase !== 'ringing') return;
    pulse.value = withRepeat(withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    const id = setInterval(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1400);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => () => { try { Speech?.stop?.(); } catch {} try { playerRef.current?.remove?.(); } catch {} }, []);

  // Speak one chunk of text — one TTS request → smooth, no inter-line gaps.
  async function say(text: string) {
    setCaption(text);
    setConvo('speaking');
    if (hasVoice) {
      const uri = await synthLine(text, lang === 'ru' ? 'ru' : 'en');
      if (uri) {
        await new Promise<void>((resolve) => {
          let done = false;
          const fin = () => { if (done) return; done = true; resolve(); };
          try {
            const player = createAudioPlayer({ uri });
            playerRef.current = player;
            const sub = player.addListener('playbackStatusUpdate', (st: any) => {
              if (st?.didJustFinish) { try { sub?.remove?.(); } catch {} try { player.remove?.(); } catch {} fin(); }
            });
            player.play();
            setTimeout(fin, 45000);
          } catch { fin(); }
        });
        return;
      }
    }
    if (Speech?.speak) {
      await new Promise<void>((resolve) => {
        let done = false; const fin = () => { if (done) return; done = true; resolve(); };
        try { Speech.stop(); Speech.speak(text, { language: lang === 'ru' ? 'ru-RU' : 'en-US', rate: 0.96, onDone: fin, onError: fin }); } catch { fin(); }
        setTimeout(fin, 2600 + text.length * 55);
      });
      return;
    }
    await new Promise<void>((r) => setTimeout(r, 1500 + text.length * 45));
  }

  async function answer() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { await AudioModule.requestRecordingPermissionsAsync(); } catch {}
    try { await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }); } catch {}
    setPhase('live');
    const opening = callOpening(state, lang).join(' ');
    historyRef.current = [{ role: 'assistant', content: opening }];
    await say(opening);
    setConvo('idle');
  }

  // A full user turn → AI reply (voice).
  async function userTurn(text: string) {
    if (!text.trim()) { setConvo('idle'); return; }
    setCaption(text);
    setConvo('thinking');
    historyRef.current.push({ role: 'user', content: text.trim() });
    let reply = '';
    try { reply = strip(await chat(state, lang, 'support', historyRef.current)); } catch {}
    if (!reply) reply = lang === 'ru' ? 'Я рядом. Дыши со мной — вдох на четыре, выдох на шесть.' : "I'm here. Breathe with me — in for four, out for six.";
    historyRef.current.push({ role: 'assistant', content: reply });
    await say(reply);
    setConvo('idle');
  }

  async function startListening() {
    if (convo !== 'idle') return;
    try { playerRef.current?.remove?.(); } catch {}
    try { Speech?.stop?.(); } catch {}
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setConvo('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { setConvo('idle'); }
  }
  async function stopListening() {
    if (convo !== 'listening') return;
    setConvo('thinking');
    let uri: string | null = null;
    try { await recorder.stop(); uri = recorder.uri ?? null; } catch {}
    const text = uri ? await transcribe(uri, lang === 'ru' ? 'ru' : 'en') : null;
    if (!text) { setCaption(lang === 'ru' ? 'Не расслышал — попробуй ещё или нажми кнопку.' : "Didn't catch that — try again or tap a button."); setConvo('idle'); return; }
    await userTurn(text);
  }

  function hangUp() {
    try { Speech?.stop?.(); } catch {}
    try { playerRef.current?.remove?.(); } catch {}
    Haptics.selectionAsync();
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  }
  async function resisted() {
    try { Speech?.stop?.(); } catch {}
    try { playerRef.current?.remove?.(); } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({ ...s, cravings: [...s.cravings, { ts: Date.now(), intensity: 6, outcome: 'resisted' as const }] }));
    router.replace('/(tabs)');
  }

  const aPulse = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // ─── Ringing ───
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
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 24 }}>Бриз</Text>
            <Text style={{ color: '#8FA6B8', fontSize: 15, marginTop: 6 }}>{lang === 'ru' ? 'хочет помочь прямо сейчас' : 'wants to help right now'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 40 }}>
            <CircleBtn color="#FF453A" glyph="✕" label={lang === 'ru' ? 'Отклонить' : 'Decline'} onPress={hangUp} />
            <CircleBtn color="#34C759" glyph="📞" label={lang === 'ru' ? 'Ответить' : 'Answer'} onPress={answer} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Live ───
  const statusText = ended
    ? (lang === 'ru' ? 'звонок завершён' : 'call ended')
    : convo === 'listening' ? (lang === 'ru' ? 'слушаю…' : 'listening…')
    : convo === 'thinking' ? (lang === 'ru' ? 'думаю…' : 'thinking…')
    : convo === 'speaking' ? (lang === 'ru' ? 'говорит…' : 'speaking…')
    : (lang === 'ru' ? 'на связи' : 'on the line');

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F14' }}>
      <LinearGradient colors={['#15324a', '#0B0F14']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: spacing.lg, paddingVertical: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <LinearGradient colors={['#3BD168', '#0A84FF']} style={{ position: 'absolute', width: 76, height: 76 }} />
            <Icon.wind size={34} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 10 }}>Бриз</Text>
          <Text style={{ color: '#8FA6BF', fontSize: 13, marginTop: 2 }}>{statusText}</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600', lineHeight: 31, textAlign: 'center', letterSpacing: -0.3 }}>
            {ended ? (lang === 'ru' ? 'Ты — тот, кто не курит.' : "You're someone who doesn't smoke.") : caption}
          </Text>
        </View>

        {ended ? (
          <View style={{ gap: 10 }}>
            <Pressable onPress={resisted} style={{ padding: 18, borderRadius: radius.xl, backgroundColor: '#34C759', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{lang === 'ru' ? 'Я удержался ✊' : "I held on ✊"}</Text>
            </Pressable>
            <Pressable onPress={hangUp} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#8FA6BF', fontSize: 14 }}>{lang === 'ru' ? 'Закрыть' : 'Close'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 14, alignItems: 'center' }}>
            {/* Quick chips — fallback input */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {callChoices(lang).map((c) => (
                <Pressable key={c.key} onPress={() => convo === 'idle' && userTurn(c.label)}
                  style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#FFFFFF12', borderWidth: 1, borderColor: '#FFFFFF22', opacity: convo === 'idle' ? 1 : 0.4 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Push-to-talk */}
            <Pressable
              onPressIn={startListening}
              onPressOut={stopListening}
              disabled={convo === 'thinking' || convo === 'speaking'}
              style={{
                width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
                backgroundColor: convo === 'listening' ? '#FF453A' : '#34C759',
                opacity: (convo === 'thinking' || convo === 'speaking') ? 0.45 : 1,
              }}>
              <Text style={{ fontSize: 38 }}>🎤</Text>
            </Pressable>
            <Text style={{ color: '#8FA6BF', fontSize: 13 }}>
              {convo === 'listening' ? (lang === 'ru' ? 'Отпусти, когда скажешь' : 'Release when done')
                : (lang === 'ru' ? 'Удерживай и говори' : 'Hold and talk')}
            </Text>

            <View style={{ flexDirection: 'row', gap: 24, marginTop: 4 }}>
              <Pressable onPress={() => setEnded(true)}>
                <Text style={{ color: '#8FA6BF', fontSize: 14 }}>{lang === 'ru' ? 'Завершить' : 'End'}</Text>
              </Pressable>
              <Pressable onPress={hangUp}>
                <Text style={{ color: '#FF6B6B', fontSize: 14 }}>{lang === 'ru' ? 'Положить трубку' : 'Hang up'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function CircleBtn({ color, glyph, label, onPress }: { color: string; glyph: string; label: string; onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onPress} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 30, color: '#fff', lineHeight: 34 }}>{glyph}</Text>
      </Pressable>
      <Text style={{ color: '#cdd8e3', fontSize: 13 }}>{label}</Text>
    </View>
  );
}
