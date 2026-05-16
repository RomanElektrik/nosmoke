// Daily check-in. Source: Whittaker Cochrane 2024 (mHealth RR 1.54),
// SmokefreeTXT (Abroms 2014), Russell Standard binary "did you smoke today" gate.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update, loadState } from '../lib/storage';
import type { Trigger } from '../lib/storage';
import { shouldHardReset, escalationSuggestion, getStep } from '../lib/stepped';
import { Icon } from '../components/Icon';

const TRIGGERS: Trigger[] = ['stress','coffee','alcohol','after_meal','social','boredom','driving'];

export default function CheckIn() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [state] = useAppState();

  const [phase, setPhase] = useState<'gate' | 'no' | 'yes' | 'escalate'>('gate');
  const [count, setCount] = useState<string>('');
  const [trigger, setTrigger] = useState<Trigger | undefined>();
  const [note, setNote] = useState('');
  const [escalationData, setEscalationData] = useState<ReturnType<typeof escalationSuggestion> | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function logNoSmoking() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      checkIns: [
        ...s.checkIns.filter((c) => c.date !== today),
        { date: today, smoked: false, note: note.trim() || undefined },
      ],
    }));
  }

  async function logSmoked() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const c = Number(count) || 1;
    await update((s) => {
      const newCheckIn = { date: today, smoked: true, count: c, trigger, note: note.trim() || undefined };
      const next = {
        ...s,
        checkIns: [...s.checkIns.filter((x) => x.date !== today), newCheckIn],
        slips: [...s.slips, Date.now()],
        cravings: [...s.cravings, { ts: Date.now(), intensity: 8, outcome: 'smoked' as const, trigger, note: note.trim() || undefined }],
      };
      // Hardcore-mode: reset quitDate.
      if (shouldHardReset(s) && s.profile) {
        next.profile = { ...s.profile, quitDate: Date.now() };
      }
      return next;
    });
  }

  // ----- GATE -----
  if (phase === 'gate') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
          </Pressable>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Чек-ин дня' : 'Daily check-in'}
          </Text>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, lineHeight: 36 }}>
            {lang === 'ru' ? 'Ты сегодня курил?' : 'Did you smoke today?'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21 }}>
            {lang === 'ru'
              ? 'Считается даже одна затяжка (Russell Standard).'
              : 'Even one puff counts (Russell Standard).'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Pressable onPress={() => { Haptics.selectionAsync(); setPhase('no'); }}
              style={{ flex: 1, padding: 22, borderRadius: radius.xl, backgroundColor: '#30D158', alignItems: 'center', gap: 6 }}>
              <Icon.check size={32} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{lang === 'ru' ? 'Нет' : 'No'}</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.selectionAsync(); setPhase('yes'); }}
              style={{ flex: 1, padding: 22, borderRadius: radius.xl, backgroundColor: '#FF453A', alignItems: 'center', gap: 6 }}>
              <Icon.flame size={32} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{lang === 'ru' ? 'Да' : 'Yes'}</Text>
            </Pressable>
          </View>

          <Text style={{ color: t.textDim, fontSize: 11, marginTop: 12, lineHeight: 16 }}>
            {lang === 'ru'
              ? 'Этот ответ ложится в твой дневник и помогает помощнику видеть тренд. Твой ответ → твой план.'
              : 'This answer logs in your journal and helps the assistant see the trend.'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- NO (held on) -----
  if (phase === 'no') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
            <LinearGradient colors={['#30D15838', '#30D15808']}
              style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.check size={56} color="#30D158" />
            </LinearGradient>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
              {lang === 'ru' ? 'Ещё один день твой' : 'Another day yours'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 16, lineHeight: 22 }}>
              {lang === 'ru' ? 'Запомни это ощущение. Заметка по желанию.' : 'Remember this. Optional note.'}
            </Text>
            <TextInput
              value={note} onChangeText={setNote} multiline
              placeholder={lang === 'ru' ? 'Что помогло сегодня…' : 'What helped today…'}
              placeholderTextColor={t.textDim}
              style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 80, fontSize: 16 }}
            />
            <Pressable onPress={async () => { await logNoSmoking(); router.replace('/(tabs)'); }}
              style={{ padding: 18, borderRadius: radius.xl, backgroundColor: '#30D158', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{tr('common.save')}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ----- YES (smoked) -----
  if (phase === 'yes') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
            <LinearGradient colors={['#5AC8FA38', '#5AC8FA08']}
              style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.feather size={56} color="#5AC8FA" />
            </LinearGradient>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>
              {lang === 'ru' ? 'Это данные, не приговор.' : 'Data, not a verdict.'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21 }}>
              {lang === 'ru'
                ? 'Запиши, что сработало триггером. Через 2 минуты дам персональный шаг на 48 часов.'
                : "Log the trigger. In a moment I'll give you a 48-hour step."}
            </Text>

            <View style={{ gap: 6 }}>
              <Text style={{ color: t.textDim, fontSize: 12 }}>{lang === 'ru' ? 'Сколько штук' : 'How many'}</Text>
              <TextInput
                value={count} onChangeText={setCount} keyboardType="number-pad"
                placeholder="1" placeholderTextColor={t.textDim}
                style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 20, fontWeight: '700' }}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                {lang === 'ru' ? 'Триггер' : 'Trigger'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TRIGGERS.map((tg) => {
                  const sel = trigger === tg;
                  return (
                    <Pressable key={tg} onPress={() => { Haptics.selectionAsync(); setTrigger(sel ? undefined : tg); }}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                        backgroundColor: sel ? t.accentSoft : t.bgElev,
                        borderWidth: 1, borderColor: sel ? t.accent : t.border,
                      }}>
                      <Text style={{ color: t.text, fontSize: 14 }}>{tr(`onb.trig_${tg}`)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: t.textDim, fontSize: 12 }}>{lang === 'ru' ? 'Заметка' : 'Note'}</Text>
              <TextInput
                value={note} onChangeText={setNote} multiline
                placeholder={lang === 'ru' ? 'Что произошло, что почувствовал' : 'What happened, what you felt'}
                placeholderTextColor={t.textDim}
                style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.border, minHeight: 70, fontSize: 16 }}
              />
            </View>

            <Pressable onPress={async () => {
              await logSmoked();
              const fresh = await loadState();
              const sug = escalationSuggestion(fresh);
              if (sug.yes) { setEscalationData(sug); setPhase('escalate'); }
              else router.replace('/slip');
            }}
              style={{ padding: 18, borderRadius: radius.xl, backgroundColor: '#5AC8FA', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>
                {lang === 'ru' ? 'Дальше' : 'Continue'}
              </Text>
            </Pressable>

            {state.profile?.commitmentMode === 'hardcore' && (
              <Text style={{ color: t.danger, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
                {lang === 'ru'
                  ? 'Жёсткий режим: счётчик дней обнулится. Прогресс программы и копилка сохранятся.'
                  : 'Hardcore mode: streak resets. Program progress and jar stay.'}
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ----- ESCALATE -----
  const sug = escalationData ?? { yes: false } as any;
  const newStep = sug.toStep ? getStep(sug.toStep) : null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18 }}>
        <LinearGradient colors={[(newStep?.color ?? '#FF9500') + '38', (newStep?.color ?? '#FF9500') + '08']}
          style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.bolt size={52} color={newStep?.color ?? '#FF9500'} />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>
          {lang === 'ru' ? 'Поднимаем метод' : 'Stepping up'}
        </Text>
        <Text style={{ color: t.text, fontSize: 16, lineHeight: 22 }}>
          {lang === 'ru' ? sug.reasonRu : sug.reasonEn}
        </Text>
        {newStep && (
          <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: newStep.color + '14', borderWidth: 1, borderColor: newStep.color + '40' }}>
            <Text style={{ color: newStep.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? `Ступень ${newStep.index} / 5` : `Step ${newStep.index} / 5`}
            </Text>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', marginTop: 4 }}>
              {lang === 'ru' ? newStep.titleRu : newStep.titleEn}
            </Text>
            <Text style={{ color: t.text, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
              {lang === 'ru' ? newStep.whyRu : newStep.whyEn}
            </Text>
          </View>
        )}
        <Pressable onPress={() => router.replace('/transition')}
          style={{ padding: 18, borderRadius: radius.xl, backgroundColor: newStep?.color ?? t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>
            {lang === 'ru' ? 'Пересобрать план →' : 'Rebuild the plan →'}
          </Text>
        </Pressable>
        <Text style={{ color: t.textDim, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 4 }}>
          {lang === 'ru'
            ? 'Не «прыжок» на новый ярлык. Поговорим: разберём что не сработало, выберем метод и дату старта осознанно.'
            : 'Not a label-swap. We talk: analyse what failed, choose method and start date consciously.'}
        </Text>
        <Pressable onPress={() => router.replace('/slip')} style={{ padding: 14, alignItems: 'center' }}>
          <Text style={{ color: t.textDim, fontWeight: '600' }}>
            {lang === 'ru' ? 'Подумаю позже' : 'Decide later'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
