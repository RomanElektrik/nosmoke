// Symptom tracker — weekly body-recovery survey.
// 6 axes: cough, breath, taste, smell, sleep, energy. Each 1–5.
// Shows a per-axis line of recent entries so the user sees the curve
// of "actually getting better".

import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update, symptomTo10, type SymptomLog } from '../lib/storage';
import { localDateKey } from '../lib/dates';
import { Icon } from '../components/Icon';

export const AXES = [
  { k: 'cough',   ru: 'Кашель',          en: 'Cough',       icon: 'pulse'  as const, color: '#FF9F0A' },
  { k: 'breath',  ru: 'Дыхание',         en: 'Breathing',   icon: 'wind'   as const, color: '#5AC8FA' },
  { k: 'taste',   ru: 'Вкус',            en: 'Taste',       icon: 'sparkle' as const, color: '#34C759' },
  { k: 'smell',   ru: 'Запах',           en: 'Smell',       icon: 'leaf'   as const, color: '#30D158' },
  { k: 'sleep',   ru: 'Сон',             en: 'Sleep',       icon: 'star'   as const, color: '#BF5AF2' },
  { k: 'energy',  ru: 'Энергия',         en: 'Energy',      icon: 'bolt'   as const, color: '#FF453A' },
  { k: 'mood',    ru: 'Настроение',      en: 'Mood',        icon: 'heart'  as const, color: '#FF2D78' },
  { k: 'craving', ru: 'Свобода от тяги', en: 'Urge freedom', icon: 'flame' as const, color: '#FF9500' },
] as const;

type AxisKey = typeof AXES[number]['k'];

const SCALE_RU = ['Очень плохо', 'Плохо', 'Норм', 'Хорошо', 'Отлично'];
const SCALE_EN = ['Very bad', 'Bad', 'OK', 'Good', 'Great'];
const scaleLabel = (v: number, ru: boolean) =>
  (ru ? SCALE_RU : SCALE_EN)[Math.min(4, Math.floor(v / 2.2))];

const WEEK_MS = 7 * 86400_000;

