import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { useAppState, update } from '../../lib/storage';
import { secondsClean, nextMilestone, progressFor } from '../../lib/health';
import {
  moneySaved, cigsAvoided,
  formatMoneyLive, formatCigs, formatDuration,
} from '../../lib/money';
import { identityHeadline, plural, triggerLabel, relevantPlan } from '../../lib/identity';
import { Icon } from '../../components/Icon';
import { programToday } from '../../lib/program';
import { getStep, escalationSuggestion, prepChecklist } from '../../lib/stepped';
import { todayDoses, isDoseTaken, expectedMedForStep, MED_SAFETY } from '../../lib/medication';
import { newlyUnlocked, ACHIEVEMENTS, buildContext, achProgress, isAchUnlocked } from '../../lib/achievements';
import { AchievementUnlock } from '../../components/AchievementUnlock';
import { ARTICLES, ARTICLE_IMAGES, articleAspect } from '../../lib/articles';
import { localDateKey } from '../../lib/dates';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const [now, setNow] = useState(Date.now());
  const [unlockQueue, setUnlockQueue] = useState<string[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Detect & persist newly unlocked achievements, queue them for celebration.
  useEffect(() => {
    const fresh = newlyUnlocked(state);
    if (fresh.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update((s) => ({
      ...s,
      achievements: {
        ...(s.achievements ?? {}),
        ...Object.fromEntries(fresh.map((id) => [id, Date.now()])),
      },
    }));
    setUnlockQueue((q) => [...q, ...fresh.filter((id) => !q.includes(id))]);
  }, [state]);

  // Auto-activate pending method when its scheduled date arrives.
  useEffect(() => {
    const p2 = state.profile;
    if (!p2?.pendingMethod || !p2?.pendingQuitDate) return;
    if (p2.pendingQuitDate <= Date.now()) {
      const startMs = p2.pendingQuitDate;
      const stepId = p2.pendingMethod;
      import('../../lib/storage').then(({ update }) => {
        update((s) => s.profile ? ({
          ...s,
          profile: {
            ...s.profile,
            currentStep: stepId,
            stepEnteredAt: startMs,
            quitDate: startMs,
            pendingMethod: undefined,
            pendingQuitDate: undefined,
          },
        }) : s);
      });
    }
  }, [state.profile?.pendingMethod, state.profile?.pendingQuitDate, now]);

  if (!state.profile) return null;
  const p = state.profile;
  const secs = secondsClean(p.quitDate, now);
  const next = nextMilestone(secs);
  const lang = currentLang();
  const localeStr = lang === 'ru' ? 'ru-RU' : 'en-US';

  const days = Math.floor(secs / 86400);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Atmosphere gradient */}
      <LinearGradient
        colors={[t.accentSoft, t.accentSoft, 'transparent']}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 14, paddingBottom: 150 }}>
        <Text style={{ color: t.textDim, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
          {greeting(lang)}
        </Text>

        {/* Breathing drop */}
        <BreathingDrop secs={secs} lang={lang} />

        {/* Identity hero — the heart of the positioning. Evolves with days.
            One line only: the orb already shows the number, no second timer. */}
        <Text style={{
          color: t.text, fontSize: 18, fontWeight: '700', textAlign: 'center',
          lineHeight: 25, marginTop: 8, paddingHorizontal: 14, letterSpacing: -0.3,
        }}>
          {identityHeadline(secs, lang)}
        </Text>
        {next && (
          <Text style={{ color: t.textDim, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
            {lang === 'ru' ? 'до вехи' : 'to milestone'} «{tr(next.titleKey)}» — {formatDuration(next.at - secs, lang)}
          </Text>
        )}

        {/* Concrete wins — identity is already the hero above. No scare-stat. */}
        <Pressable onPress={() => router.push('/journal')}>
          <View style={{
            backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
            borderRadius: radius.lg, padding: 16, marginTop: 4,
            flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: t.accent, fontSize: 18, fontWeight: '800' }}>
                {formatMoneyLive(moneySaved(p, secs), p.currency, localeStr)}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 11, marginTop: 2 }}>{lang === 'ru' ? 'сэкономлено' : 'saved'}</Text>
            </View>
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: t.border }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: t.warn, fontSize: 18, fontWeight: '800' }}>{formatCigs(cigsAvoided(p, secs))}</Text>
              <Text style={{ color: t.textDim, fontSize: 11, marginTop: 2 }}>{lang === 'ru' ? 'не выкурено' : 'avoided'}</Text>
            </View>
          </View>
        </Pressable>

        {/* ПОМОЩЬ РЯДОМ — moved up: this is the user's primary navigation.
            «Награды» убраны — есть отдельная вкладка снизу. */}
        <SectionLabel text={lang === 'ru' ? 'Помощь рядом' : 'Help nearby'} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SquareCard
            color={t.info} icon={<Icon.chat size={22} color={t.info} />}
            title={lang === 'ru' ? 'ИИ-помощник' : 'AI coach'}
            onPress={() => router.push('/(tabs)/coach')} />
          <SquareCard
            color={t.warn} icon={<Icon.toolbox size={22} color={t.warn} />}
            title={tr('tabs.techniques')}
            onPress={() => router.push('/(tabs)/techniques')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SquareCard
            color={t.accent} icon={<Icon.lungs size={22} color={t.accent} />}
            title={tr('tabs.health')}
            onPress={() => router.push('/(tabs)/health')} />
          <SquareCard
            color="#FF9F0A" icon={<Icon.chart size={22} color="#FF9F0A" />}
            title={lang === 'ru' ? 'Симптомы' : 'Symptoms'}
            onPress={() => router.push('/symptoms' as any)} />
        </View>

        {/* СЕЙЧАС */}
        <SectionLabel text={lang === 'ru' ? 'Сейчас' : 'Now'} />
        <IdentityRitualCard />
        <TodayFocus />
        <IfThenCard />
        <GoalCard />

        {/* Closest achievement */}
        <NearAchievement />

        {/* ТВОЙ ПУТЬ */}
        <SectionLabel text={lang === 'ru' ? 'Твой путь' : 'Your path'} />

        {/* Pending start banner */}
        {p.pendingMethod && p.pendingQuitDate && p.pendingQuitDate > Date.now() && (() => {
          const newStep = getStep(p.pendingMethod);
          const items = prepChecklist(p.pendingMethod, p.faithEnabled);
          const doneCount = (p.pendingPrep ?? []).filter((x) => x.done).length;
          const daysLeft = Math.ceil((p.pendingQuitDate - Date.now()) / 86400_000);
          return (
            <Pressable onPress={() => router.push('/transition')}>
              <View style={{
                padding: 16, borderRadius: radius.lg,
                backgroundColor: newStep.color + '14', borderWidth: 1, borderColor: newStep.color + '40',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: newStep.color + '24', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: newStep.color, fontWeight: '800', fontSize: 16 }}>{daysLeft}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: newStep.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {lang === 'ru' ? `Старт через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дн.'}` : `Starts in ${daysLeft} day(s)`}
                    </Text>
                    <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                      {lang === 'ru' ? newStep.titleRu : newStep.titleEn}
                    </Text>
                    <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                      {lang === 'ru' ? `Подготовка: ${doneCount} из ${items.length}` : `Preparation: ${doneCount} of ${items.length}`}
                    </Text>
                  </View>
                  <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
                </View>
              </View>
            </Pressable>
          );
        })()}

        <MethodCard />
        <MedicationCard />

        {/* Knowledge — coping articles */}
        <KnowledgeSection />
      </ScrollView>

      {unlockQueue.length > 0 && (
        <AchievementUnlock
          achId={unlockQueue[0]}
          onClose={() => setUnlockQueue((q) => q.slice(1))}
        />
      )}
    </SafeAreaView>
  );
}

