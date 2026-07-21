// "Progress" tab — a single beautiful hub for the money jar, craving patterns
// and the "why I'm quitting" board. Replaces the old Path tab in the pill;
// Path itself is still reachable from the home screen.

import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image, Modal, AppState as RNAppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang, useTranslation } from '../../lib/i18n';
import { useAppState, normalizeReasons, symptomTo10 } from '../../lib/storage';
import { Icon } from '../../components/Icon';
import { secondsClean, MILESTONES, type Milestone } from '../../lib/health';
import { moneySaved, cigsAvoided, pricePerCig, formatMoney, formatDuration, formatCigs } from '../../lib/money';
import { abstinenceStartMs, healthStartMs } from '../../lib/stepped';
import { rewardProgress } from '../../lib/rewards';
import { computeInsights, triggerName, worstDayLocalized, worstDayShort } from '../../lib/insights';
import { plural } from '../../lib/identity';

// Минутный тикер + мгновенное обновление при возврате на экран (из фона или
// с другой вкладки), чтобы цифры не отставали.
function useNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    const sub = RNAppState.addEventListener('change', (st) => { if (st === 'active') setNow(Date.now()); });
    return () => { clearInterval(id); sub.remove(); };
  }, []);
  useFocusEffect(useCallback(() => { setNow(Date.now()); }, []));
  return now;
}

