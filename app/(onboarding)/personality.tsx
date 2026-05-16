import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation } from '../../lib/i18n';
import { QUESTIONS, scoreArchetype, ARCHETYPE_META } from '../../lib/personality';
import { update } from '../../lib/storage';
import { Icon } from '../../components/Icon';

export default function Personality() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [step, setStep] = useState<'intro' | number | 'result'>('intro');
  const [answers, setAnswers] = useState<number[]>([]);

  if (step === 'intro') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, padding: spacing.lg, justifyContent: 'space-between' }}>
        <View style={{ marginTop: 60, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.brain size={40} color={t.accent} />
          </View>
          <Text style={{ color: t.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.8, lineHeight: 40 }}>
            {tr('pers.intro_title')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 17, lineHeight: 24 }}>
            {tr('pers.intro_sub')}
          </Text>
        </View>
        <Pressable onPress={() => setStep(0)}
          style={{ backgroundColor: t.accent, borderRadius: radius.xl, paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{tr('pers.start')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (step === 'result') {
    const { winner, scores } = scoreArchetype(answers);
    const meta = ARCHETYPE_META[winner];
    const ArchIcon = Icon[meta.icon];
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

    async function go() {
      await update((s) => ({
        ...s,
        profile: s.profile ? { ...s.profile, archetype: winner, archetypeScores: scores } : s.profile,
      }));
      router.replace('/(onboarding)/depth');
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18 }}>
          <Text style={{ color: t.textDim, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {tr('pers.result_title')}
          </Text>
          <LinearGradient
            colors={[meta.color + '40', meta.color + '10']}
            style={{ borderRadius: radius.lg, padding: 22, borderWidth: 1, borderColor: meta.color + '60' }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: meta.color + '24', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <ArchIcon size={36} color={meta.color} />
            </View>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
              {tr(meta.titleKey)}
            </Text>
            <Text style={{ color: t.text, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
              {tr(meta.tipKey)}
            </Text>
          </LinearGradient>

          <View style={{ gap: 8, marginTop: 6 }}>
            {(Object.keys(scores) as (keyof typeof scores)[]).map((k) => {
              const m = ARCHETYPE_META[k];
              const pct = (scores[k] / total) * 100;
              return (
                <View key={k}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: t.textDim, fontSize: 13 }}>{tr(m.titleKey)}</Text>
                    <Text style={{ color: t.textDim, fontSize: 13 }}>{Math.round(pct)}%</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: t.border, borderRadius: 6 }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: m.color, borderRadius: 6 }} />
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable onPress={go}
            style={{ marginTop: 20, padding: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{tr('pers.result_cta')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const idx = step;
  const q = QUESTIONS[idx];

  function pick(optIdx: number) {
    Haptics.selectionAsync();
    const next = [...answers];
    next[idx] = optIdx;
    setAnswers(next);
    setTimeout(() => {
      if (idx + 1 < QUESTIONS.length) setStep(idx + 1);
      else setStep('result');
    }, 180);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', gap: 4, padding: spacing.md }}>
        {QUESTIONS.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 3, backgroundColor: i <= idx ? t.accent : t.border }} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16 }}>
        <Text style={{ color: t.textDim, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {idx + 1} / {QUESTIONS.length}
        </Text>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6, lineHeight: 32 }}>
          {tr(q.qKey)}
        </Text>
        <View style={{ gap: 10, marginTop: 8 }}>
          {q.options.map((o, i) => {
            const sel = answers[idx] === i;
            return (
              <Pressable key={i} onPress={() => pick(i)}
                style={{
                  padding: 16, borderRadius: radius.md,
                  backgroundColor: sel ? t.accentSoft : t.bgElev,
                  borderWidth: 1, borderColor: sel ? t.accent : t.border,
                }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: sel ? '600' : '400', lineHeight: 22 }}>
                  {tr(o.key)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