export default function Symptoms() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const logs = state.symptoms ?? [];
  const last = logs[logs.length - 1];

  const canFillNow = !last || Date.now() - last.ts >= 3 * 86400_000;
  const daysSinceLast = last ? Math.floor((Date.now() - last.ts) / 86400_000) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {lang === 'ru' ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60, gap: 20 }}>
        <View>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }}>
            {lang === 'ru' ? 'Симптомы' : 'Symptoms'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
            {lang === 'ru'
              ? 'Раз в неделю — короткая анкета. Видно, как тело реально восстанавливается.'
              : 'Once a week — a short survey. See how your body actually recovers.'}
          </Text>
        </View>

        <SurveyCard canFillNow={canFillNow} daysSinceLast={daysSinceLast} lang={lang} />

        {logs.length > 0 && (
          <View style={{ gap: 14 }}>
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
              {lang === 'ru' ? 'Динамика' : 'Trend'}
            </Text>
            {AXES.filter((a) => logs.some((l) => l[a.k as AxisKey] != null)).map((a) => (
              <AxisRow key={a.k} axis={a} logs={logs} lang={lang} />
            ))}
          </View>
        )}

        {logs.length === 0 && (
          <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, alignItems: 'center', gap: 8 }}>
            <Icon.feather size={32} color={t.textDim} />
            <Text style={{ color: t.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              {lang === 'ru'
                ? 'Ещё нет записей. Заполни первую — и каждую неделю будешь видеть, как становится лучше.'
                : 'No entries yet. Fill the first one — and you’ll see week-over-week how it gets better.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SurveyCard({ canFillNow, daysSinceLast, lang }: { canFillNow: boolean; daysSinceLast: number | null; lang: 'ru' | 'en' }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<AxisKey, number>>({
    cough: 5, breath: 5, taste: 5, smell: 5, sleep: 5, energy: 5, mood: 5, craving: 5,
  });

  async function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const entry: SymptomLog = {
      date: localDateKey(),
      ts: Date.now(),
      scale: 10,
      ...values,
    };
    await update((s) => ({ ...s, symptoms: [...(s.symptoms ?? []), entry] }));
    setOpen(false);
  }

  if (!open) {
    const waitDays = daysSinceLast !== null ? Math.max(0, 3 - daysSinceLast) : 0;
    return (
      <Pressable onPress={() => canFillNow && setOpen(true)} disabled={!canFillNow}>
        <View style={{
          padding: 18, borderRadius: radius.lg,
          backgroundColor: canFillNow ? t.accent + '14' : t.card,
          borderWidth: 1, borderColor: canFillNow ? t.accent + '50' : t.border,
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{
            width: 50, height: 50, borderRadius: 16,
            backgroundColor: canFillNow ? t.accent + '24' : t.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.check size={26} color={canFillNow ? t.accent : t.textDim} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
              {canFillNow
                ? (lang === 'ru' ? 'Заполнить за эту неделю' : 'Fill this week')
                : (lang === 'ru' ? `Следующая запись через ${waitDays} дн.` : `Next entry in ${waitDays} days`)}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {lang === 'ru' ? '8 вопросов · 40 секунд' : '8 questions · 40 seconds'}
            </Text>
          </View>
          {canFillNow && <Text style={{ color: t.accent, fontSize: 20, fontWeight: '700' }}>→</Text>}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 16 }}>
      {AXES.map((a) => {
        const I = Icon[a.icon];
        const v = values[a.k];
        return (
          <View key={a.k} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: a.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <I size={16} color={a.color} />
              </View>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', flex: 1 }}>
                {lang === 'ru' ? a.ru : a.en}
              </Text>
              <Text style={{ color: a.color, fontSize: 12, fontWeight: '700' }}>
                {v}/10 · {scaleLabel(v, lang === 'ru')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {Array.from({ length: 11 }, (_, n) => (
                <TouchableOpacity key={n} activeOpacity={0.7}
                  onPress={() => { Haptics.selectionAsync(); setValues((p) => ({ ...p, [a.k]: n })); }}
                  style={{
                    flex: 1, paddingVertical: 11, borderRadius: 8,
                    backgroundColor: n <= v ? a.color : t.bgElev,
                    borderWidth: 1, borderColor: n <= v ? a.color : t.border,
                    alignItems: 'center',
                  }}>
                  <Text pointerEvents="none" style={{ color: n <= v ? '#fff' : t.textDim, fontWeight: '700', fontSize: 10.5 }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <Pressable onPress={() => setOpen(false)}
          style={{ paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ color: t.textDim, fontWeight: '600' }}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Text>
        </Pressable>
        <Pressable onPress={save}
          style={{ flex: 1, paddingVertical: 16, borderRadius: radius.md, backgroundColor: t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{lang === 'ru' ? 'Сохранить' : 'Save'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AxisRow({ axis, logs, lang }: { axis: typeof AXES[number]; logs: SymptomLog[]; lang: 'ru' | 'en' }) {
  const t = useTheme();
  const I = Icon[axis.icon];
  // Only entries that have this axis (mood/craving were added later).
  const recent = logs.filter((l) => l[axis.k as AxisKey] != null).slice(-12);
  const lastLog = recent[recent.length - 1];
  const firstLog = recent[0];
  const last = lastLog ? symptomTo10(lastLog, lastLog[axis.k as AxisKey]) : 0;
  const first = firstLog ? symptomTo10(firstLog, firstLog[axis.k as AxisKey]) : 0;
  const delta = last - first;
  const maxBar = 60;

  return (
    <View style={{
      padding: 14, borderRadius: radius.lg, backgroundColor: t.card,
      borderWidth: 1, borderColor: t.border, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: axis.color + '22', alignItems: 'center', justifyContent: 'center' }}>
          <I size={18} color={axis.color} />
        </View>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', flex: 1 }}>
          {lang === 'ru' ? axis.ru : axis.en}
        </Text>
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }}>{last}/10</Text>
        {recent.length >= 2 && delta !== 0 && (
          <Text style={{ color: delta > 0 ? '#30D158' : '#FF453A', fontSize: 12, fontWeight: '700' }}>
            {delta > 0 ? '+' : ''}{delta}
          </Text>
        )}
      </View>
      {/* Bar chart of recent entries */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: maxBar }}>
        {recent.map((e, i) => {
          const v = symptomTo10(e, e[axis.k as AxisKey]);
          return (
            <View key={i} style={{
              flex: 1, height: (v / 10) * maxBar,
              backgroundColor: axis.color + (v >= last ? 'cc' : '55'),
              borderRadius: 4,
              minHeight: 4,
            }} />
          );
        })}
      </View>
      {recent.length < 2 && (
        <Text style={{ color: t.textDim, fontSize: 11 }}>
          {lang === 'ru' ? 'Динамика появится после 2-й записи.' : 'Trend appears after the 2nd entry.'}
        </Text>
      )}
    </View>
  );
}