export default function Progress() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const ru = lang === 'ru';
  const [state] = useAppState();
  // Milestone data stays mounted while the sheet slides away — nulling it on
  // close blanked the modal mid-animation (white flash). `msVisible` drives the
  // Modal; `openMilestone` only ever gets replaced, never nulled on close.
  const [openMilestone, setOpenMilestone] = useState<Milestone | null>(null);
  const [msVisible, setMsVisible] = useState(false);
  const showMilestone = (m: Milestone) => { setOpenMilestone(m); setMsVisible(true); };
  const hideMilestone = () => setMsVisible(false);
  const p = state.profile;
  if (!p) return null;

  // Экран живёт в таб-навигаторе и не размонтируется: без тикера цифры
  // застывали на момент ПЕРВОГО открытия вкладки и не менялись сутками —
  // «Накоплено» на Прогрессе расходилось с Главной, где тикер есть.
  const now = useNow();
  // Деньги и сигареты — от старта программы: счётчик обязан двигаться с первой
  // секунды, иначе экран выглядит сломанным.
  const secs = Math.max(0, secondsClean(abstinenceStartMs(p), now));
  // Вехи здоровья — только с дня отказа по протоколу: пока человек курит по
  // схеме, физиология не восстанавливается (см. healthStartMs).
  const healthSecs = Math.max(0, secondsClean(healthStartMs(p), now));
  const saved = moneySaved(p, secs);
  const perDay = pricePerCig(p) * p.cigsPerDay;
  const rp = rewardProgress(saved, perDay);
  const ins = computeInsights(state.cravings);
  const worstDay = worstDayLocalized(state.cravings, ru);
  const worstDayS = worstDayShort(state.cravings, ru);
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
            <Pressable onPress={() => go('/goal')} style={({ pressed }) => ({ borderRadius: 28, overflow: 'hidden', opacity: pressed ? 0.96 : 1, borderWidth: t.dark ? 0 : 1, borderColor: t.border })}>
              {/* Тема-зависимая карта «Накоплено» (была хардкод-тёмной с белым текстом). */}
              <LinearGradient colors={(t.dark ? ['#34D39940', '#13171E', '#0F131A'] : ['#34C75922', '#FFFFFF', '#F3F3F7']) as [string, string, string]} locations={[0, 0.6, 1]}
                start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ padding: 22, gap: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: t.dark ? '#FFFFFFCC' : t.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 }}>{ru ? 'Накоплено' : 'Saved'}</Text>
                    <Text style={{ color: t.text, fontSize: 44, fontWeight: '900', letterSpacing: -1.8, marginTop: 4 }}>
                      {formatMoney(Math.round(saved), p.currency, ru ? 'ru-RU' : 'en-US')}
                    </Text>
                  </View>
                  {/* avatar in a ring */}
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.dark ? '#FFFFFF2E' : '#00000010', borderWidth: 2, borderColor: t.dark ? '#FFFFFF66' : '#0000001A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.goalPhoto
                      ? <Image source={{ uri: p.goalPhoto }} style={{ width: '100%', height: '100%' }} />
                      : <Text style={{ fontSize: 32 }}>{p.goalEmoji ?? '🐷'}</Text>}
                  </View>
                </View>

                {hasGoal ? (
                  <View style={{ backgroundColor: t.dark ? '#00000026' : '#0000000A', borderRadius: 18, padding: 14, gap: 9 }}>
                    <Text style={{ color: t.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
                      {p.goalLabel} · {formatMoney(p.goalAmount as number, p.currency, ru ? 'ru-RU' : 'en-US')}
                    </Text>
                    <View style={{ height: 10, borderRadius: 10, backgroundColor: t.dark ? '#FFFFFF2E' : '#00000012', overflow: 'hidden' }}>
                      <View style={{ width: `${Math.round(goalPct * 100)}%`, height: '100%', backgroundColor: t.dark ? '#fff' : t.accent, borderRadius: 10 }} />
                    </View>
                    <Text style={{ color: t.dark ? '#FFFFFFE8' : t.textDim, fontSize: 13.5, fontWeight: '700' }}>
                      {Math.round(goalPct * 100)}%
                      {goalPct >= 1
                        ? (ru ? ' — цель достигнута! 🎉' : ' — goal reached! 🎉')
                        : goalDays != null ? (ru ? ` · ещё ${goalDays} ${plural(goalDays, ['день', 'дня', 'дней'])}` : ` · ${goalDays} more days`) : ''}
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: t.dark ? '#00000026' : '#0000000A', borderRadius: 18, padding: 14, gap: 9 }}>
                    <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>
                      {ru ? `${formatCigs(cigsAvoided(p, secs))} сигарет не выкурено` : `${formatCigs(cigsAvoided(p, secs))} cigarettes avoided`}
                    </Text>
                    {rp.next && (
                      <>
                        <View style={{ height: 10, borderRadius: 10, backgroundColor: t.dark ? '#FFFFFF2E' : '#00000012', overflow: 'hidden' }}>
                          <View style={{ width: `${Math.round(rp.pct * 100)}%`, height: '100%', backgroundColor: t.dark ? '#fff' : t.accent, borderRadius: 10 }} />
                        </View>
                        <Text style={{ color: t.dark ? '#FFFFFFE8' : t.textDim, fontSize: 13.5, fontWeight: '700' }}>
                          {rp.next.emoji} {ru ? `До «${rp.next.ru}»` : `To "${rp.next.en}"`}
                          {rp.daysToNext != null ? (ru ? ` — ещё ${rp.daysToNext} ${plural(rp.daysToNext, ['день', 'дня', 'дней'])}` : ` — ${rp.daysToNext} more days`) : ''}
                        </Text>
                      </>
                    )}
                    <Text style={{ color: t.dark ? '#FFFFFFC8' : t.textDim, fontSize: 12.5 }}>{ru ? '＋ Задай свою цель и аватар' : '＋ Set your own goal & avatar'}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })()}

        {/* ───── САМОЧУВСТВИЕ ───── важный трекер, который раньше жил только
            за кнопкой «Симптомы» и нигде не отображался */}
        <Card color="#FF2D78" gid="symp" onPress={() => go('/symptoms')}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Самочувствие' : 'How you feel'}</Text>
          {(() => {
            const logs = state.symptoms ?? [];
            if (logs.length === 0) {
              return (
                <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21 }}>
                  {ru ? 'Отметь самочувствие — раз в несколько дней, 40 секунд. Здесь появится динамика: дыхание, сон, настроение.' : 'Log how you feel — every few days, 40 seconds. Your trend will appear here.'}
                </Text>
              );
            }
            const lastLog = logs[logs.length - 1];
            const prevLog = logs.length > 1 ? logs[logs.length - 2] : null;
            const KEY_AXES = [
              { k: 'breath' as const, ru: 'Дыхание', en: 'Breath', color: '#5AC8FA' },
              { k: 'energy' as const, ru: 'Энергия', en: 'Energy', color: '#FF453A' },
              { k: 'sleep' as const, ru: 'Сон', en: 'Sleep', color: '#BF5AF2' },
            ];
            return (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {KEY_AXES.map((a) => {
                  const cur = symptomTo10(lastLog, lastLog[a.k]);
                  const prev = prevLog ? symptomTo10(prevLog, prevLog[a.k]) : null;
                  const delta = prev != null ? cur - prev : 0;
                  return (
                    <View key={a.k} style={{ flex: 1, backgroundColor: t.dark ? '#00000033' : '#00000008', borderRadius: 14, padding: 12, gap: 3 }}>
                      <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '700' }} numberOfLines={1}>{ru ? a.ru : a.en}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={{ color: a.color, fontSize: 20, fontWeight: '900' }}>{cur}</Text>
                        <Text style={{ color: t.textDim, fontSize: 11 }}>/10</Text>
                        {delta !== 0 && (
                          <Text style={{ color: delta > 0 ? '#30D158' : '#FF453A', fontSize: 12, fontWeight: '800' }}>
                            {delta > 0 ? '↑' : '↓'}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}
          <Text style={{ color: '#FF2D78', fontSize: 13.5, fontWeight: '700' }}>
            {(state.symptoms?.length ?? 0) === 0
              ? (ru ? 'Отметить самочувствие →' : 'Log how you feel →')
              : (ru ? 'Вся динамика →' : 'Full trend →')}
          </Text>
        </Card>

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
                {worstDayS && <Stat t={t} color="#FF2D78" value={worstDayS} label={ru ? 'сложный день' : 'hard day'} />}
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
          <Pressable onPress={() => go('/insights')} style={({ pressed }) => ({ paddingVertical: 11, borderRadius: radius.md, backgroundColor: t.dark ? '#FFFFFF12' : '#00000010', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>{ins.total < 3 ? (ru ? 'Открыть' : 'Open') : (ru ? 'Подробнее' : 'See more')}</Text>
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
          <Pressable onPress={() => go('/reasons')} style={({ pressed }) => ({ paddingVertical: 11, borderRadius: radius.md, backgroundColor: t.dark ? '#FFFFFF12' : '#00000010', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>{reasons.length === 0 ? (ru ? 'Добавить причины' : 'Add reasons') : (ru ? 'Редактировать' : 'Edit')}</Text>
          </Pressable>
        </Card>

        {/* ───── ЗДОРОВЬЕ — ВЕХИ ВОССТАНОВЛЕНИЯ ─────
            Каждая веха кликабельна (модал с полным текстом и источником),
            названия не обрезаются. */}
        <Card color="#FF453A" gid="rec">
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{ru ? 'Восстановление' : 'Recovery'}</Text>
          {MILESTONES.map((m) => {
            const done = healthSecs >= m.at;
            const I = Icon[m.icon];
            return (
              <Pressable key={m.id} onPress={() => { Haptics.selectionAsync(); showMilestone(m); }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 8, paddingHorizontal: 10, marginHorizontal: -10, borderRadius: 14,
                  backgroundColor: pressed ? (t.dark ? '#FFFFFF0E' : '#00000010') : 'transparent',
                })}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: m.color + (done ? '26' : '14'), alignItems: 'center', justifyContent: 'center' }}>
                  <I size={19} color={done ? m.color : t.textDim} />
                </View>
                <Text style={{ color: done ? t.text : t.textDim, fontSize: 14.5, fontWeight: done ? '600' : '500', flex: 1, lineHeight: 19 }}>{tr(m.titleKey)}</Text>
                {done
                  ? <Icon.check size={18} color={m.color} />
                  : <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '600' }}>{ru ? 'через ' : 'in '}{formatDuration(m.at - healthSecs, lang)}</Text>}
              </Pressable>
            );
          })}
        </Card>

        {/* «Что мне помогает» удалена: это настройка SOS-аптечки, а не прогресс —
            входы в /coping остаются на главной и в самом SOS. */}
      </ScrollView>

      {/* Milestone detail — full text + source, same content as Здоровье */}
      <Modal visible={msVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={hideMilestone}>
        {openMilestone && (() => {
          const m = openMilestone;
          const done = healthSecs >= m.at;
          const I = Icon[m.icon];
          const pct = Math.min(1, healthSecs / m.at);
          return (
            <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
              <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16 }}>
                <LinearGradient colors={[m.color + '40', m.color + '10']}
                  style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <I size={52} color={m.color} />
                </LinearGradient>
                <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>{tr(m.titleKey)}</Text>
                <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: done ? m.color + '24' : t.border }}>
                  <Text style={{ color: done ? m.color : t.textDim, fontSize: 12, fontWeight: '700' }}>
                    {done ? (ru ? 'Достигнуто' : 'Reached') : `${ru ? 'через' : 'in'} ${formatDuration(m.at - healthSecs, lang)}`}
                  </Text>
                </View>
                {!done && (
                  <View style={{ height: 8, borderRadius: 999, backgroundColor: t.border, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: m.color, borderRadius: 999 }} />
                  </View>
                )}
                <Text style={{ color: t.text, fontSize: 16, lineHeight: 24, marginTop: 4 }}>{tr(m.bodyKey)}</Text>
                <Text style={{ color: t.textDim, fontSize: 12, marginTop: 8 }}>{tr('health.source', { src: m.source })}</Text>
                <Pressable onPress={hideMilestone}
                  style={{ marginTop: 16, padding: 16, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
                  <Text style={{ color: t.text, fontWeight: '600' }}>{ru ? 'Готово' : 'Done'}</Text>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

// Premium section shell — dark card tinted in `color` + a glowing corner orb.
function Card({ color, gid, onPress, children }: { color: string; gid: string; onPress?: () => void; children: React.ReactNode }) {
  const t = useTheme();
  // Тема-зависимо: тёмная — премиум-тёмная карта; светлая — светлая с лёгким
  // цветным тинтом (иначе t.text внутри = тёмный текст на тёмной карте = невидим).
  const grad = (t.dark ? [color + '2B', '#13171E', '#0F131A'] : [color + '14', '#FFFFFF', '#F3F3F7']) as [string, string, string];
  const wrap = { borderRadius: 26, overflow: 'hidden' as const, borderWidth: t.dark ? 0 : 1, borderColor: t.border };
  const body = (
    <>
      <LinearGradient colors={grad} locations={[0, 0.6, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ padding: 18, gap: 14 }}>{children}</View>
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ ...wrap, opacity: pressed ? 0.93 : 1 })}>
        {body}
      </Pressable>
    );
  }
  return <View style={wrap}>{body}</View>;
}

function Stat({ t, color, value, label }: any) {
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: color + '12', borderWidth: 1, borderColor: color + '2E', alignItems: 'center', gap: 3 }}>
      <Text style={{ color, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 }} numberOfLines={1}>{value}</Text>
      <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{label}</Text>
    </View>
  );
}
