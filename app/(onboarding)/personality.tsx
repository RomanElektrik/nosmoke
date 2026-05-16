import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { QUESTIONS, scoreArchetype, ARCHETYPE_META } from '../../lib/personality';
import { update } from '../../lib/storage';
import { Icon } from '../../components/Icon';

const tt = (ru: string, en: string) => (currentLang() === 'ru' ? ru : en);

export default function Personality() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [step, setStep] = useState<'intro' | number | 'result'>('intro');
  const [answers, setAnswers] = useState<number[]>([]);

  if (step === 'intro') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, justifyContent: 'space-between' }}>
          <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 18, marginTop: 20 }}>
            {/* Icon badge */}
            <LinearGradient
              colors={['#BF5AF238', '#BF5AF20A']}
              style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.brain size={34} color="#BF5AF2" />
            </LinearGradient>
            <View style={{ gap: 10 }}>
              <Text style={{ color: t.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.8, lineHeight: 38 }}>
                {tr('pers.intro_title')}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 16, lineHeight: 23 }}>
                {tr('pers.intro_sub')}
              </Text>
            </View>
            <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 10 }}>
              {[
                { icon: 'target' as const, color: '#BF5AF2', textRu: '5 коротких вопросов', textEn: '5 short questions' },
                { icon: 'star' as const,   color: '#FF9F0A', textRu: 'Определим твой тип зависимости', textEn: 'We identify your dependency type' },
                { icon: 'leaf' as const,   color: '#30D158', textRu: 'Подберём подходящую стратегию', textEn: 'We match a fitting strategy' },
              ].map((row) => {
                const I = Icon[row.icon];
                return (
                  <View key={row.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: row.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <I size={16} color={row.color} />
                    </View>
                    <Text style={{ color: t.text, fontSize: 15 }}>{tt(row.textRu, row.textEn)}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Pressable onPress={() => { Haptics.selectionAsync(); setStep(0); }}
            style={{ backgroundColor: t.accent, borderRadius: radius.xl, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{tr('pers.start')}</Text>
            <Icon.arrowRight size={18} color="#fff" />
          </Pressable>
        </ScrollView>
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
          <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 18 }}>
            {/* Badge */}
            <LinearGradient
              colors={[meta.color + '38', meta.color + '0A']}
              style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
              <ArchIcon size={34} color={meta.color} />
            </LinearGradient>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {tr('pers.result_title')}
            </Text>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, lineHeight: 36 }}>
              {tr(meta.titleKey)}
            </Text>

            <LinearGradient
              colors={[meta.color + '30', meta.color + '08']}
              style={{ borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: meta.color + '40' }}>
              <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
                {tr(meta.tipKey)}
              </Text>
            </LinearGradient>

            <View style={{ gap: 10, marginTop: 4 }}>
              {(Object.keys(scores) as (keyof typeof scores)[]).map((k) => {
                const m = ARCHETYPE_META[k];
                const pct = (scores[k] / total) * 100;
                return (
                  <View key={k}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ color: t.textDim, fontSize: 13 }}>{tr(m.titleKey)}</Text>
                      <Text style={{ color: t.textDim, fontSize: 13 }}>{Math.round(pct)}%</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: t.border, borderRadius: 999 }}>
                      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: m.color, borderRadius: 999 }} />
                    </View>
                  </View>
                );
              })}
            </View>

            <Pressable onPress={go}
              style={{ marginTop: 12, padding: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{tr('pers.result_cta')}</Text>
              <Icon.arrowRight size={18} color="#fff" />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const idx = step as number;
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
      {/* Progress */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: 8 }}>
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
          {tt(`Вопрос ${idx + 1} из ${QUESTIONS.length}`, `Question ${idx + 1} of ${QUESTIONS.length}`)}
        </Text>
        <View style={{ height: 6, borderRadius: 6, backgroundColor: t.border, overflow: 'hidden' }}>
          <View style={{ width: `${((idx + 1) / QUESTIONS.length) * 100}%`, height: '100%', backgroundColor: '#BF5AF2', borderRadius: 6 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16, paddingBottom: 40, flexGrow: 1 }}>
        <Animated.View key={idx} entering={FadeInDown.duration(260)} style={{ gap: 16 }}>
          {/* Icon badge */}
          <LinearGradient
            colors={['#BF5AF238', '#BF5AF20A']}
            style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.brain size={34} color="#BF5AF2" />
          </LinearGradient>

          <Text style={{ color: t.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, lineHeight: 33 }}>
            {tr(q.qKey)}
          </Text>

          <View style={{ gap: 10, marginTop: 4 }}>
            {q.options.map((o, i) => {
              const sel = answers[idx] === i;
              return (
                <Pressable key={i} onPress={() => pick(i)}
                  style={{
                    paddingVertical: 17, paddingHorizontal: 18, borderRadius: radius.lg,
                    backgroundColor: sel ? '#BF5AF216' : t.bgElev,
                    borderWidth: 1.5, borderColor: sel ? '#BF5AF2' : t.border,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}>
                  <Text style={{ color: t.text, fontSize: 17, fontWeight: sel ? '700' : '500', flex: 1, lineHeight: 22 }}>
                    {tr(o.key)}
                  </Text>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    borderWidth: 2, borderColor: sel ? '#BF5AF2' : t.border,
                    backgroundColor: sel ? '#BF5AF2' : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {sel && <Icon.check size={13} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
