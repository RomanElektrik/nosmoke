import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { BreathingOrb } from '../components/BreathingOrb';
import { Icon } from '../components/Icon';
import { update, useAppState } from '../lib/storage';
import type { Trigger } from '../lib/storage';

type Phase = 'breath' | 'choose' | 'log' | 'win';

export default function Craving() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const [phase, setPhase] = useState<Phase>('breath');
  const [intensity, setIntensity] = useState(6);
  const [trigger, setTrigger] = useState<Trigger | undefined>();
  const [outcome, setOutcome] = useState<'resisted' | 'smoked' | null>(null);

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

        {phase === 'breath' && (
          <>
            <Text style={{ color: t.textDim, fontSize: 16 }}>{tr('sos.step_breath')}</Text>
            <BreathingOrb totalSeconds={60} onDone={() => setPhase('choose')} />
            <Pressable onPress={() => setPhase('choose')}>
              <Text style={{ color: t.textDim, textAlign: 'center' }}>{tr('common.skip')} →</Text>
            </Pressable>
          </>
        )}

        {phase === 'choose' && (
          <>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '600' }}>{tr('sos.next')}</Text>
            {[
              { icon: Icon.feather,  color: '#0A84FF', label: tr('sos.opt_surf'),
                onPress: () => router.push('/practice/urge_surf') },
              { icon: Icon.wind,     color: '#5AC8FA', label: tr('tech.cyclic.t'),
                onPress: () => router.push('/practice/cyclic_sigh') },
              { icon: Icon.sparkle,  color: '#BF5AF2', label: tr('tech.ground.t'),
                onPress: () => router.push('/practice/grounding') },
              { icon: Icon.pulse,    color: '#FF9F0A', label: tr('practice.halt.title'),
                onPress: () => router.push('/practice/halt_check') },
              { icon: Icon.drop,     color: '#5AC8FA', label: tr('tech.replace.t'),
                onPress: () => router.push('/practice/replace') },
              { icon: Icon.chat,     color: '#30D158', label: tr('sos.opt_coach'),
                onPress: () => router.replace('/(tabs)/coach') },
              ...(state.profile?.faithEnabled ? [{
                icon: Icon.cross, color: '#FF9500', label: tr('sos.opt_pray'),
                onPress: () => router.replace('/faith'),
              }] : []),
            ].map((o, i) => (
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
            ))}
            <Pressable onPress={() => setPhase('log')}
              style={{ padding: 14, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: t.accent, fontWeight: '600' }}>{tr('sos.result_q')}</Text>
            </Pressable>
          </>
        )}

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
