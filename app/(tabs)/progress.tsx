// "Progress" tab — a single beautiful hub for the money jar, craving patterns
// and the "why I'm quitting" board. Replaces the old Path tab in the pill;
// Path itself is still reachable from the home screen.

import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang, useTranslation } from '../../lib/i18n';
import { useAppState, normalizeReasons } from '../../lib/storage';
import { Icon } from '../../components/Icon';
import { secondsClean, MILESTONES } from '../../lib/health';
import { moneySaved, cigsAvoided, pricePerCig, formatMoney, formatDuration } from '../../lib/money';
import { rewardProgress } from '../../lib/rewards';
import { computeInsights, triggerName, worstDayLocalized } from '../../lib/insights';
import { plural } from '../../lib/identity';
import { AnimatedAuraBackground } from '../../components/AnimatedAuraBackground';

export default function Progress() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const ru = lang === 'ru';
  const [state] = useAppState();
  const p = state.profile;
  if (!p) return null;

  const secs = secondsClean(p.quitDate);
  const saved = moneySaved(p, secs);
  const perDay = pricePerCig(p) * p.cigsPerDay;
  const rp = rewardProgress(saved, perDay);
  const ins = computeInsights(state.cravings);
  const worstDay = worstDayLocalized(state.cravings, ru);
  const reasons = normalizeReasons(p.reasons ?? (p.whyQuit ? [p.whyQuit] : []));
  const go = (href: string) => { Haptics.selectionAsync(); router.push(href as any); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 130, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8, marginLeft: 4 }}>
          {ru ? 'Прогресс' : 'Progress'}
        </Text>

        {/* ───── КОПИЛКА ───── */}
        {(() => {
          // If the user set their own goal, show THAT (avatar + progress to it).
          // Otherwise fall back to the generic reward ladder.
          const hasGoal = !!p.goalLabel && !!p.goalAmount;
          const goalPct = hasGoal ? Math.min(1, saved / (p.goalAmount as number)) : 0;
          const goalDays = hasGoal && perDay > 0 ? Math.ceil(Math.max(0, (p.goalAmount as number) - saved) / perDay) : null;
          return (
            <Pressable onPress={() => go('/goal')} style={({ pressed }) => ({ borderRadius: 28, overflow: 'hidden', opacity: pressed ? 0.96 : 1 })}>
              <AnimatedAuraBackground auraColor="#34D399" bgColor1="#0B5563" bgColor2="#1E1B4B" />
              <View style={{ padding: 22, gap: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: '#FFFFFFCC', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 }}>{ru ? 'Накоплено' : 'Saved'}</Text>
                    <Text style={{ color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1.8, marginTop: 4 }}>
                      {formatMoney(Math.round(saved), p.currency, ru ? 'ru-RU' : 'en-US')}
                    </Text>
                  </View>
                  {/* avatar in a ring */}
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF2E', borderWidth: 2, borderColor: '#FFFFFF66', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.goalPhoto
                      ? <Image source={{ uri: p.goalPhoto }} style={{ width: '100%', height: '100%' }} />
                      : <Text style={{ fontSize: 32 }}>{p.goalEmoji ?? '🐷'}</Text>}
                  </View>
                </View>

                {hasGoal ? (
                  <View style={{ backgroundColor: '#00000026', borderRadius: 18, padding: 14, gap: 9 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
                      {p.goalLabel} · {formatMoney(p.goalAmount as number, p.currency, ru ? 'ru-RU' : 'en-US')}
                    </Text>
                    <View style={{ height: 10, borderRadius: 10, backgroundColor: '#FFFFFF2E', overflow: 'hidden' }}>
                      <View style={{ width: `${Math.round(goalPct * 100)}%`, height: '100%', backgroundColor: '#fff', borderRadius: 10 }} />
                    </View>
                    <Text style={{ color: '#FFFFFFE8', fontSize: 13.5, fontWeight: '700' }}>
                      {Math.round(goalPct * 100)}%
                      {goalPct >= 1
                        ? (ru ? ' — цель достигнута! 🎉' : ' — goal reached! 🎉')
                        : goalDays != null ? (ru ? ` · ещё ${goalDays} ${plural(goalDays, ['день', 'дня', 'дней'])}` : ` · ${goalDays} more days`) : ''}
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#00000026', borderRadius: 18, padding: 14, gap: 9 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                      {ru ? `${cigsAvoided(p, secs)} сигарет не выкурено` : `${cigsAvoided(p, secs)} cigarettes avoided`}
                    </Text>
                    {rp.next && (
                      <>
                        <View style={{ height: 10, borderRadius: 10, backgroundColor: '#FFFFFF2E', overflow: 'hidden' }}>
                          <View style={{ width: `${Math.round(rp.pct * 100)}%`, height: '100%', backgroundColor: '#fff', borderRadius: 10 }} />
                        </View>
                        <Text style={{ color: '#FFFFFFE8', fontSize: 13.5, fontWeight: '700' }}>
                          {rp.next.emoji} {ru ? `До «${rp.next.ru}»` : `To "${rp.next.en}"`}
                          {rp.daysToNext != null ? (ru ? ` — ещё ${rp.daysToNext} ${plural(rp.daysToNext, ['день', 'дня', 'дней'])}` : ` — ${rp.daysToNext} more days`) : ''}
                        </Text>
                      </>
                    )}
                    <Text style={{ color: '#FFFFFFC8', fontSize: 12.5 }}>{ru ? '＋ Задай свою цель и аватар' : '＋ Set your own goal & avatar'}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })()}

        {/* ───── ПАТТЕРНЫ ТЯГИ ───── */}
        <Card color={t.info} gid="pat">
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Паттерны тяги' : 'Craving patterns'}</Text>
          {ins.total < 3 ? (
            <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21 }}>
              {ru ? 'Отмечай тягу в SOS — здесь появятся твои паттерны: когда тянет, после чего, как держишься.' : 'Log cravings in SOS — your patterns will appear here.'}
            </Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Stat t={t} color={t.accent} value={`${Math.round(ins.resistRate * 100)}%`} label={ru ? 'держишься' : 'you hold'} />
                {ins.peakHourLabel && <Stat t={t} color={t.warn} value={ins.peakHourLabel.split('–')[0]} label={ru ? 'пик тяги' : 'peak'} />}
                {worstDay && <Stat t={t} color="#FF2D78" value={worstDay.slice(0, 2)} label={ru ? 'сложный день' : 'hard day'} />}
              </View>
              {ins.topTriggers.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {ins.topTriggers.map((tt) => (
                    <View key={tt.trigger} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: t.info + '18', borderWidth: 1, borderColor: t.info + '40' }}>
                      <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '600' }}>{triggerName(tt.trigger, ru)} · {tt.count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          <Pressable onPress={() => go('/insights')} style={({ pressed }) => ({ paddingVertical: 11, borderRadius: radius.md, backgroundColor: '#FFFFFF12', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{ins.total < 3 ? (ru ? 'Открыть' : 'Open') : (ru ? 'Подробнее' : 'See more')}</Text>
          </Pressable>
        </Card>

        {/* ───── ПОЧЕМУ Я БРОСАЮ ───── */}
        <Card color={t.accent} gid="why">
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Почему я бросаю' : "Why I'm quitting"}</Text>
          {reasons.length === 0 ? (
            <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21 }}>{ru ? 'Добавь свои причины — вспомнишь их в момент тяги.' : 'Add your reasons — recall them in a craving.'}</Text>
          ) : (
            reasons.slice(0, 5).map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {r.photo
                  ? <Image source={{ uri: r.photo }} style={{ width: 34, height: 34, borderRadius: 10 }} />
                  : <Text style={{ fontSize: 20 }}>{r.emoji ?? '❤️'}</Text>}
                <Text style={{ color: t.text, fontSize: 15.5, fontWeight: '600', lineHeight: 22, flex: 1 }}>{r.text}</Text>
              </View>
            ))
          )}
          <Pressable onPress={() => go('/reasons')} style={({ pressed }) => ({ paddingVertical: 11, borderRadius: radius.md, backgroundColor: '#FFFFFF12', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{reasons.length === 0 ? (ru ? 'Добавить причины' : 'Add reasons') : (ru ? 'Редактировать' : 'Edit')}</Text>
          </Pressable>
        </Card>

        {/* ───── ЗДОРОВЬЕ — ВЕХИ ВОССТАНОВЛЕНИЯ ───── */}
        <Card color="#FF453A" gid="rec">
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Восстановление' : 'Recovery'}</Text>
          {MILESTONES.map((m) => {
            const done = secs >= m.at;
            const I = Icon[m.icon];
            return (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: m.color + (done ? '26' : '14'), alignItems: 'center', justifyContent: 'center' }}>
                  <I size={19} color={done ? m.color : t.textDim} />
                </View>
                <Text style={{ color: done ? t.text : t.textDim, fontSize: 14.5, fontWeight: done ? '600' : '500', flex: 1 }} numberOfLines={1}>{tr(m.titleKey)}</Text>
                {done
                  ? <Icon.check size={18} color={m.color} />
                  : <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '600' }}>{ru ? 'через ' : 'in '}{formatDuration(m.at - secs, lang)}</Text>}
              </View>
            );
          })}
        </Card>

        {/* ───── СИМПТОМЫ ───── */}
        <Card color="#FF2D78" gid="sym" onPress={() => go('/symptoms')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: '#FF2D7833', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.chart size={23} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }}>{ru ? 'Симптомы отмены' : 'Withdrawal symptoms'}</Text>
              <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>{ru ? 'Что сейчас норма и когда пройдёт' : 'What\'s normal now and when it passes'}</Text>
            </View>
            <Text style={{ color: '#FFFFFFB0', fontSize: 20 }}>›</Text>
          </View>
        </Card>

        {/* ───── ЧТО МНЕ ПОМОГАЕТ (быстрая кастомизация) ───── */}
        <Card color="#5AC8FA" gid="kit" onPress={() => go('/coping')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: '#5AC8FA33', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.headphones size={23} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }}>{ru ? 'Что мне помогает' : 'What helps me'}</Text>
              <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>{ru ? `${p.copingMethods?.length ?? 0} приёмов в SOS-аптечке` : `${p.copingMethods?.length ?? 0} moves in your SOS kit`}</Text>
            </View>
            <Text style={{ color: '#FFFFFFB0', fontSize: 20 }}>›</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// Premium section shell — dark card tinted in `color` + a glowing corner orb.
function Card({ color, gid, onPress, children }: { color: string; gid: string; onPress?: () => void; children: React.ReactNode }) {
  const body = (
    <>
      <LinearGradient colors={[color + '2B', '#13171E', '#0F131A']} locations={[0, 0.6, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ padding: 18, gap: 14 }}>{children}</View>
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ borderRadius: 26, overflow: 'hidden', opacity: pressed ? 0.93 : 1 })}>
        {body}
      </Pressable>
    );
  }
  return <View style={{ borderRadius: 26, overflow: 'hidden' }}>{body}</View>;
}

function Stat({ t, color, value, label }: any) {
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: color + '12', borderWidth: 1, borderColor: color + '2E', alignItems: 'center', gap: 3 }}>
      <Text style={{ color, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 }} numberOfLines={1}>{value}</Text>
      <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{label}</Text>
    </View>
  );
}
