// Medication diary — full per-dose adherence over the last 7 days.
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';
import { dosesForDay, isDoseTaken, todayDoses, medCourseDay } from '../lib/medication';

export default function Meds() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [state] = useAppState();
  const med = state.profile?.medication;
  const startedAt = state.profile?.medicationStartedAt;
  const courseDay = medCourseDay(state);

  if (!med || !startedAt) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
          </Pressable>
        </View>
        <View style={{ padding: spacing.lg, gap: 16 }}>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '700' }}>
            {lang === 'ru' ? 'Дневник приёма пуст' : 'Medication diary empty'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 22 }}>
            {lang === 'ru'
              ? 'Активируй препарат в Техники → Лекарства, чтобы вести расписание приёма.'
              : 'Activate a medication in Techniques → Medications to track schedule.'}
          </Text>
          <Pressable onPress={() => router.replace('/practice/pharma')}
            style={{ padding: 16, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {lang === 'ru' ? 'Открыть лекарства' : 'Open medications'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const medColor = med === 'cytisine' ? '#30D158' : med === 'bupropion' ? '#FF9500' : '#0A84FF';
  const medName = med === 'cytisine' ? 'Цитизин (Табекс)'
    : med === 'bupropion' ? 'Бупропион (Велбутрин)'
    : 'Варениклин (Чампикс)';

  // Build last-7-days adherence
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days: { date: string; dateLabel: string; courseDay: number; doses: ReturnType<typeof dosesForDay>; taken: boolean[] }[] = [];
  const startMidnight = new Date(startedAt); startMidnight.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const cd = Math.floor((d.getTime() - startMidnight.getTime()) / 86400_000) + 1;
    if (cd < 1) continue;
    const doses = dosesForDay(med, cd);
    const taken = doses.map((dx) => isDoseTaken(state, key, dx.doseNumber));
    const dateLabel = d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', weekday: 'short' });
    days.push({ date: key, dateLabel, courseDay: cd, doses, taken });
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  async function toggle(date: string, doseNumber: number) {
    Haptics.selectionAsync();
    await update((s) => {
      const logs = s.doseLogs ?? [];
      const exists = logs.some((d) => d.date === date && d.doseNumber === doseNumber);
      return {
        ...s,
        doseLogs: exists
          ? logs.filter((d) => !(d.date === date && d.doseNumber === doseNumber))
          : [...logs, { date, doseNumber, takenAt: Date.now() }],
      };
    });
  }

  const allTaken = days.reduce((sum, d) => sum + d.taken.filter(Boolean).length, 0);
  const allTotal = days.reduce((sum, d) => sum + d.doses.length, 0);
  const adherencePct = allTotal > 0 ? Math.round((allTaken / allTotal) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 14, paddingBottom: 60 }}>
        {/* Header */}
        <LinearGradient colors={[medColor + '38', medColor + '08']}
          style={{ padding: 18, borderRadius: radius.lg, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: medColor + '24', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.shield size={26} color={medColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: medColor, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                {lang === 'ru' ? `Курс · день ${courseDay}` : `Course · day ${courseDay}`}
              </Text>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', marginTop: 2 }}>{medName}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12 }}>
              {lang === 'ru' ? 'Адхерентность за 7 дней' : 'Adherence past 7 days'}
            </Text>
            <Text style={{ color: medColor, fontSize: 22, fontWeight: '800' }}>{adherencePct}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
            <View style={{ width: `${adherencePct}%`, height: '100%', backgroundColor: medColor }} />
          </View>
        </LinearGradient>

        {/* Days */}
        {days.slice().reverse().map((d) => {
          const isToday = d.date === todayKey;
          return (
            <View key={d.date} style={{
              padding: 14, borderRadius: radius.lg,
              backgroundColor: t.bgElev, borderWidth: 1, borderColor: isToday ? medColor + '60' : t.border,
              gap: 10,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>
                  {isToday ? (lang === 'ru' ? 'Сегодня' : 'Today') : d.dateLabel} · {lang === 'ru' ? `день ${d.courseDay}` : `day ${d.courseDay}`}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 12 }}>
                  {d.taken.filter(Boolean).length} / {d.doses.length}
                </Text>
              </View>
              <View style={{ gap: 6 }}>
                {d.doses.map((dx, i) => {
                  const taken = d.taken[i];
                  return (
                    <Pressable key={dx.doseNumber} onPress={() => toggle(d.date, dx.doseNumber)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10,
                        backgroundColor: taken ? medColor + '20' : 'transparent',
                        borderWidth: 1, borderColor: taken ? medColor + '50' : t.border,
                      }}>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                        borderColor: taken ? medColor : t.border,
                        backgroundColor: taken ? medColor : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {taken && <Icon.check size={13} color="#fff" />}
                      </View>
                      <Text style={{
                        color: taken ? medColor : t.text,
                        fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], width: 56,
                      }}>
                        {String(dx.hour).padStart(2, '0')}:{String(dx.minute).padStart(2, '0')}
                      </Text>
                      <Text style={{ color: t.textDim, fontSize: 12, flex: 1 }} numberOfLines={2}>
                        {lang === 'ru' ? dx.noteRu : dx.noteEn}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18 }}>
            {lang === 'ru'
              ? 'Адхерентность ≥80% — стандарт для эффективности. Если пропускаешь больше 1–2 доз в неделю — обсуди с врачом.'
              : 'Adherence ≥80% — efficacy standard. Skipping more than 1–2 doses/week — talk to a clinician.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
