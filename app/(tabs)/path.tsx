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
import { getTrack } from '../../lib/tracks';
import { getStep } from '../../lib/stepped';
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
        <View style={{ marginTop: 8 }}>
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

        {/* TODAY card */}
        {step && (
          <View style={{
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
            {/* dot track */}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {track.days.map((d) => {
                const done = today.day > d.day;
                const isNow = today.day === d.day;
                return (
                  <View key={d.day} style={{
                    width: isNow ? 15 : 11, height: isNow ? 15 : 11, borderRadius: 999,
                    backgroundColor: done || isNow ? t.accent : t.border,
                    ...(isNow ? { borderWidth: 4, borderColor: t.accentSoft } : {}),
                  }} />
                );
              })}
            </View>
          </View>
        )}

        {/* Course days */}
        <Text style={{
          color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.4,
          textTransform: 'uppercase', marginLeft: 6, marginTop: 8,
        }}>
          {lang === 'ru' ? 'Дни курса' : 'Course days'}
        </Text>

        <View style={{ gap: 8 }}>
          {track.days.map((d) => {
            const past = today.day > d.day;
            const isToday = today.day === d.day;
            const future = today.day < d.day;
            const peak = d.day === 3;
            const accentColor = peak ? t.danger : (isToday ? t.accent : (past ? t.accent : t.textDim));
            return (
              <Pressable key={d.day} disabled={future} onPress={() => {
                if (d.practice) {
                  Haptics.selectionAsync();
                  if (d.practice === 'money') router.push('/goal');
                  else if (d.practice === 'ema') router.push('/journal');
                  else router.push(`/practice/${d.practice}` as any);
                }
              }}>
                <View style={{
                  flexDirection: 'row', gap: 12, alignItems: 'center',
                  padding: 14, borderRadius: radius.lg,
                  backgroundColor: t.card,
                  borderWidth: isToday ? 2 : 1,
                  borderColor: isToday ? t.accent : t.border,
                  opacity: future ? 0.5 : 1,
                }}>
                  <View style={{
                    width: 46, height: 46, borderRadius: 14,
                    backgroundColor: isToday ? t.accent : (past ? t.accentSoft : t.border),
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {past
                      ? <Icon.check size={20} color={t.accent} />
                      : <Text style={{ color: isToday ? '#fff' : accentColor, fontSize: 17, fontWeight: '800' }}>{d.day}</Text>}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: future ? t.textDim : t.text, fontSize: 15, fontWeight: '700', lineHeight: 20 }} numberOfLines={2}>
                      {lang === 'ru' ? `День ${d.day} — ${d.focusRu}` : `Day ${d.day} — ${d.focusEn}`}
                    </Text>
                    {isToday && (
                      <Text style={{ color: t.textDim, fontSize: 12 }}>{lang === 'ru' ? 'сейчас' : 'now'}</Text>
                    )}
                    {peak && !isToday && (
                      <Text style={{ color: t.danger, fontSize: 11, fontWeight: '800' }}>{lang === 'ru' ? 'ПИК' : 'PEAK'}</Text>
                    )}
                  </View>
                  {!future && <Text style={{ color: t.textDim, fontSize: 20 }}>{past ? '✓' : '›'}</Text>}
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
