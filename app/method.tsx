// Method browser. Two paths:
// 1) Tap «Мастер смены метода» — full /transition wizard with reflection.
// 2) Tap any specific method card — quick switch with one Alert confirmation
//    (lets user pick a lighter method or any preferred one directly).

import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import type { StepLevel } from '../lib/storage';
import { STEPS, recommendStep, getStep } from '../lib/stepped';
import { Icon } from '../components/Icon';

export default function MethodScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [state] = useAppState();
  const current = state.profile?.currentStep;
  const recommended = state.profile ? recommendStep(state.profile) : undefined;

  function pick(id: StepLevel) {
    if (id === current) return;
    const target = getStep(id);
    Haptics.selectionAsync();
    Alert.alert(
      lang === 'ru' ? `Перейти на «${target.titleRu}»?` : `Switch to "${target.titleEn}"?`,
      lang === 'ru'
        ? `${target.whyRu}\n\nЕсли хочешь полноценную пересборку плана с разбором того, что не сработало — открой Мастер.`
        : `${target.whyEn}\n\nFor a full plan rebuild with reflection on what didn't work — open the Wizard.`,
      [
        { text: lang === 'ru' ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: lang === 'ru' ? 'Открыть Мастер' : 'Open Wizard', onPress: () => router.replace('/transition') },
        {
          text: lang === 'ru' ? 'Перейти сейчас' : 'Switch now',
          onPress: async () => {
            await update((s) => ({
              ...s,
              profile: s.profile ? { ...s.profile, currentStep: id, stepEnteredAt: Date.now() } : s.profile,
            }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 14, paddingBottom: 60 }}>
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
          {lang === 'ru' ? 'Подбор метода' : 'Pick a method'}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {lang === 'ru'
            ? 'Тапни любой метод — переключишься сразу. Хочешь полную пересборку с разбором что не сработало — открой Мастер.'
            : 'Tap any method — switches immediately. Want a full rebuild with reflection — open the Wizard.'}
        </Text>

        <Pressable onPress={() => { Haptics.selectionAsync(); router.replace('/transition'); }}
          style={{ padding: 16, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Icon.shieldStar size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {lang === 'ru' ? 'Мастер смены метода' : 'Method change wizard'}
          </Text>
        </Pressable>

        {STEPS.map((s) => {
          const isCurrent = current === s.id;
          const isRecommended = recommended === s.id;
          return (
            <Pressable key={s.id} onPress={() => pick(s.id)}>
              <View style={{
                padding: 16, borderRadius: radius.lg,
                backgroundColor: isCurrent ? s.color + '14' : t.bgElev,
                borderWidth: 2, borderColor: isCurrent ? s.color : 'transparent',
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 14, backgroundColor: s.color + '24',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: s.color, fontWeight: '800', fontSize: 17 }}>{s.index}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', flexShrink: 1 }} numberOfLines={2}>
                        {lang === 'ru' ? s.titleRu : s.titleEn}
                      </Text>
                      {isRecommended && !isCurrent && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: t.accentSoft }}>
                          <Text style={{ color: t.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>
                            {lang === 'ru' ? 'РЕКОМЕНДУЕМ' : 'RECOMMENDED'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                      {lang === 'ru' ? s.shortRu : s.shortEn}
                    </Text>
                  </View>
                  {isCurrent && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon.check size={14} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={{ color: t.text, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
                  {lang === 'ru' ? s.whyRu : s.whyEn}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 11, marginTop: 4 }}>
                  {s.evidenceRu} · {lang === 'ru' ? `${s.durationDays} дней` : `${s.durationDays} days`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
