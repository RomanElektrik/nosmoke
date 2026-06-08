// "Your craving patterns" — reflects the user's own logged data back as
// actionable insight. Reads state.cravings only; no new data collection.

import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '../lib/theme';
import { useAppState } from '../lib/storage';
import { Icon } from '../components/Icon';
import { computeInsights, triggerName, worstDayLocalized } from '../lib/insights';

export default function Insights() {
  const t = useTheme();
  const router = useRouter();
  const [state] = useAppState();
  const ru = (state.profile?.language ?? 'ru') === 'ru';
  const ins = computeInsights(state.cravings);
  const worstDay = worstDayLocalized(state.cravings, ru);
  const maxHour = Math.max(1, ...ins.byHour);

  const trendText = ins.intensityTrend === 'down'
    ? (ru ? 'Тяга слабеет — так и должно быть' : 'Cravings are getting weaker — as they should')
    : ins.intensityTrend === 'up'
      ? (ru ? 'Тяга усилилась — посмотри, что изменилось' : 'Cravings got stronger — look at what changed')
      : (ru ? 'Тяга держится ровно' : 'Cravings are steady');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, flex: 1 }}>
            {ru ? 'Твои паттерны тяги' : 'Your craving patterns'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={16} color={t.textDim} />
          </Pressable>
        </View>

        {ins.total < 3 ? (
          <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{ru ? 'Пока мало данных' : 'Not enough data yet'}</Text>
            <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
              {ru ? 'Отмечай тягу в SOS («чем закончилось») — через несколько раз здесь появятся твои паттерны: когда тянет, после чего и насколько ты держишься.'
                  : 'Log cravings in SOS — after a few entries your patterns will appear here.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Hero stat — resist rate */}
            <View style={{ padding: 20, borderRadius: radius.xl, backgroundColor: t.accent + '14', borderWidth: 1, borderColor: t.accent + '3A' }}>
              <Text style={{ color: t.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{ru ? 'Ты держишься' : 'You hold'}</Text>
              <Text style={{ color: t.text, fontSize: 48, fontWeight: '900', letterSpacing: -2, marginTop: 4 }}>
                {Math.round(ins.resistRate * 100)}%
              </Text>
              <Text style={{ color: t.textDim, fontSize: 14, marginTop: 2 }}>
                {ru ? `${ins.resisted} из ${ins.total} тяг прошли без сигареты` : `${ins.resisted} of ${ins.total} cravings beaten`}
              </Text>
            </View>

            {/* Peak time */}
            {ins.peakHourLabel && (
              <Row t={t} icon={Icon.bell} color={t.warn}
                title={ru ? 'Опасное время' : 'Risk window'}
                value={ins.peakHourLabel}
                sub={ru ? 'Чаще всего тянет в эти часы — будь готов' : 'You crave most in these hours — be ready'} />
            )}

            {/* Worst day */}
            {worstDay && (
              <Row t={t} icon={Icon.cal7} color="#FF2D78"
                title={ru ? 'Сложный день' : 'Hardest day'}
                value={worstDay}
                sub={ru ? 'В этот день срывы случаются чаще' : 'Slips happen more on this day'} />
            )}

            {/* Top triggers */}
            {ins.topTriggers.length > 0 && (
              <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 10 }}>
                <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{ru ? 'Твои триггеры' : 'Your triggers'}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ins.topTriggers.map((tt) => (
                    <View key={tt.trigger} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: t.info + '18', borderWidth: 1, borderColor: t.info + '44', flexDirection: 'row', gap: 6 }}>
                      <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>{triggerName(tt.trigger, ru)}</Text>
                      <Text style={{ color: t.info, fontSize: 14, fontWeight: '800' }}>{tt.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Intensity trend */}
            <Row t={t} icon={ins.intensityTrend === 'down' ? Icon.heartPulse : Icon.chart}
              color={ins.intensityTrend === 'down' ? t.accent : t.textDim}
              title={ru ? 'Сила тяги' : 'Craving strength'}
              value={`${ins.avgIntensity.toFixed(1)}/10`}
              sub={trendText} />

            {/* By-hour mini chart */}
            <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 12 }}>
              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{ru ? 'Когда тянет (по часам)' : 'When it hits (by hour)'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
                {ins.byHour.map((v, h) => (
                  <View key={h} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <View style={{ height: `${Math.max(4, (v / maxHour) * 100)}%`, borderRadius: 2, backgroundColor: v > 0 ? (h === ins.peakHourStart ? t.warn : t.accent) : t.border }} />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.textDim, fontSize: 10 }}>0</Text>
                <Text style={{ color: t.textDim, fontSize: 10 }}>6</Text>
                <Text style={{ color: t.textDim, fontSize: 10 }}>12</Text>
                <Text style={{ color: t.textDim, fontSize: 10 }}>18</Text>
                <Text style={{ color: t.textDim, fontSize: 10 }}>23</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ t, icon: I, color, title, value, sub }: any) {
  return (
    <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
        <I size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</Text>
        <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', marginTop: 1 }}>{value}</Text>
        <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>{sub}</Text>
      </View>
    </View>
  );
}
