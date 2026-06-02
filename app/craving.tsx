import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { BreathingOrb } from '../components/BreathingOrb';
import { Icon } from '../components/Icon';
import { update, useAppState } from '../lib/storage';
import type { Trigger } from '../lib/storage';
import { nextDueDose, MED_SAFETY } from '../lib/medication';
import { triggerLabel, relevantPlan } from '../lib/identity';

type Phase = 'breath' | 'choose' | 'log' | 'win';

export default function Craving() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  // Open straight to the choice menu — don't gate a person in crisis behind
  // a forced 60s breathing timer. Breathing is one prominent option below.
  const [phase, setPhase] = useState<Phase>('choose');
  const [intensity, setIntensity] = useState(6);
  const [trigger, setTrigger] = useState<Trigger | undefined>();
  const [outcome, setOutcome] = useState<'resisted' | 'smoked' | null>(null);
  const [showAll, setShowAll] = useState(false);

  async function save() {
    if (!outcome) return;
    Haptics.notificationAsync(
      outcome === 'resisted' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
    // A slip never resets the quit date / streak (AVE-aware lapse recovery).
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
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18 }}>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>{tr('sos.title')}</Text>

        {phase === 'breath' && (() => {
          const ru = (state.profile?.language ?? 'ru') === 'ru';
          return (
            <>
              <Text style={{ color: t.textDim, fontSize: 16 }}>{tr('sos.step_breath')}</Text>
              <BreathingOrb totalSeconds={60} onDone={() => setPhase('choose')} />
              <Pressable onPress={() => setPhase('choose')}>
                <Text style={{ color: t.textDim, textAlign: 'center' }}>← {ru ? 'Назад к вариантам' : 'Back to options'}</Text>
              </Pressable>
            </>
          );
        })()}

        {phase === 'choose' && (() => {
          const ru = (state.profile?.language ?? 'ru') === 'ru';
          // ONE recommended action — urge surfing is the evidence-based craving-moment skill.
          const others = [
            { icon: Icon.lungs,   color: '#5AC8FA', label: tr('tech.cyclic.t'),       onPress: () => router.push('/practice/cyclic_sigh') },
            { icon: Icon.swap,    color: '#5AC8FA', label: tr('tech.replace.t'),      onPress: () => router.push('/practice/replace') },
            { icon: Icon.chat,    color: '#30D158', label: tr('sos.opt_coach'),       onPress: () => router.replace('/(tabs)/coach') },
            { icon: Icon.play,    color: '#BF5AF2', label: (state.profile?.language ?? 'ru') === 'ru' ? 'Отвлечься в игре' : 'Play a distraction game', onPress: () => router.push('/game') },
            ...(state.profile?.faithEnabled ? [{
              icon: Icon.cross, color: '#FF9500', label: tr('sos.opt_pray'),
              onPress: () => router.replace('/faith'),
            }] : []),
          ];
          // Surface the most relevant if-then plan + a due medication dose.
          const planForNow = relevantPlan(state.ifThens ?? [], state.cravings);
          const due = nextDueDose(state);
          const med = state.profile?.medication;
          const medName = med ? (ru ? MED_SAFETY[med].nameRu : MED_SAFETY[med].nameEn) : '';
          return (
            <>
              {/* «Бриз звонит» — the signature crisis mechanic, top of the list */}
              <Pressable onPress={() => router.push('/call' as any)}
                style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
                <LinearGradient colors={['#3BD168', '#0A84FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF2A', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 26 }}>📞</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{ru ? 'Пусть Бриз позвонит' : 'Let Breeze call you'}</Text>
                    <Text style={{ color: '#ffffffcc', fontSize: 13, marginTop: 2 }}>{ru ? 'Голос проведёт тебя через тягу — 1 минута' : 'A voice walks you through the urge — 1 min'}</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Breathe — an option now, not a forced gate */}
              <Pressable onPress={() => { Haptics.selectionAsync(); setPhase('breath'); }}
                style={{ padding: 16, borderRadius: radius.lg, backgroundColor: '#5AC8FA14', borderWidth: 1, borderColor: '#5AC8FA50', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#5AC8FA24', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.wind size={22} color="#5AC8FA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{ru ? 'Подышать минуту' : 'Breathe for a minute'}</Text>
                  <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{ru ? 'Самый быстрый способ сбить тягу' : 'The fastest way to cut the urge'}</Text>
                </View>
                <Text style={{ color: '#5AC8FA', fontSize: 18 }}>›</Text>
              </Pressable>

              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 10 }}>{tr('sos.next')}</Text>

              {/* Your own if-then plan — the plan IS the intervention */}
              {planForNow && (
                <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.accent + '14', borderWidth: 1, borderColor: t.accent + '50', gap: 6 }}>
                  <Text style={{ color: t.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {ru ? 'Твой план' : 'Your plan'}{planForNow.category ? ` · ${triggerLabel(planForNow.category, ru ? 'ru' : 'en')}` : ''}
                  </Text>
                  <Text style={{ color: t.text, fontSize: 15, lineHeight: 21 }}>
                    <Text style={{ color: t.accent, fontWeight: '700' }}>{ru ? 'Если ' : 'If '}</Text>
                    {planForNow.trigger}
                    <Text style={{ color: t.warn, fontWeight: '700' }}>{ru ? ' → то ' : ' → then '}</Text>
                    {planForNow.action}
                  </Text>
                </View>
              )}

              {/* Due medication dose shortcut */}
              {due && (
                <Pressable onPress={() => router.push('/meds')}
                  style={{ padding: 14, borderRadius: radius.lg, backgroundColor: t.info + '14', borderWidth: 1, borderColor: t.info + '50', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.info + '24', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon.shield size={22} color={t.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{ru ? `Прими дозу · ${medName}` : `Take your dose · ${medName}`}</Text>
                    <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{ru ? 'Доза по расписанию уже наступила' : 'A scheduled dose is due'}</Text>
                  </View>
                  <Text style={{ color: t.info, fontSize: 18 }}>›</Text>
                </Pressable>
              )}

              {/* Primary recommended action */}
              <Pressable onPress={() => router.push('/practice/urge_surf')}
                style={{ padding: 18, borderRadius: radius.lg, backgroundColor: '#0A84FF14', borderWidth: 1, borderColor: '#0A84FF50', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#0A84FF24', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon.waves size={26} color="#0A84FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0A84FF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {ru ? 'Сделай сейчас' : 'Do this now'}
                    </Text>
                    <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', marginTop: 2 }}>{tr('sos.opt_surf')}</Text>
                  </View>
                </View>
                <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
                  {ru
                    ? 'Тяга — это волна: она нарастает и спадает за 3–5 минут. Прокатись на ней, не туши.'
                    : 'A craving is a wave — it rises and falls within 3–5 minutes. Surf it instead of fighting.'}
                </Text>
              </Pressable>

              {!showAll ? (
                <Pressable onPress={() => { Haptics.selectionAsync(); setShowAll(true); }}
                  style={{ padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: t.accent, fontWeight: '600' }}>
                    {ru ? 'Другие техники' : 'Other techniques'}
                  </Text>
                </Pressable>
              ) : (
                others.map((o, i) => (
                  <Pressable key={i} onPress={o.onPress}
                    style={{
                      padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev,
                      borderWidth: 1, borderColor: t.border,
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                    }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: o.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <o.icon size={20} color={o.color} />
                    </View>
                    <Text style={{ color: t.text, fontSize: 16, flex: 1 }}>{o.label}</Text>
                    <Icon.arrowRight size={16} color={t.textDim} />
                  </Pressable>
                ))
              )}

              <Pressable onPress={() => { Haptics.selectionAsync(); setPhase('log'); }}
                style={{ padding: 16, marginTop: 8, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, backgroundColor: t.bgElev, alignItems: 'center' }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{tr('sos.result_q')}</Text>
              </Pressable>
            </>
          );
        })()}

        {phase === 'log' && (
          <>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '600' }}>{tr('sos.result_q')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['resisted', 'smoked'] as const).map((o) => (
                <Pressable key={o} onPress={() => setOutcome(o)}
                  style={{
                    flex: 1, padding: 18, borderRadius: radius.md, alignItems: 'center',
                    backgroundColor: outcome === o ? (o === 'resisted' ? t.accentSoft : t.border) : t.bgElev,
                    borderWidth: 1, borderColor: outcome === o ? (o === 'resisted' ? t.accent : t.warn) : t.border,
                  }}>
                  <Text style={{ color: t.text, fontWeight: '600' }}>{tr(`sos.${o}`)}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ color: t.textDim, marginTop: 8 }}>{tr('sos.intensity_q')}: {intensity}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Pressable key={i} onPress={() => setIntensity(i + 1)}
                  style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: i < intensity ? t.accent : t.border }} />
              ))}
            </View>

            <Text style={{ color: t.textDim, marginTop: 8 }}>{tr('sos.trigger_q')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['stress','coffee','alcohol','after_meal','driving','social','boredom'] as Trigger[]).map((tg) => (
                <Pressable key={tg} onPress={() => setTrigger(tg)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                    backgroundColor: trigger === tg ? t.accentSoft : t.bgElev,
                    borderWidth: 1, borderColor: trigger === tg ? t.accent : t.border,
                  }}>
                  <Text style={{ color: t.text, fontSize: 13 }}>{tr(`onb.trig_${tg}`)}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={save} disabled={!outcome}
              style={{ marginTop: 16, padding: 18, borderRadius: radius.xl, backgroundColor: outcome ? t.accent : t.border, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{tr('common.save')}</Text>
            </Pressable>
          </>
        )}

        {phase === 'win' && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 14 }}>
            <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.wave2 size={56} color={t.accent} />
            </View>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' }}>{tr('sos.win_title')}</Text>
            <Text style={{ color: t.textDim, fontSize: 16, textAlign: 'center', lineHeight: 22 }}>{tr('sos.win_sub')}</Text>
            <Pressable onPress={() => router.back()}
              style={{ marginTop: 20, padding: 18, paddingHorizontal: 40, borderRadius: radius.xl, backgroundColor: t.accent }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{tr('common.done')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
