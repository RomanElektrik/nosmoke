// "Progress" tab — a single beautiful hub for the money jar, craving patterns
// and the "why I'm quitting" board. Replaces the old Path tab in the pill;
// Path itself is still reachable from the home screen.

import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { Icon } from '../../components/Icon';
import { secondsClean } from '../../lib/health';
import { moneySaved, cigsAvoided, pricePerCig, formatMoney } from '../../lib/money';
import { rewardProgress } from '../../lib/rewards';
import { computeInsights, triggerName, worstDayLocalized } from '../../lib/insights';
import { plural } from '../../lib/identity';

export default function Progress() {
  const t = useTheme();
  const router = useRouter();
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
  const reasons = p.reasons ?? (p.whyQuit ? [p.whyQuit] : []);
  const go = (href: string) => { Haptics.selectionAsync(); router.push(href as any); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 130, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8, marginLeft: 4 }}>
          {ru ? 'Прогресс' : 'Progress'}
        </Text>

        {/* ───── КОПИЛКА ───── */}
        <Pressable onPress={() => go('/goal')} style={({ pressed }) => ({ borderRadius: radius.xl, overflow: 'hidden', opacity: pressed ? 0.95 : 1 })}>
          <LinearGradient colors={['#30D158', '#0A84FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22, gap: 14 }}>
            <View style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFFFF14' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#FFFFFFE0', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{ru ? 'Копилка' : 'Money jar'}</Text>
              <Text style={{ fontSize: 26 }}>🐷</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1.5 }}>
              {formatMoney(Math.round(saved), p.currency, ru ? 'ru-RU' : 'en-US')}
            </Text>
            <Text style={{ color: '#FFFFFFD0', fontSize: 13.5 }}>
              {ru ? `${cigsAvoided(p, secs)} сигарет не выкурено` : `${cigsAvoided(p, secs)} cigarettes avoided`}
            </Text>
            {rp.next && (
              <View style={{ gap: 7, marginTop: 2 }}>
                <View style={{ height: 8, borderRadius: 8, backgroundColor: '#FFFFFF33', overflow: 'hidden' }}>
                  <View style={{ width: `${Math.round(rp.pct * 100)}%`, height: '100%', backgroundColor: '#fff', borderRadius: 8 }} />
                </View>
                <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '600' }}>
                  {rp.next.emoji} {ru ? `До «${rp.next.ru}»` : `To "${rp.next.en}"`}
                  {rp.daysToNext != null ? (ru ? ` — ещё ${rp.daysToNext} ${plural(rp.daysToNext, ['день', 'дня', 'дней'])}` : ` — ${rp.daysToNext} more days`) : ''}
                </Text>
              </View>
            )}
            {rp.current && !rp.next && (
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{rp.current.emoji} {ru ? `Хватит на ${rp.current.ru}` : `Enough for ${rp.current.en}`}</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* ───── ПАТТЕРНЫ ТЯГИ ───── */}
        <View style={{ borderRadius: radius.xl, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Паттерны тяги' : 'Craving patterns'}</Text>
            <Icon.chart size={22} color={t.info} />
          </View>
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
          <Pressable onPress={() => go('/insights')} style={({ pressed }) => ({ paddingVertical: 11, borderRadius: radius.md, backgroundColor: t.info + '16', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: t.info, fontWeight: '700', fontSize: 14 }}>{ins.total < 3 ? (ru ? 'Открыть' : 'Open') : (ru ? 'Подробнее' : 'See more')}</Text>
          </Pressable>
        </View>

        {/* ───── ПОЧЕМУ Я БРОСАЮ ───── */}
        <View style={{ borderRadius: radius.xl, backgroundColor: t.accent + '0E', borderWidth: 1, borderColor: t.accent + '33', padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Почему я бросаю' : "Why I'm quitting"}</Text>
            <Icon.heartPulse size={22} color={t.accent} />
          </View>
          {reasons.length === 0 ? (
            <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21 }}>{ru ? 'Добавь свои причины — вспомнишь их в момент тяги.' : 'Add your reasons — recall them in a craving.'}</Text>
          ) : (
            reasons.slice(0, 4).map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ color: t.accent, fontSize: 16, fontWeight: '800' }}>•</Text>
                <Text style={{ color: t.text, fontSize: 15.5, fontWeight: '600', lineHeight: 22, flex: 1 }}>{r}</Text>
              </View>
            ))
          )}
          <Pressable onPress={() => go('/reasons')} style={({ pressed }) => ({ paddingVertical: 11, borderRadius: radius.md, backgroundColor: t.accent + '18', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: t.accent, fontWeight: '700', fontSize: 14 }}>{reasons.length === 0 ? (ru ? 'Добавить причины' : 'Add reasons') : (ru ? 'Редактировать' : 'Edit')}</Text>
          </Pressable>
        </View>

        {/* ───── ЧТО МНЕ ПОМОГАЕТ (быстрая кастомизация) ───── */}
        <Pressable onPress={() => go('/coping')} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
          <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#5AC8FA22', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.headphones size={22} color="#5AC8FA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{ru ? 'Что мне помогает' : 'What helps me'}</Text>
              <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>{ru ? `${p.copingMethods?.length ?? 0} приёмов в SOS-аптечке` : `${p.copingMethods?.length ?? 0} moves in your SOS kit`}</Text>
            </View>
            <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ t, color, value, label }: any) {
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: color + '12', borderWidth: 1, borderColor: color + '2E', alignItems: 'center', gap: 3 }}>
      <Text style={{ color, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 }} numberOfLines={1}>{value}</Text>
      <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{label}</Text>
    </View>
  );
}
