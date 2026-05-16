import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState } from '../lib/storage';
import { secondsClean } from '../lib/health';
import { currentLevel, LEVELS, programToday, methodFocus } from '../lib/program';
import { getTrack } from '../lib/tracks';
import { getStep } from '../lib/stepped';
import { Icon } from '../components/Icon';

export default function ProgramScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [state] = useAppState();
  if (!state.profile) return null;
  const secs = secondsClean(state.profile.quitDate);
  const today = programToday(state);
  const lvl = currentLevel(secs);
  const stepId = state.profile.currentStep;
  const step = stepId ? getStep(stepId) : null;
  const focus = methodFocus(stepId, today.day, lang);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 60 }}>
        {/* CURRENT METHOD card — first thing user sees */}
        {step && (
          <Pressable onPress={() => router.push('/method')}>
            <LinearGradient colors={[step.color + '38', step.color + '08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: step.color + '40' }}>
              <Text style={{ color: step.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                {lang === 'ru' ? `Метод · ступень ${step.index} из 5` : `Method · step ${step.index} of 5`}
              </Text>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', marginTop: 4, letterSpacing: -0.4 }}>
                {lang === 'ru' ? step.titleRu : step.titleEn}
              </Text>
              {focus && (
                <Text style={{ color: t.text, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
                  {lang === 'ru' ? focus.lineRu : focus.lineEn}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
                <Text style={{ color: t.textDim, fontSize: 11, flex: 1 }} numberOfLines={2}>{step.evidenceRu}</Text>
                <Text style={{ color: step.color, fontSize: 13, fontWeight: '700' }}>
                  {lang === 'ru' ? 'Сменить →' : 'Change →'}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        )}

        {/* Levels strip */}
        <View>
          <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            {lang === 'ru' ? 'Уровни' : 'Levels'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {LEVELS.map((l) => {
              const reached = secs >= l.threshold;
              const isCurrent = lvl.index === l.index;
              return (
                <View key={l.index} style={{
                  width: 90, padding: 10, borderRadius: radius.md,
                  backgroundColor: reached ? l.color + '24' : t.bgElev,
                  borderWidth: 1, borderColor: isCurrent ? l.color : (reached ? l.color + '40' : t.border),
                  alignItems: 'center', gap: 4,
                }}>
                  {(() => { const I = Icon[l.icon]; return <I size={26} color={reached ? l.color : t.textDim} />; })()}
                  <Text style={{ color: reached ? t.text : t.textDim, fontSize: 11, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>
                    {lang === 'ru' ? l.titleRu : l.titleEn}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Track curriculum */}
        <View>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
            {step ? (lang === 'ru' ? `Курс: ${step.titleRu}` : `Track: ${step.titleEn}`) : (lang === 'ru' ? 'Курс' : 'Course')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            {lang === 'ru'
              ? `Расписание привязано к выбранному методу. Длительность: ${getTrack(stepId).totalDays} дней.`
              : `Schedule tied to the chosen method. Duration: ${getTrack(stepId).totalDays} days.`}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {getTrack(stepId).days.map((d) => {
            const past = today.day > d.day;
            const isToday = today.day === d.day;
            const future = today.day < d.day;
            const peak = d.day === 3;
            const accentColor = peak ? '#FF453A' : (isToday ? '#0A84FF' : (past ? '#30D158' : t.textDim));
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
                  flexDirection: 'row', gap: 12, alignItems: 'flex-start',
                  padding: 14, borderRadius: radius.lg,
                  backgroundColor: isToday ? accentColor + '12' : (past ? t.bgElev : t.bgElev),
                  borderWidth: isToday ? 1.5 : 1,
                  borderColor: isToday ? accentColor + '60' : (past ? '#30D15830' : t.border),
                  opacity: future ? 0.45 : 1,
                }}>
                  {/* Day badge */}
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: accentColor + (isToday ? '28' : '20'),
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {past ? (
                      <Icon.check size={20} color={accentColor} />
                    ) : (
                      <Text style={{ color: accentColor, fontSize: 17, fontWeight: '900', letterSpacing: -0.5 }}>{d.day}</Text>
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    {/* Labels row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {isToday && (
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: accentColor + '28' }}>
                          <Text style={{ color: accentColor, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                            {lang === 'ru' ? 'СЕГОДНЯ' : 'TODAY'}
                          </Text>
                        </View>
                      )}
                      {peak && (
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FF453A24' }}>
                          <Text style={{ color: '#FF453A', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>{lang === 'ru' ? 'ПИК' : 'PEAK'}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ color: future ? t.textDim : t.text, fontSize: 15, fontWeight: '700', lineHeight: 20 }} numberOfLines={3}>
                      {lang === 'ru' ? d.focusRu : d.focusEn}
                    </Text>

                    {!future && (
                      <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 17 }}>
                        {lang === 'ru' ? d.scienceRu : d.scienceEn}
                      </Text>
                    )}

                    {(d.medRu || d.medEn) && !future && (
                      <View style={{ marginTop: 4, padding: 8, borderRadius: 10, backgroundColor: '#34C75914', borderWidth: 1, borderColor: '#34C75940', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <Icon.shield size={14} color="#34C759" />
                        <Text style={{ color: t.text, fontSize: 12, flex: 1, lineHeight: 17 }}>
                          {lang === 'ru' ? d.medRu : d.medEn}
                        </Text>
                      </View>
                    )}

                    {isToday && (
                      <View style={{ marginTop: 4, padding: 8, borderRadius: 10, backgroundColor: accentColor + '10', borderWidth: 1, borderColor: accentColor + '30', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon.toolbox size={14} color={accentColor} />
                        <Text style={{ color: t.text, fontSize: 13, flex: 1, fontWeight: '500' }} numberOfLines={2}>
                          {lang === 'ru' ? d.taskRu : d.taskEn}
                        </Text>
                        {d.practice && <Text style={{ color: accentColor, fontSize: 13, fontWeight: '700' }}>→</Text>}
                      </View>
                    )}

                    {isToday && (d.whyRu || d.whyEn) && (
                      <View style={{ marginTop: 4, padding: 10, borderRadius: 10, backgroundColor: t.bg, borderWidth: 1, borderColor: t.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Icon.brain size={13} color={t.textDim} />
                          <Text style={{ color: t.textDim, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            {lang === 'ru' ? 'Почему именно это сегодня' : 'Why this today'}
                          </Text>
                        </View>
                        <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18 }}>
                          {lang === 'ru' ? d.whyRu : d.whyEn}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
