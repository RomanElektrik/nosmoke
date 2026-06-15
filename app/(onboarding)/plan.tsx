import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { Icon } from '../../components/Icon';
import { update, useAppState } from '../../lib/storage';
import { requestPermissions, scheduleQuitProgram } from '../../lib/notifications';
import { recommendStep, getStep } from '../../lib/stepped';
import { archetypeIdentity } from '../../lib/identity';

export default function Plan() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const lang = currentLang();
  const p = state.profile;
  const recommended = p ? recommendStep(p) : 'L1_behavioral';
  const step = getStep(recommended);
  const isTaper = p?.method === 'taper';
  const [taperWeeks, setTaperWeeks] = useState(4);
  const [identityStatement, setIdentityStatement] = useState(p?.identityStatement ?? '');

  async function start() {
    if (!p) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await requestPermissions();
    const now = Date.now();
    const taperTargetDate = isTaper ? now + taperWeeks * 7 * 86400_000 : undefined;
    await update((s) => ({
      ...s,
      profile: s.profile ? {
        ...s.profile,
        quitDate: now,
        // onboardingComplete НЕ ставим здесь — иначе гард мгновенно уведёт на
        // /(tabs) до показа оффера. Флаг выставит paywall при выходе (done()).
        currentStep: recommended,
        stepEnteredAt: now,
        identityStatement: identityStatement.trim() || undefined,
        taperWeeks: isTaper ? taperWeeks : undefined,
        taperTargetDate,
      } : s.profile,
    }));
    await scheduleQuitProgram(now, lang, 8, p.checkInHour ?? 21);
    // Ага-момент показан → оффер. onb=1 переводит paywall в режим воронки:
    // закрытие/триал/оплата ведут вперёд в приложение, а не назад на план.
    router.replace('/paywall?onb=1' as any);
  }

  if (!p) return null;
  const cigsPerYear = p.cigsPerDay * 365;
  const yearMoneySaved = (cigsPerYear / p.cigsInPack) * p.packPrice;

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

        {/* Identity — who you're becoming (replaces the old scare-stat). */}
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.accent + '12', borderWidth: 1, borderColor: t.accent + '40', gap: 10 }}>
          <Text style={{ color: t.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Кем ты становишься' : 'Who you become'}
          </Text>
          {!!archetypeIdentity(p.archetype, lang) && (
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', lineHeight: 23 }}>
              {archetypeIdentity(p.archetype, lang)}
            </Text>
          )}
          <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
            {lang === 'ru'
              ? `За год ты оставишь себе около ${Math.round(yearMoneySaved).toLocaleString('ru-RU')} ${p.currency} — и лёгкие, сон и кожу без никотина.`
              : `In a year you'll keep ~${Math.round(yearMoneySaved).toLocaleString('en-US')} ${p.currency} — plus lungs, sleep and skin off nicotine.`}
          </Text>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
            {lang === 'ru' ? 'Я становлюсь…' : "I'm becoming…"}
          </Text>
          <TextInput
            value={identityStatement} onChangeText={setIdentityStatement}
            placeholder={lang === 'ru' ? 'свободным / здоровым отцом / хозяином себя' : 'free / a healthy parent / my own master'}
            placeholderTextColor={t.textDim}
            style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, fontSize: 15 }}
          />
        </View>

        {/* Commitment summary */}
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8 }}>
          <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Твой контракт' : 'Your contract'}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            • {lang === 'ru' ? 'Каждый день подтверждаешь: «я не курю»' : 'Each day you affirm: "I don\'t smoke"'}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            • {lang === 'ru' ? 'Срыв не обнуляет прогресс — разбираем причину и идём дальше' : 'A slip never resets progress — we analyse the cause and move on'}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
            • {lang === 'ru' ? 'Если этот метод не сработает — сами поднимем до следующего' : 'If this method does not work — we step up automatically'}
          </Text>
        </View>

        {/* Taper plan — only for users who chose gradual reduction */}
        {isTaper && (() => {
          const targetMs = Date.now() + taperWeeks * 7 * 86400_000;
          const targetStr = new Date(targetMs).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });
          return (
            <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: '#FF9F0A14', borderWidth: 1, borderColor: '#FF9F0A40', gap: 10 }}>
              <Text style={{ color: '#FF9F0A', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                {lang === 'ru' ? 'Постепенное снижение' : 'Gradual reduction'}
              </Text>
              <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
                {lang === 'ru'
                  ? 'Ты выбрал бросать постепенно. Начинаем снижать сегодня, полный отказ — к выбранной дате.'
                  : 'You chose to quit gradually. We start reducing today; full quit by the chosen date.'}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {lang === 'ru' ? 'За сколько недель' : 'Over how many weeks'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[2, 4, 6, 8].map((w) => {
                  const sel = taperWeeks === w;
                  return (
                    <Pressable key={w} onPress={() => { Haptics.selectionAsync(); setTaperWeeks(w); }}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
                        backgroundColor: sel ? '#FF9F0A' : t.bgElev, borderWidth: 1, borderColor: sel ? '#FF9F0A' : t.border }}>
                      <Text style={{ color: sel ? '#fff' : t.text, fontWeight: '700' }}>{w} {lang === 'ru' ? 'нед' : 'wk'}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={{ color: t.text, fontSize: 14 }}>
                {lang === 'ru' ? 'Дата полного отказа: ' : 'Full quit date: '}
                <Text style={{ fontWeight: '700' }}>{targetStr}</Text>
              </Text>
            </View>
          );
        })()}

        <Pressable onPress={start}
          style={({ pressed }) => ({
            marginTop: 8, backgroundColor: t.accent, borderRadius: radius.xl, paddingVertical: 18,
            alignItems: 'center', opacity: pressed ? 0.85 : 1,
          })}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            {isTaper
              ? (lang === 'ru' ? 'Начинаю снижать сегодня' : 'Start reducing today')
              : (lang === 'ru' ? 'Бросаю прямо сейчас' : 'Quitting right now')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