function greeting(lang: 'ru' | 'en'): string {
  const h = new Date().getHours();
  if (lang === 'ru') {
    if (h < 6) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }
  if (h < 6) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─── Breathing drop ───────────────────────────────────────────────────────────
// Layered radial glows + a central circle with a slow breathing pulse.
// `plural` is imported from lib/identity.ts (shared with identity copy).

// Headline number for the orb — the streak number that NEVER resets.
// Identity meaning lives in the line below the orb, not in the unit.
function dropHeadline(secs: number, lang: 'ru' | 'en'): { big: string; unit: string } {
  const days = Math.floor(secs / 86400);
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor(secs / 60);
  if (days >= 1) {
    return { big: String(days), unit: lang === 'ru' ? plural(days, ['день', 'дня', 'дней']) : (days === 1 ? 'day' : 'days') };
  }
  if (hours >= 1) {
    return { big: String(hours), unit: lang === 'ru' ? plural(hours, ['час', 'часа', 'часов']) : (hours === 1 ? 'hour' : 'hours') };
  }
  if (mins >= 1) {
    return { big: String(mins), unit: lang === 'ru' ? plural(mins, ['минута', 'минуты', 'минут']) : (mins === 1 ? 'minute' : 'minutes') };
  }
  return { big: lang === 'ru' ? 'Старт' : 'Start', unit: lang === 'ru' ? 'ты начал' : 'you began' };
}

function BreathingDrop({ secs, lang }: { secs: number; lang: 'ru' | 'en' }) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const { big, unit } = dropHeadline(secs, lang);
  const isText = big === 'Старт' || big === 'Start';

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 2750, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
  }, []);

  const aCore = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: 248, height: 248, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
      {/* outer soft halo */}
      <View style={{
        position: 'absolute', width: 248, height: 248, borderRadius: 124,
        backgroundColor: t.accentSoft,
      }} />
      {/* large solid green core — the number sits fully inside it */}
      <Animated.View style={[{
        width: 188, height: 188, borderRadius: 94,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        shadowColor: t.accent, shadowOpacity: 0.5, shadowRadius: 26,
        shadowOffset: { width: 0, height: 14 }, elevation: 10,
      }, aCore]}>
        <LinearGradient
          colors={['#3BD168', '#1B9C52']}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.85, y: 1 }}
          style={{ position: 'absolute', width: 188, height: 188 }}
        />
      </Animated.View>
      {/* centre headline */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{
          color: '#fff', fontWeight: isText ? '700' : '200',
          fontSize: isText ? 38 : 76, letterSpacing: isText ? -1 : -3,
          lineHeight: isText ? 44 : 80,
        }}>
          {big}
        </Text>
        <Text style={{
          color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 2,
          textTransform: 'uppercase', opacity: 0.9, marginTop: 4,
        }}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

