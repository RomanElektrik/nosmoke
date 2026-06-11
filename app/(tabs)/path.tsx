// "Путь" tab — the method / program screen in the «Атмосфера» style.
// Reuses program logic: programToday, getTrack, steps, levels.
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { secondsClean } from '../../lib/health';
import { programToday, methodFocus } from '../../lib/program';
import { getTrack, trackDay } from '../../lib/tracks';
import { getStep, methodQuitDay } from '../../lib/stepped';
import { Icon } from '../../components/Icon';

export default function PathTab() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  if (!state.profile) return null;

  const secs = secondsClean(state.profile.quitDate);
  const today = programToday(state);
  const stepId = state.profile.currentStep;
  const step = stepId ? getStep(stepId) : null;
  const focus = methodFocus(stepId, today.day, lang);
  const track = getTrack(stepId);
  const total = track.totalDays;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient
        colors={[t.accentSoft, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 14, paddingBottom: 140 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 }}>
              {lang === 'ru' ? 'Твой путь' : 'Your path'}
            </Text>
            {step && (
              <Text style={{ color: t.textDim, fontSize: 14, marginTop: 2 }}>
                {lang === 'ru'
                  ? `${step.titleRu} · день ${today.day} из ${total}`
                  : `${step.titleEn} · day ${today.day} of ${total}`}
              </Text>
            )}
          </View>
          <Pressable onPress={() => router.push('/transition')} unstable_pressDelay={0}
            style={{
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
              borderWidth: 1, borderColor: t.border, backgroundColor: t.card,
            }}>
            <Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>
              {lang === 'ru' ? 'Сменить' : 'Switch'}
            </Text>
          </Pressable>
        </View>

        {/* TODAY card */}
        {step && (
          <Pressable onPress={() => { Haptics.selectionAsync(); router.push(`/day/${today.day}` as any); }} style={{
            padding: 16, borderRadius: radius.lg,
            backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8,
          }}>
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
              {lang === 'ru' ? `СЕГОДНЯ · ДЕНЬ ${today.day}` : `TODAY · DAY ${today.day}`}
            </Text>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>
              {today.data
                ? (lang === 'ru' ? today.data.focusRu : today.data.focusEn)
                : (focus ? (lang === 'ru' ? focus.lineRu : focus.lineEn) : (lang === 'ru' ? step.titleRu : step.titleEn))}
            </Text>
            {/* progress bar — with all course days shown below, dots got crowded */}
            <View style={{ marginTop: 6, gap: 6 }}>
              <View style={{ height: 8, borderRadius: 999, backgroundColor: t.border, overflow: 'hidden' }}>
                <LinearGradient colors={[t.accent, t.accent + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: `${Math.min(100, (today.day / total) * 100)}%`, height: '100%', borderRadius: 999 }} />
              </View>
              <Text style={{ color: t.textDim, fontSize: 12 }}>
                {lang === 'ru' ? `Пройдено ${Math.min(today.day, total)} из ${total} дней` : `${Math.min(today.day, total)} of ${total} days done`}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Course days */}
        <Text style={{
          color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.4,
          textTransform: 'uppercase', marginLeft: 6, marginTop: 8,
        }}>
          {lang === 'ru' ? 'Дни курса' : 'Course days'}
        </Text>

        <View style={{ gap: 8 }}>
          {Array.from({ length: total }, (_, i) => i + 1).map((dayN) => {
            // EVERY day of the course is shown: authored days get full cards,
            // in-between days get compact rows (trackDay falls back to a
            // synthetic focus for them).
            const authored = track.days.find((x) => x.day === dayN);
            const d = authored ?? (stepId ? trackDay(stepId, dayN) : null);
            if (!d) return null;
            const past = today.day > dayN;
            const isToday = today.day === dayN;
            const future = today.day < dayN;
            const peak = dayN === 3 && stepId === 'L1_behavioral';
            const quitDay = stepId ? methodQuitDay(stepId) : 1;
            const isQuitDay = quitDay > 1 && dayN === quitDay;
            const accentColor = peak ? t.danger : (isToday ? t.accent : (past ? t.accent : t.textDim));

            // Compact row for filler days — keeps a 25/84-day list scannable.
            if (!authored && !isToday && !isQuitDay) {
              return (
                <Pressable key={dayN} disabled={future} onPress={() => { Haptics.selectionAsync(); router.push(`/day/${dayN}` as any); }}>
                  <View style={{
                    flexDirection: 'row', gap: 12, alignItems: 'center',
                    paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.md,
                    backgroundColor: 'transparent', opacity: future ? 0.4 : 1,
                  }}>
                    <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: past ? t.accentSoft : t.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {past
                        ? <Icon.check size={14} color={t.accent} />
                        : <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '700' }}>{dayN}</Text>}
                    </View>
                    <Text style={{ color: future ? t.textDim : t.text, fontSize: 13.5, flex: 1 }} numberOfLines={1}>
                      {lang === 'ru' ? d.focusRu : d.focusEn}
                    </Text>
                    {!future && <Text style={{ color: t.textDim, fontSize: 16 }}>›</Text>}
                  </View>
                </Pressable>
              );
            }

            const ringColor = isQuitDay ? (step?.color ?? t.accent) : t.accent;
            return (
              <Pressable key={dayN} disabled={future} onPress={() => {
                Haptics.selectionAsync();
                router.push(`/day/${dayN}` as any);
              }}>
                <View style={{
                  flexDirection: 'row', gap: 12, alignItems: 'center',
                  padding: isToday ? 16 : 14, borderRadius: radius.lg,
                  backgroundColor: isToday ? t.accent + '16' : (isQuitDay ? ringColor + '12' : t.card),
                  borderWidth: isToday || isQuitDay ? 1.5 : 1,
                  borderColor: isToday ? t.accent : (isQuitDay ? ringColor + '88' : t.border),
                  opacity: future ? 0.55 : 1,
                  ...(isToday ? { shadowColor: t.accent, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 } : {}),
                }}>
                  <View style={{
                    width: isToday ? 52 : 46, height: isToday ? 52 : 46, borderRadius: isToday ? 16 : 14,
                    backgroundColor: isToday ? t.accent : (isQuitDay ? ringColor : (past ? t.accentSoft : t.border)),
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {past && !isQuitDay
                      ? <Icon.check size={20} color={t.accent} />
                      : <Text style={{ color: isToday || isQuitDay ? '#fff' : accentColor, fontSize: isToday ? 20 : 17, fontWeight: '800' }}>{dayN}</Text>}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    {isToday && (
                      <Text style={{ color: t.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ru' ? 'Сегодня' : 'Today'}</Text>
                    )}
                    {isQuitDay && (
                      <Text style={{ color: ringColor, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {lang === 'ru' ? 'День отказа' : 'Quit day'}
                      </Text>
                    )}
                    <Text style={{ color: future ? t.textDim : t.text, fontSize: isToday ? 16 : 15, fontWeight: '700', lineHeight: 21 }} numberOfLines={2}>
                      {lang === 'ru' ? `День ${dayN} — ${d.focusRu}` : `Day ${dayN} — ${d.focusEn}`}
                    </Text>
                    {isToday && (
                      <Text style={{ color: t.accent, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{lang === 'ru' ? 'Что тебя ждёт сегодня →' : 'What today holds →'}</Text>
                    )}
                    {peak && !isToday && (
                      <Text style={{ color: t.danger, fontSize: 11, fontWeight: '800' }}>{lang === 'ru' ? 'ПИК' : 'PEAK'}</Text>
                    )}
                  </View>
                  {!future && !isToday && <Text style={{ color: t.textDim, fontSize: 20 }}>{past ? '✓' : '›'}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => router.push('/transition')}
          style={{
            marginTop: 6, padding: 16, borderRadius: radius.lg, alignItems: 'center',
            borderWidth: 1, borderColor: t.border, backgroundColor: 'transparent',
          }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
            {lang === 'ru' ? 'Сменить метод' : 'Change method'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/method')}
          style={{ alignItems: 'center', paddingVertical: 6 }}>
          <Text style={{ color: t.accent, fontWeight: '600', fontSize: 14 }}>
            {lang === 'ru' ? 'Подробнее о методе →' : 'More about the method →'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
