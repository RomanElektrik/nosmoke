import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { Icon } from '../../components/Icon';
import { update, useAppState } from '../../lib/storage';
import { requestPermissions, scheduleQuitProgram } from '../../lib/notifications';
import { recommendStep, getStep } from '../../lib/stepped';

export default function Plan() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const lang = currentLang();
  const p = state.profile;
  const recommended = p ? recommendStep(p) : 'L1_behavioral';
  const step = getStep(recommended);

  async function start() {
    if (!p) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await requestPermissions();
    const now = Date.now();
    await update((s) => ({
      ...s,
      profile: s.profile ? {
        ...s.profile,
        quitDate: now,
        onboardingComplete: true,
        currentStep: recommended,
        stepEnteredAt: now,
      } : s.profile,
    }));
    await scheduleQuitProgram(now, lang, 8, p.checkInHour ?? 21);
    router.replace('/(tabs)');
  }

  if (!p) return null;
  const cigsPerYear = p.cigsPerDay * 365;
  const yearMoneyLost = (cigsPerYear / p.cigsInPack) * p.packPrice;
  const lifeLostHours = (cigsPerYear * 11) / 60; // CDC: 11 min/cig

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 30 }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: step.color + '24', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.seedling size={48} color={step.color} />
        </View>
        <Text style={{ color: t.text, fontSize: 32, fontWeight: '700', letterSpacing: -0.8 }}>
          {lang === 'ru' ? 'Твой план готов' : 'Your plan is ready'}
        </Text>

        {/* Recommended step */}
        <View style={{
          padding: 16, borderRadius: radius.lg,
          backgroundColor: step.color + '14', borderWidth: 1, borderColor: step.color + '40',
        }}>
          <Text style={{ color: step.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? `Рекомендуем стартовать со ступени ${step.index} из 5` : `Start at step ${step.index} of 5`}
          </Text>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', marginTop: 6 }}>
            {lang === 'ru' ? step.titleRu : step.titleEn}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            {lang === 'ru' ? step.whyRu : step.whyEn}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 11, marginTop: 8 }}>{step.evidenceRu}</Text>
        </View>

        {/* Personal risk feedback (Kotz 2009 lung-age style) */}
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8 }}>
          <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Что курение стоит лично тебе в год' : 'What smoking costs you per year'}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            {lang === 'ru'
              ? `Ты выкуриваешь около ${cigsPerYear.toLocaleString('ru-RU')} сигарет в год.`
              : `You smoke ~${cigsPerYear.toLocaleString('en-US')} cigarettes per year.`}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            {lang === 'ru'
              ? `Это ~${Math.round(yearMoneyLost).toLocaleString('ru-RU')} ${p.currency} и ~${Math.round(lifeLostHours)} часов жизни (CDC: 11 минут на сигарету).`
              : `That's ~${Math.round(yearMoneyLost).toLocaleString('en-US')} ${p.currency} and ~${Math.round(lifeLostHours)} hours of life (CDC: 11 min per cigarette).`}
          </Text>
        </View>

        {/* Commitment summary */}
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8 }}>
          <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Твой контракт' : 'Your contract'}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            • {lang === 'ru' ? 'Режим' : 'Mode'}: <Text style={{ fontWeight: '700' }}>{p.commitmentMode === 'hardcore' ? (lang === 'ru' ? 'Жёсткий' : 'Hardcore') : (lang === 'ru' ? 'Мягкий' : 'Soft')}</Text>
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            • {lang === 'ru' ? 'Чек-ин каждый день в' : 'Daily check-in at'}: <Text style={{ fontWeight: '700' }}>{String(p.checkInHour ?? 21).padStart(2, '0')}:00</Text>
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            • {lang === 'ru' ? 'Если этот метод не сработает — сами поднимем до следующего' : 'If this method does not work — we step up automatically'}
          </Text>
        </View>

        <Pressable onPress={start}
          style={({ pressed }) => ({
            marginTop: 8, backgroundColor: t.accent, borderRadius: radius.xl, paddingVertical: 18,
            alignItems: 'center', opacity: pressed ? 0.85 : 1,
          })}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{lang === 'ru' ? 'Бросаю прямо сейчас' : 'Quitting right now'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
