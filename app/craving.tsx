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
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { useTheme, spacing, radius, type Theme } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { BreathingOrb } from '../components/BreathingOrb';
import { Icon } from '../components/Icon';
import { update, useAppState } from '../lib/storage';
import type { Trigger } from '../lib/storage';
import { nextDueDose, MED_SAFETY } from '../lib/medication';
import { triggerLabel, relevantPlan } from '../lib/identity';

type Phase = 'choose' | 'wave' | 'breath' | 'log' | 'win';
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
  const [showAll, setShowAll] = useState(false);
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
          <WaveTimer onDone={() => setPhase('win')} onBack={() => setPhase('choose')} ru={ru} t={t} />
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
          const planForNow = relevantPlan(state.ifThens ?? [], state.cravings);
          const due = nextDueDose(state);
          const med = state.profile?.medication;
          const medName = med ? (ru ? MED_SAFETY[med].nameRu : MED_SAFETY[med].nameEn) : '';
          const hasContext = !!planForNow || !!due;
          const others: { icon: IconC; color: string; label: string; onPress: () => void }[] = [
            { icon: Icon.lungs, color: '#5AC8FA', label: ru ? 'Подышать минуту' : 'Breathe for a minute', onPress: () => setPhase('breath') },
            { icon: Icon.waves, color: '#0A84FF', label: ru ? 'Оседлать волну тяги' : 'Surf the urge', onPress: () => router.push('/practice/urge_surf') },
            { icon: Icon.swap,  color: '#5AC8FA', label: tr('tech.replace.t'), onPress: () => router.push('/practice/replace') },
          ];

          return (
            <>
              {/* ── HERO: wave timer ── */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPhase('wave'); }}
                style={({ pressed }) => ({ borderRadius: radius.xl, overflow: 'hidden', opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
                <LinearGradient colors={['#0A84FF', '#5E5CE6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF26', borderWidth: 1.5, borderColor: '#FFFFFF40', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon.waves size={28} color="#fff" />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Переждать волну' : 'Ride the wave'}</Text>
                    <Text style={{ color: '#FFFFFFD9', fontSize: 13, lineHeight: 18 }}>{ru ? '3 минуты — и тяга пройдёт сама' : '3 minutes — the urge passes on its own'}</Text>
                  </View>
                  <Icon.arrowRight size={20} color="#FFFFFFCC" />
                </LinearGradient>
              </Pressable>

              {/* ── Emotion picker → chat with context ── */}
              <View style={{ gap: 10, marginTop: 4 }}>
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>
                  {ru ? 'Расскажи, что ты чувствуешь' : 'Tell me what you feel'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { key: 'stress',  ru: 'В стрессе',   en: 'Stressed',  emoji: '😖', color: '#FF453A' },
                    { key: 'anxious', ru: 'Тревожно',    en: 'Anxious',   emoji: '😟', color: '#FF9500' },
                    { key: 'angry',   ru: 'Раздражён',   en: 'Irritated', emoji: '😤', color: '#FF2D78' },
                    { key: 'lonely',  ru: 'Одиноко',     en: 'Lonely',    emoji: '🥺', color: '#5AC8FA' },
                    { key: 'bored',   ru: 'Скучно',      en: 'Bored',     emoji: '😐', color: '#9AA3AF' },
                    { key: 'sad',     ru: 'Грустно',     en: 'Sad',       emoji: '😢', color: '#5E5CE6' },
                    { key: 'happy',   ru: 'Хорошо',      en: 'Happy',     emoji: '🙂', color: '#30D158' },
                    { key: 'crave',   ru: 'Просто тяга', en: 'Just craving', emoji: '🚬', color: '#BF5AF2' },
                  ].map((m) => (
                    <Pressable key={m.key}
                      onPress={() => { Haptics.selectionAsync(); router.push(`/chat?mode=support&seed=${m.key}` as any); }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999,
                        backgroundColor: m.color + '14', borderWidth: 1, borderColor: m.color + '40',
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <Text style={{ fontSize: 15 }}>{m.emoji}</Text>
                      <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '600' }}>{ru ? m.ru : m.en}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ── Quick secondary actions ── */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <QuickTile t={t} icon={Icon.play} color="#BF5AF2"
                  title={ru ? 'Отвлечься' : 'Distract'} sub={ru ? 'мини-игра' : 'mini-game'}
                  onPress={() => { Haptics.selectionAsync(); router.push('/game'); }} />
                {state.profile?.faithEnabled ? (
                  <QuickTile t={t} icon={Icon.cross} color="#FF9500"
                    title={ru ? 'Помолиться' : 'Pray'} sub={ru ? 'минута с Богом' : 'a minute with God'}
                    onPress={() => { Haptics.selectionAsync(); router.push('/faith'); }} />
                ) : (
                  <QuickTile t={t} icon={Icon.chat} color="#30D158"
                    title={ru ? 'Написать' : 'Message'} sub={ru ? 'мне написать' : 'tap to chat'}
                    onPress={() => { Haptics.selectionAsync(); router.push('/chat?mode=support' as any); }} />
                )}
              </View>

              {/* ── CONTEXT: your plan + due dose (only when present) ── */}
              {hasContext && <SectionLabel t={t} text={ru ? 'Под рукой' : 'On hand'} />}

              {planForNow && (
                <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, borderLeftWidth: 3, borderLeftColor: t.accent, gap: 6 }}>
                  <Text style={{ color: t.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {ru ? 'Твой план' : 'Your plan'}{planForNow.category ? ` · ${triggerLabel(planForNow.category, ru ? 'ru' : 'en')}` : ''}
                  </Text>
                  <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
                    <Text style={{ color: t.accent, fontWeight: '700' }}>{ru ? 'Если ' : 'If '}</Text>
                    {planForNow.trigger}
                    <Text style={{ color: t.warn, fontWeight: '700' }}>{ru ? ' → то ' : ' → then '}</Text>
                    {planForNow.action}
                  </Text>
                </View>
              )}

              {due && (
                <ContextRow t={t} icon={Icon.pill} color={t.info}
                  title={ru ? `Прими дозу · ${medName}` : `Take your dose · ${medName}`}
                  sub={ru ? 'Доза по расписанию уже наступила' : 'A scheduled dose is due'}
                  onPress={() => router.push('/meds')} />
              )}

              {/* ── MORE — collapsed ── */}
              {!showAll ? (
                <Pressable onPress={() => { Haptics.selectionAsync(); setShowAll(true); }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: t.textDim, fontWeight: '600', fontSize: 14 }}>
                    {ru ? 'Ещё техники ⌄' : 'More techniques ⌄'}
                  </Text>
                </Pressable>
              ) : (
                <View style={{ gap: 8 }}>
                  {others.map((o, i) => {
                    const I = o.icon;
                    return (
                      <Pressable key={i} onPress={o.onPress}
                        style={({ pressed }) => ({
                          padding: 12, borderRadius: radius.md, backgroundColor: t.bgElev,
                          borderWidth: 1, borderColor: t.border, opacity: pressed ? 0.8 : 1,
                          flexDirection: 'row', alignItems: 'center', gap: 12,
                        })}>
                        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: o.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                          <I size={20} color={o.color} />
                        </View>
                        <Text style={{ color: t.text, fontSize: 15, flex: 1, fontWeight: '500' }}>{o.label}</Text>
                        <Icon.arrowRight size={16} color={t.textDim} />
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable onPress={() => { Haptics.selectionAsync(); setPhase('log'); }}
                style={({ pressed }) => ({ padding: 15, marginTop: 6, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
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
function WaveTimer({ onDone, onBack, ru, t }: { onDone: () => void; onBack: () => void; ru: boolean; t: Theme }) {
  const TOTAL = 180; // 3 minutes
  const [left, setLeft] = useState(TOTAL);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Slow gentle pulse — represents the urge wave rising and falling.
    scale.value = withRepeat(withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
    const id = setInterval(() => {
      setLeft((s) => {
        const next = s - 1;
        if (next <= 0) { clearInterval(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setTimeout(onDone, 400); return 0; }
        return next;
      });
    }, 1000);
    return () => { clearInterval(id); cancelAnimation(scale); };
  }, []);

  const aPulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const passed = TOTAL - left;
  const pct = passed / TOTAL;
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');

  const stage = pct < 0.25 ? (ru ? 'Волна нарастает. Это нормально.' : 'The wave is rising. That is normal.')
    : pct < 0.5 ? (ru ? 'Дойдёт до пика — и начнёт спадать.' : 'It will peak — then start to fall.')
    : pct < 0.8 ? (ru ? 'Уже спадает. Ты сильнее тяги.' : "It's already passing. You are stronger.")
    : (ru ? 'Почти всё. Ты держался — и держишься.' : 'Almost done. You held on.');

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 22 }}>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center', paddingHorizontal: 16 }}>
        {stage}
      </Text>
      <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
        {/* outer halo */}
        <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#0A84FF14' }} />
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#0A84FF22' }} />
        <Animated.View style={[{ width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, aPulse]}>
          <LinearGradient colors={['#0A84FF', '#5E5CE6']} style={{ position: 'absolute', width: 160, height: 160 }} />
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'] as any, letterSpacing: -1 }}>{mm}:{ss}</Text>
        </Animated.View>
      </View>

      <View style={{ height: 6, width: '100%', borderRadius: 6, backgroundColor: t.border, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: '#0A84FF', borderRadius: 6 }} />
      </View>
      <Text style={{ color: t.textDim, fontSize: 13, textAlign: 'center' }}>
        {ru ? 'Просто оставайся здесь. Ничего делать не нужно.' : 'Just stay here. You don\'t need to do anything.'}
      </Text>

      <Pressable onPress={onBack} hitSlop={10} style={{ paddingVertical: 8 }}>
        <Text style={{ color: t.textDim, fontSize: 14 }}>← {ru ? 'Назад' : 'Back'}</Text>
      </Pressable>
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

function QuickTile({ t, icon: I, color, title, sub, onPress }: {
  t: Theme; icon: IconC; color: string; title: string; sub: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}
      style={({ pressed }) => ({
        flex: 1, padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev,
        borderWidth: 1, borderColor: t.border, gap: 12, minHeight: 112,
        opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color + '24', alignItems: 'center', justifyContent: 'center' }}>
        <I size={26} color={color} />
      </View>
      <View style={{ gap: 3 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: t.textDim, fontSize: 12.5 }}>{sub}</Text>
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
