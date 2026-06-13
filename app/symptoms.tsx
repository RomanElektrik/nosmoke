// Symptom tracker — weekly body-recovery survey.
// 6 axes: cough, breath, taste, smell, sleep, energy. Each 1–5.
// Shows a per-axis line of recent entries so the user sees the curve
// of "actually getting better".

import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
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

        <SurveyCard last={last} lang={lang} />

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

function initValues(last?: SymptomLog): Record<AxisKey, number> {
  const base: Record<AxisKey, number> = {
    cough: 5, breath: 5, taste: 5, smell: 5, sleep: 5, energy: 5, mood: 5, craving: 5,
  };
  if (!last) return base;
  (Object.keys(base) as AxisKey[]).forEach((k) => {
    if (last[k] != null) base[k] = symptomTo10(last, last[k]);
  });
  return base;
}

function SurveyCard({ last, lang }: { last?: SymptomLog; lang: 'ru' | 'en' }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  // Open prefilled with the latest values so it can be changed any time.
  const [values, setValues] = useState<Record<AxisKey, number>>(() => initValues(last));

  const today = localDateKey();
  const editingToday = !!last && last.date === today;
  const daysSinceLast = last ? Math.floor((Date.now() - last.ts) / 86400_000) : null;

  function openSheet() {
    setValues(initValues(last));
    setOpen(true);
  }

  async function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const entry: SymptomLog = { date: today, ts: Date.now(), scale: 10, ...values };
    await update((s) => {
      const arr = s.symptoms ?? [];
      // Editing today's entry replaces it instead of piling up duplicates.
      const baseArr = arr.length > 0 && arr[arr.length - 1].date === today ? arr.slice(0, -1) : arr;
      return { ...s, symptoms: [...baseArr, entry] };
    });
    setOpen(false);
  }

  if (!open) {
    const sub = last
      ? (editingToday
          ? (lang === 'ru' ? 'Отмечено сегодня · можно поменять' : 'Logged today · tap to change')
          : (lang === 'ru' ? `Последняя отметка: ${daysSinceLast} дн. назад` : `Last logged: ${daysSinceLast}d ago`))
      : (lang === 'ru' ? '8 ползунков · 30 секунд' : '8 sliders · 30 seconds');
    return (
      <Pressable onPress={openSheet}>
        <View style={{
          padding: 18, borderRadius: radius.lg,
          backgroundColor: t.accent + '14', borderWidth: 1, borderColor: t.accent + '50',
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: t.accent + '24', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.check size={26} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
              {last
                ? (lang === 'ru' ? 'Обновить самочувствие' : 'Update how you feel')
                : (lang === 'ru' ? 'Отметить самочувствие' : 'Log how you feel')}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{sub}</Text>
          </View>
          <Text style={{ color: t.accent, fontSize: 20, fontWeight: '700' }}>→</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 20 }}>
      {AXES.map((a) => {
        const I = Icon[a.icon];
        const v = values[a.k];
        return (
          <View key={a.k} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: a.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <I size={16} color={a.color} />
              </View>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', flex: 1 }}>
                {lang === 'ru' ? a.ru : a.en}
              </Text>
              <Text style={{ color: a.color, fontSize: 15, fontWeight: '800' }}>{v}</Text>
              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '600' }}>/10 · {scaleLabel(v, lang === 'ru')}</Text>
            </View>
            <Scale10 value={v} color={a.color} onChange={(nv) => setValues((p) => ({ ...p, [a.k]: nv }))} />
          </View>
        );
      })}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <Pressable onPress={() => setOpen(false)}
          style={{ paddingHorizontal: 18, paddingVertical: 16, borderRadius: radius.md, borderWidth: 1, borderColor: t.border }}>
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

// Big, easy 0–10 slider — tap or drag anywhere on the track. Replaces the row
// of 11 tiny buttons that were hard to hit.
function Scale10({ value, color, onChange }: { value: number; color: string; onChange: (v: number) => void }) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const apply = (x: number) => {
    if (w <= 0) return;
    const v = Math.max(0, Math.min(10, Math.round((x / w) * 10)));
    if (v !== value) { Haptics.selectionAsync(); onChange(v); }
  };
  const fill = w > 0 ? (value / 10) * w : 0;
  const thumbLeft = w > 0 ? Math.max(0, Math.min(w - 32, fill - 16)) : 0;
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => apply(e.nativeEvent.locationX)}
      onResponderMove={(e) => apply(e.nativeEvent.locationX)}
      style={{ height: 46, justifyContent: 'center' }}
    >
      <View style={{ height: 14, borderRadius: 7, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fill, backgroundColor: color, borderRadius: 7 }} />
      </View>
      <View pointerEvents="none" style={{
        position: 'absolute', left: thumbLeft, width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#fff', borderWidth: 3, borderColor: color,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
      }} />
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