// Knowledge — 3 rotating coping articles + link to the full list.
function KnowledgeSection() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const start = Math.floor(Date.now() / 86400_000) % ARTICLES.length;
  const featured = [0, 1, 2].map((i) => ARTICLES[(start + i) % ARTICLES.length]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginLeft: 6 }}>
          {lang === 'ru' ? 'Знание' : 'Knowledge'}
        </Text>
        <Pressable onPress={() => router.push('/articles' as any)} hitSlop={8}>
          <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600', marginRight: 6 }}>
            {lang === 'ru' ? 'Все статьи' : 'All articles'}
          </Text>
        </Pressable>
      </View>
      {featured.map((a) => {
        const I = Icon[a.icon];
        const img = ARTICLE_IMAGES[a.id];
        return (
          <Pressable key={a.id} onPress={() => router.push(`/article/${a.id}` as any)}
            style={{
              backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
              borderRadius: radius.lg, overflow: 'hidden',
            }}>
            {img
              ? <Image source={img} style={{ width: '100%', height: 168 }} resizeMode="cover" />
              : <View style={{ width: '100%', height: 168, backgroundColor: a.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                  <I size={44} color={a.color} />
                </View>}
            <View style={{ padding: 14 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={2}>
                {lang === 'ru' ? a.titleRu : a.titleEn}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 13, marginTop: 4, lineHeight: 19 }} numberOfLines={2}>
                {lang === 'ru' ? a.leadRu : a.leadEn}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  const t = useTheme();
  return (
    <Text style={{
      color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.4,
      textTransform: 'uppercase', marginLeft: 6, marginTop: 8,
    }}>
      {text}
    </Text>
  );
}

// Square help card (2-up grid)
function SquareCard({ icon, title, color, onPress }: { icon: any; title: string; color: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View style={{
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
        borderRadius: radius.lg, padding: 16, gap: 10, minHeight: 96,
      }}>
        <View style={{
          width: 46, height: 46, borderRadius: 14, backgroundColor: color + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </View>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
      </View>
    </Pressable>
  );
}

// Identity ritual — the signature feature. A once-a-day affirmation of the
// new self. NEVER punishes: a missed day doesn't reset anything; we count
// unique affirmed days. Reinforces quitter-identity (the #1 success predictor).
function IdentityRitualCard() {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const log = state.identityLog ?? [];
  const today = localDateKey();
  const doneToday = log.includes(today);
  const count = new Set(log).size;
  const statement = state.profile?.identityStatement?.trim();

  async function affirm() {
    if (doneToday) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => {
      const cur = s.identityLog ?? [];
      return cur.includes(today) ? s : { ...s, identityLog: [...cur, today] };
    });
  }

  return (
    <Pressable onPress={affirm} disabled={doneToday}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: doneToday ? t.accentSoft : t.accent + '14',
        borderWidth: 1, borderColor: t.accent + (doneToday ? '55' : '40'),
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
        <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: t.accent + '24', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.check size={26} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
            {doneToday
              ? (lang === 'ru' ? 'Сегодня подтверждено' : 'Affirmed today')
              : (lang === 'ru' ? 'Скажи: «Я не курю»' : 'Say: "I don\'t smoke"')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
            {statement
              ? (lang === 'ru' ? `Я становлюсь ${statement}` : `I'm becoming ${statement}`)
              : count > 0
                ? (lang === 'ru' ? `${count} ${plural(count, ['день', 'дня', 'дней'])} подтверждаю` : `${count} ${count === 1 ? 'day' : 'days'} affirmed`)
                : (lang === 'ru' ? 'Один тап в день — закрепи, кто ты' : 'One tap a day — anchor who you are')}
          </Text>
        </View>
        {!doneToday && <Text style={{ color: t.accent, fontSize: 22, fontWeight: '700' }}>→</Text>}
      </View>
    </Pressable>
  );
}

// If-then plan surfacing — shows the most relevant plan one tap away, or a
// CTA to build the first one. Matches by the user's most frequent recent trigger.
function IfThenCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const plans = state.ifThens ?? [];

  if (plans.length === 0) {
    return (
      <Pressable onPress={() => router.push('/plans' as any)}>
        <View style={{
          padding: 16, borderRadius: radius.lg,
          backgroundColor: t.card, borderWidth: 1, borderStyle: 'dashed', borderColor: t.accent + '60',
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.target size={22} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
              {lang === 'ru' ? 'Создай план «если — то»' : 'Build an if-then plan'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {lang === 'ru' ? 'Готовый ответ на тягу — заранее' : 'A ready answer to cravings — in advance'}
            </Text>
          </View>
          <Text style={{ color: t.accent, fontSize: 18 }}>›</Text>
        </View>
      </Pressable>
    );
  }

  const plan = relevantPlan(plans, state.cravings)!;

  return (
    <Pressable onPress={() => router.push('/plans' as any)}>
      <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon.target size={16} color={t.accent} />
          <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
            {lang === 'ru' ? 'Твой план' : 'Your plan'}{plan.category ? ` · ${triggerLabel(plan.category, lang)}` : ''}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
        </View>
        <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
          <Text style={{ color: t.accent, fontWeight: '700' }}>{lang === 'ru' ? 'Если ' : 'If '}</Text>
          {plan.trigger}
          <Text style={{ color: t.warn, fontWeight: '700' }}>{lang === 'ru' ? ' → то ' : ' → then '}</Text>
          {plan.action}
        </Text>
      </View>
    </Pressable>
  );
}

// Active savings goal — surfaces /goal contents on home so the user
// actually sees the jar they set up.
function GoalCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const p = state.profile;
  if (!p?.goalAmount || !p.goalLabel) return null;
  const secs = secondsClean(p.quitDate);
  const saved = moneySaved(p, secs);
  const pct = Math.min(1, saved / p.goalAmount);
  return (
    <Pressable onPress={() => router.push('/goal' as any)}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.star size={22} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? 'Цель' : 'Goal'}
            </Text>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {p.goalLabel}
            </Text>
          </View>
          <Text style={{ color: t.accent, fontSize: 13, fontWeight: '800' }}>
            {Math.round(pct * 100)}%
          </Text>
        </View>
        <View style={{ height: 6, borderRadius: 6, backgroundColor: t.border, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: t.accent }} />
        </View>
        <Text style={{ color: t.textDim, fontSize: 12 }}>
          {Math.round(saved).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} / {p.goalAmount.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} {p.currency}
        </Text>
      </View>
    </Pressable>
  );
}

// Closest locked achievement — "something to look forward to".
function NearAchievement() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const ctx = buildContext(state);
  const stored = state.achievements ?? {};

  const locked = ACHIEVEMENTS
    .filter((a) => !stored[a.id] && !isAchUnlocked(a, ctx))
    .map((a) => ({ a, prog: achProgress(a, ctx) }))
    .sort((x, y) => y.prog - x.prog);

  if (locked.length === 0) return null;
  const { a, prog } = locked[0];
  const I = Icon[a.icon];

  return (
    <Pressable onPress={() => router.push('/(tabs)/awards')}>
      <View style={{
        padding: 14, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: a.color + '20', alignItems: 'center', justifyContent: 'center' }}>
          <I size={23} color={a.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Скоро достижение' : 'Almost there'}
          </Text>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
            {lang === 'ru' ? a.titleRu : a.titleEn}
          </Text>
          <View style={{ height: 5, borderRadius: 5, backgroundColor: t.border, overflow: 'hidden', marginTop: 6 }}>
            <View style={{ width: `${prog * 100}%`, height: '100%', backgroundColor: a.color }} />
          </View>
        </View>
        <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
}

// Single prioritised "do this now" card.
function TodayFocus() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  if (!state.profile) return null;

  // No more daily "did you smoke today?" check-in — it was annoying.
  // Default action is always a 5-minute breathing practice.
  const action = {
    label: lang === 'ru' ? '5 минут дыхания' : '5 minutes of breathing',
    sub: lang === 'ru' ? 'Снизит тягу и стресс прямо сейчас' : 'Lowers craving and stress right now',
    href: '/practice/cyclic_sigh', color: t.info, icon: Icon.wind,
  };

  const I = action.icon;
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); router.push(action.href as any); }}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
        <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: action.color + '20', alignItems: 'center', justifyContent: 'center' }}>
          <I size={26} color={action.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{action.label}</Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{action.sub}</Text>
        </View>
        <Text style={{ color: t.textDim, fontSize: 20 }}>›</Text>
      </View>
    </Pressable>
  );
}

// Method / program card → leads to the Path tab.
function MethodCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const stepId = state.profile?.currentStep;
  if (!stepId) return null;
  // While a transition is scheduled, the pending banner above IS the plan.
  if (state.profile?.pendingMethod && (state.profile?.pendingQuitDate ?? 0) > Date.now()) {
    return null;
  }
  const step = getStep(stepId);
  const prog = programToday(state);
  const sug = escalationSuggestion(state);

  return (
    <Pressable onPress={() => router.push('/(tabs)/path')}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: step.color + '24', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: step.color, fontWeight: '800', fontSize: 17 }}>{step.index}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
              {lang === 'ru' ? step.titleRu : step.titleEn}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 13, marginTop: 1 }}>
              {prog.data
                ? (lang === 'ru' ? `День ${prog.day} из ${prog.total}` : `Day ${prog.day} of ${prog.total}`)
                : (lang === 'ru' ? `Ступень ${step.index} из 5` : `Step ${step.index} of 5`)}
            </Text>
          </View>
          <Text style={{ color: t.textDim, fontSize: 20 }}>›</Text>
        </View>
        {prog.data && (
          <View style={{ height: 5, backgroundColor: t.border, borderRadius: 5, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (prog.total > 0 ? prog.day / prog.total : 0) * 100)}%`, height: '100%', backgroundColor: step.color }} />
          </View>
        )}
        {!!prog.data && (
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>
            {lang === 'ru' ? prog.data.focusRu : prog.data.focusEn}
          </Text>
        )}
        {sug.yes && (
          <Pressable onPress={() => router.push('/transition')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border }}>
            <Icon.bolt size={16} color={t.warn} />
            <Text style={{ color: t.warn, fontSize: 13, fontWeight: '600', flex: 1 }}>
              {lang === 'ru' ? 'Метод держит слабовато — обсудим?' : 'Method feels too light — discuss?'}
            </Text>
            <Text style={{ color: t.warn, fontSize: 14 }}>→</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// Medication card — only when a medication course is active or expected.
function MedicationCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const stepId = state.profile?.currentStep;
  const med = state.profile?.medication;
  if (state.profile?.pendingMethod && (state.profile?.pendingQuitDate ?? 0) > Date.now()) {
    return null;
  }

  // No med activated, but the step expects one → activation CTA.
  if (!med) {
    const expectedMed = stepId ? expectedMedForStep(stepId) : null;
    if (!expectedMed) return null;
    const medName = lang === 'ru' ? MED_SAFETY[expectedMed].nameRu : MED_SAFETY[expectedMed].nameEn;
    return (
      <Pressable onPress={() => router.push({ pathname: '/med-gate', params: { med: expectedMed } } as any)}>
        <View style={{
          padding: 16, borderRadius: radius.lg,
          backgroundColor: t.card, borderWidth: 1, borderStyle: 'dashed', borderColor: t.info + '60',
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.info + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.shield size={22} color={t.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
              {lang === 'ru' ? `Начать приём: ${medName}` : `Start: ${medName}`}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {lang === 'ru' ? 'Препарат по плану — активируй расписание' : 'Medication is part of your plan'}
            </Text>
          </View>
          <Text style={{ color: t.info, fontSize: 18 }}>›</Text>
        </View>
      </Pressable>
    );
  }

  const medInfo = todayDoses(state, lang);
  if (medInfo.schedule.length === 0) return null;
  const medColor = med === 'cytisine' ? t.accent : med === 'bupropion' ? t.warn : t.info;
  const medName = med === 'cytisine' ? 'Цитизин' : med === 'bupropion' ? 'Бупропион' : 'Варениклин';

  return (
    <Pressable onPress={() => router.push('/meds')}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: medColor + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.shield size={22} color={medColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
            {lang === 'ru' ? `Приём · ${medName}` : `Doses · ${medName}`}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
            {lang === 'ru'
              ? `${medInfo.takenCount} из ${medInfo.schedule.length} принято сегодня`
              : `${medInfo.takenCount} of ${medInfo.schedule.length} taken today`}
          </Text>
        </View>
        <Text style={{ color: medColor, fontSize: 16, fontWeight: '800' }}>
          {medInfo.takenCount}/{medInfo.schedule.length}
        </Text>
      </View>
    </Pressable>
  );
}
