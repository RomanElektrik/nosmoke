// SOS screen — the craving moment. Hero is the «wave timer»: a real 3-minute
// countdown showing the urge passing in real time (this is the evidence: a
// craving rises and falls in 3–5 min). Below: emotion picker → chat, quick
// distractions, plus access to other techniques. No call screen, no forced
// breathing — the user gets to choose what helps.

import { useState, useEffect, useRef, type ComponentType } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer } from 'expo-audio';
import { ensureSpeaker } from '../lib/audio';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { useTheme, spacing, radius, type Theme } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { BreathingOrb } from '../components/BreathingOrb';
import { WaterCircle } from '../components/WaterCircle';
import { PremiumCard } from '../components/PremiumCard';
import { Icon } from '../components/Icon';
import { update, useAppState } from '../lib/storage';
import type { Trigger } from '../lib/storage';
import { nextDueDose, MED_SAFETY } from '../lib/medication';
import { resolveCoping } from '../lib/coping';

type Phase = 'choose' | 'wave' | 'breath' | 'log' | 'win' | 'after';
type IconC = ComponentType<{ size?: number; color?: string }>;

export default function Craving() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const [phase, setPhase] = useState<Phase>('choose');
  const [intensity, setIntensity] = useState(6);
  const [trigger, setTrigger] = useState<Trigger | undefined>();
  const [outcome, setOutcome] = useState<'resisted' | 'smoked' | null>(null);
  const ru = (state.profile?.language ?? 'ru') === 'ru';

  async function save() {
    if (!outcome) return;
    Haptics.notificationAsync(
      outcome === 'resisted' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
    await update((s) => ({
      ...s,
      cravings: [...s.cravings, { ts: Date.now(), intensity, trigger, outcome: outcome! }],
      slips: outcome === 'smoked' ? [...s.slips, Date.now()] : s.slips,
    }));
    if (outcome === 'resisted') setPhase('win');
    else router.replace('/slip');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Persistent close button — top-right, always visible */}
      <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        hitSlop={14}
        style={{ position: 'absolute', top: 56, right: 16, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
        <Icon.close size={18} color={t.text} />
      </Pressable>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48, gap: 16 }} showsVerticalScrollIndicator={false}>

        {phase !== 'win' && (
          <View style={{ gap: 6, marginBottom: 2, paddingRight: 50 }}>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 }}>{tr('sos.title')}</Text>
            {phase === 'choose' && (
              <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21 }}>
                {ru ? 'Тяга — это волна. Она проходит за 3 минуты, я рядом.'
                    : 'A craving is a wave. It passes in 3 min, I’m here.'}
              </Text>
            )}
          </View>
        )}

        {/* ───────────────────────── WAVE TIMER (HERO) ───────────────────────── */}
        {phase === 'wave' && (
          <WaveTimer onDone={() => setPhase('after')} onBack={() => setPhase('choose')} ru={ru} t={t} />
        )}

        {/* ───────────────────────── BREATHE ───────────────────────── */}
        {phase === 'breath' && (
          <>
            <Text style={{ color: t.textDim, fontSize: 16 }}>{tr('sos.step_breath')}</Text>
            <BreathingOrb totalSeconds={60} onDone={() => setPhase('choose')} />
            <Pressable onPress={() => setPhase('choose')} style={{ paddingVertical: 8 }}>
              <Text style={{ color: t.textDim, textAlign: 'center' }}>← {ru ? 'Назад к вариантам' : 'Back to options'}</Text>
            </Pressable>
          </>
        )}

        {/* ───────────────────────── CHOOSE ───────────────────────── */}
        {phase === 'choose' && (() => {
          const due = nextDueDose(state);
          const med = state.profile?.medication;
          const medName = med ? (ru ? MED_SAFETY[med].nameRu : MED_SAFETY[med].nameEn) : '';

          return (
            <>
              {/* ── HERO: the one obvious thing — wait out the wave ── */}
              <PremiumCard color="#0A84FF" motif="waves" gid="sos_wave" height={196}
                tag={ru ? '3 МИНУТЫ' : '3 MIN'}
                title={ru ? 'Переждать волну' : 'Ride the wave'}
                sub={ru ? 'Тяга уходит сама — просто смотри и дыши' : 'The urge passes — just watch and breathe'}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPhase('wave'); }} />

              {due && (
                <ContextRow t={t} icon={Icon.pill} color={t.info}
                  title={ru ? `Прими дозу · ${medName}` : `Take your dose · ${medName}`}
                  sub={ru ? 'Доза по расписанию уже наступила' : 'A scheduled dose is due'}
                  onPress={() => router.push('/meds')} />
              )}

              {/* «Письмо себе»: написано в сильный день — читается сейчас */}
              {!!state.profile?.futureLetter && (
                <ContextRow t={t} icon={Icon.feather} color="#FFD60A"
                  title={ru ? 'Прочитай письмо от себя' : 'Read the letter from yourself'}
                  sub={ru ? 'Ты написал его в день, когда решил бросить' : 'You wrote it the day you decided to quit'}
                  onPress={() => router.push('/letter?from=sos' as any)} />
              )}

              {/* ── Personal toolkit: what works for this user ── */}
              {(() => {
                const mine = (state.profile?.copingMethods ?? []).map((id) => resolveCoping(id, ru)).filter(Boolean) as NonNullable<ReturnType<typeof resolveCoping>>[];
                if (mine.length === 0) {
                  return (
                    <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/coping' as any); }}
                      style={({ pressed }) => ({
                        padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev,
                        borderWidth: 1, borderStyle: 'dashed', borderColor: t.accent + '66',
                        flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.85 : 1,
                      })}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.accent + '1F', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon.check size={20} color={t.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{ru ? 'Собери, что тебе помогает' : 'Pick what helps you'}</Text>
                        <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>{ru ? 'Быстрые приёмы под рукой в момент тяги' : 'Quick moves at hand when it hits'}</Text>
                      </View>
                      <Icon.arrowRight size={16} color={t.textDim} />
                    </Pressable>
                  );
                }
                return (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <SectionLabel t={t} text={ru ? 'Что мне помогает' : 'What helps me'} />
                      <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/coping' as any); }} hitSlop={10}>
                        <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '600', marginTop: 8 }}>{ru ? 'Изменить' : 'Edit'}</Text>
                      </Pressable>
                    </View>
                    {mine.map((m) => {
                      const I = Icon[m.icon];
                      return (
                        <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radius.lg, backgroundColor: m.color + '14', borderWidth: 1, borderColor: m.color + '3A' }}>
                          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: m.color + '26', alignItems: 'center', justifyContent: 'center' }}>
                            <I size={22} color={m.color} />
                          </View>
                          <Text style={{ color: t.text, fontSize: 15, fontWeight: '600', flex: 1 }}>{m.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}

              {/* ── Quiet row of alternatives — all equal weight, low noise ── */}
              <SectionLabel t={t} text={ru ? 'Если нужно иначе' : 'Or try' } />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <MiniTile t={t} icon={Icon.headphones} color="#5AC8FA"
                  title={ru ? 'Слушать' : 'Listen'} sub={ru ? 'голос' : 'voice'}
                  onPress={() => { Haptics.selectionAsync(); router.push('/audio/calm_now' as any); }} />
                <MiniTile t={t} icon={Icon.play} color="#BF5AF2"
                  title={ru ? 'Отвлечься' : 'Distract'} sub={ru ? 'игра' : 'game'}
                  onPress={() => { Haptics.selectionAsync(); router.push('/game'); }} />
                {state.profile?.faithEnabled ? (
                  <MiniTile t={t} icon={Icon.cross} color="#FF9500"
                    title={ru ? 'Молитва' : 'Pray'} sub={ru ? 'минута' : 'a minute'}
                    onPress={() => { Haptics.selectionAsync(); router.push('/faith'); }} />
                ) : (
                  <MiniTile t={t} icon={Icon.chat} color="#30D158"
                    title={ru ? 'Написать' : 'Message'} sub={ru ? 'мне' : 'me'}
                    onPress={() => { Haptics.selectionAsync(); router.push('/chat?mode=support' as any); }} />
                )}
              </View>

              {/* ── Logging is post-hoc — quiet link, not a competing button ── */}
              <Pressable onPress={() => { Haptics.selectionAsync(); setPhase('log'); }}
                style={({ pressed }) => ({ paddingVertical: 14, marginTop: 4, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
                <Text style={{ color: t.textDim, fontWeight: '600', fontSize: 14 }}>{ru ? 'Отметить, чем закончилось' : 'Log how it ended'}</Text>
              </Pressable>
            </>
          );
        })()}

        {/* ───────────────────────── LOG ───────────────────────── */}
        {phase === 'log' && (
          <>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{tr('sos.result_q')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['resisted', 'smoked'] as const).map((o) => {
                const active = outcome === o;
                const good = o === 'resisted';
                const col = good ? t.accent : t.warn;
                return (
                  <Pressable key={o} onPress={() => { Haptics.selectionAsync(); setOutcome(o); }}
                    style={{
                      flex: 1, paddingVertical: 18, borderRadius: radius.lg, alignItems: 'center', gap: 8,
                      backgroundColor: active ? col + '1F' : t.bgElev,
                      borderWidth: 1.5, borderColor: active ? col : t.border,
                    }}>
                    {good ? <Icon.check size={24} color={active ? col : t.textDim} /> : <Icon.flame size={24} color={active ? col : t.textDim} />}
                    <Text style={{ color: active ? t.text : t.textDim, fontWeight: '700' }}>{tr(`sos.${o}`)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ color: t.textDim, marginTop: 10, fontWeight: '600' }}>{tr('sos.intensity_q')} · {intensity}/10</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Pressable key={i} onPress={() => { Haptics.selectionAsync(); setIntensity(i + 1); }}
                  style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: i < intensity ? t.accent : t.bgElev, borderWidth: i < intensity ? 0 : 1, borderColor: t.border }} />
              ))}
            </View>

            <Text style={{ color: t.textDim, marginTop: 10, fontWeight: '600' }}>{tr('sos.trigger_q')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['stress','coffee','alcohol','after_meal','driving','social','boredom'] as Trigger[]).map((tg) => {
                const active = trigger === tg;
                return (
                  <Pressable key={tg} onPress={() => { Haptics.selectionAsync(); setTrigger(tg); }}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
                      backgroundColor: active ? t.accentSoft : t.bgElev,
                      borderWidth: 1, borderColor: active ? t.accent : t.border,
                    }}>
                    <Text style={{ color: active ? t.text : t.textDim, fontSize: 13, fontWeight: active ? '700' : '500' }}>{tr(`onb.trig_${tg}`)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={save} disabled={!outcome}
              style={{ marginTop: 18, padding: 18, borderRadius: radius.xl, backgroundColor: outcome ? t.accent : t.border, alignItems: 'center', opacity: outcome ? 1 : 0.6 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{tr('common.save')}</Text>
            </Pressable>
          </>
        )}

        {/* ─────────────────────── AFTER WAVE ───────────────────────
            Don't assume success: ask, and keep the script going. "Still craving"
            flows straight into the coach instead of dumping back to the menu. */}
        {phase === 'after' && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 16 }}>
            <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' }}>
              {ru ? '3 минуты позади.' : '3 minutes done.'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 16, textAlign: 'center', lineHeight: 23 }}>
              {ru ? 'Как сейчас — отпустило?' : 'How is it now — has it passed?'}
            </Text>
            <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setPhase('win'); }}
              style={({ pressed }) => ({ marginTop: 10, paddingVertical: 18, paddingHorizontal: 44, borderRadius: radius.xl, backgroundColor: t.accent, opacity: pressed ? 0.9 : 1, alignSelf: 'stretch', alignItems: 'center' })}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{ru ? 'Отпустило' : 'It passed'}</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/chat?mode=support' as any); }}
              style={({ pressed }) => ({ paddingVertical: 16, paddingHorizontal: 44, borderRadius: radius.xl, borderWidth: 1.5, borderColor: t.info + '66', backgroundColor: t.info + '14', opacity: pressed ? 0.85 : 1, alignSelf: 'stretch', alignItems: 'center' })}>
              <Text style={{ color: t.info, fontWeight: '800', fontSize: 16 }}>
                {ru ? 'Ещё держит — поговорить с Бризом' : 'Still holding — talk to Breeze'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setPhase('breath')} style={{ paddingVertical: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 14 }}>
                {ru ? 'Ещё минуту подышать' : 'One more minute of breathing'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ───────────────────────── WIN ───────────────────────── */}
        {phase === 'win' && (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 16 }}>
            <View style={{ width: 100, height: 100, borderRadius: 30, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.check size={56} color={t.accent} />
            </View>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' }}>{tr('sos.win_title')}</Text>
            <Text style={{ color: t.textDim, fontSize: 16, textAlign: 'center', lineHeight: 23, paddingHorizontal: 8 }}>{tr('sos.win_sub')}</Text>
            <Pressable onPress={() => router.back()}
              style={({ pressed }) => ({ marginTop: 16, paddingVertical: 18, paddingHorizontal: 48, borderRadius: radius.xl, backgroundColor: t.accent, opacity: pressed ? 0.9 : 1 })}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{tr('common.done')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Wave timer — the hero of SOS ──
// A glass orb slowly fills with living water over 3 minutes. The water level
// rises as the urge passes (you literally watch yourself "ride it out"), while
// two sine surfaces drift in opposite directions so it's hypnotic to watch.
// A soft swell halo breathes behind it.
function WaveTimer({ onDone, onBack, ru, t }: { onDone: () => void; onBack: () => void; ru: boolean; t: Theme }) {
  const TOTAL = 180; // 3 minutes
  const [left, setLeft] = useState(TOTAL);
  const [muted, setMuted] = useState(false);
  const fill = useSharedValue(0.06);
  const swell = useSharedValue(1);
  const surf = useRef<any>(null);

  // Looping ocean-waves ambience — makes the orb genuinely calming to sit with.
  useEffect(() => {
    let player: any = null;
    (async () => {
      try {
        await ensureSpeaker();
        player = createAudioPlayer(require('../assets/audio/ocean_waves.mp3'));
        player.loop = true;
        try { player.volume = 0.7; } catch {}
        player.play();
        surf.current = player;
      } catch {}
    })();
    return () => { try { player?.pause?.(); } catch {} try { player?.remove?.(); } catch {} surf.current = null; };
  }, []);

  function toggleMute() {
    Haptics.selectionAsync();
    setMuted((m) => {
      const next = !m;
      try { if (surf.current) surf.current.volume = next ? 0 : 0.7; } catch {}
      return next;
    });
  }

  useEffect(() => {
    swell.value = withRepeat(withTiming(1.06, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true);
    fill.value = withTiming(0.06, { duration: 800 });
    const id = setInterval(() => {
      setLeft((s) => {
        const next = s - 1;
        // The water IS the urge: it rises to the very top at the halfway peak,
        // then recedes to near-empty by the end — "the craving passed". A sine
        // bump (0 → 1 → 0 over the full duration) drives the level.
        const passedPct = (TOTAL - next) / TOTAL;          // 0..1
        const level = 0.06 + Math.sin(passedPct * Math.PI) * 0.92;  // 0.06 → ~0.98 → 0.06
        fill.value = withTiming(level, { duration: 1000, easing: Easing.linear });
        if (next <= 0) { clearInterval(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setTimeout(onDone, 500); return 0; }
        return next;
      });
    }, 1000);
    return () => { clearInterval(id); cancelAnimation(swell); cancelAnimation(fill); };
  }, []);

  const aSwell = useAnimatedStyle(() => ({ transform: [{ scale: swell.value }], opacity: 0.5 }));
  const passed = TOTAL - left;
  const pct = passed / TOTAL;
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');

  const stage = pct < 0.25 ? (ru ? 'Волна нарастает. Это нормально.' : 'The wave is rising. That is normal.')
    : pct < 0.5 ? (ru ? 'Дойдёт до пика — и начнёт спадать.' : 'It will peak — then start to fall.')
    : pct < 0.8 ? (ru ? 'Уже спадает. Ты сильнее тяги.' : "It's already passing. You are stronger.")
    : (ru ? 'Почти всё. Ты держался — и держишься.' : 'Almost done. You held on.');

  return (
    <View style={{ alignItems: 'center', paddingVertical: 16, gap: 24 }}>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center', paddingHorizontal: 16 }}>
        {stage}
      </Text>
      <View style={{ width: 320, height: 320, alignItems: 'center', justifyContent: 'center' }}>
        {/* breathing swell halo behind the orb */}
        <Animated.View style={[{ position: 'absolute', width: 312, height: 312, borderRadius: 156, backgroundColor: '#0A84FF18' }, aSwell]} />
        <WaterCircle size={288} fill={fill} color="#0A84FF" color2="#5E5CE6" amp={14} periods={1.6} speedMs={2200}>
          <Text style={{ color: '#fff', fontSize: 54, fontWeight: '800', fontVariant: ['tabular-nums'] as any, letterSpacing: -1.8,
            textShadowColor: '#00000055', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } }}>
            {mm}:{ss}
          </Text>
        </WaterCircle>
      </View>

      <Text style={{ color: t.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 }}>
        {ru ? 'Просто смотри, как наполняется. Делать ничего не нужно — тяга уходит сама.'
            : 'Just watch it fill. Do nothing — the urge leaves on its own.'}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <Pressable onPress={onBack} hitSlop={10} style={{ paddingVertical: 8 }}>
          <Text style={{ color: t.textDim, fontSize: 14 }}>← {ru ? 'Назад' : 'Back'}</Text>
        </Pressable>
        <Pressable onPress={toggleMute} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Text style={{ fontSize: 15 }}>{muted ? '🔇' : '🌊'}</Text>
          <Text style={{ color: t.textDim, fontSize: 14 }}>{muted ? (ru ? 'Включить звук' : 'Sound on') : (ru ? 'Без звука' : 'Mute')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionLabel({ t, text }: { t: Theme; text: string }) {
  return (
    <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 8 }}>
      {text}
    </Text>
  );
}

// Compact equal-weight tile — used for the low-noise row of alternatives.
function MiniTile({ t, icon: I, color, title, sub, onPress }: {
  t: Theme; icon: IconC; color: string; title: string; sub: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}
      style={({ pressed }) => ({
        flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: radius.lg, backgroundColor: t.bgElev,
        borderWidth: 1, borderColor: t.border, alignItems: 'center', gap: 8, minHeight: 96,
        opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color + '24', alignItems: 'center', justifyContent: 'center' }}>
        <I size={24} color={color} />
      </View>
      <View style={{ alignItems: 'center', gap: 1 }}>
        <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: t.textDim, fontSize: 11.5 }}>{sub}</Text>
      </View>
    </Pressable>
  );
}

function ContextRow({ t, icon: I, color, title, sub, onPress }: {
  t: Theme; icon: IconC; color: string; title: string; sub: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}
      style={({ pressed }) => ({
        padding: 14, borderRadius: radius.lg, backgroundColor: t.bgElev,
        borderWidth: 1, borderColor: t.border, borderLeftWidth: 3, borderLeftColor: color,
        flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: color + '24', alignItems: 'center', justifyContent: 'center' }}>
        <I size={22} color={color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: t.textDim, fontSize: 12.5 }}>{sub}</Text>
      </View>
      <Icon.arrowRight size={16} color={t.textDim} />
    </Pressable>
  );
}
