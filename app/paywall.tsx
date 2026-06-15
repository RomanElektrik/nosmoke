// Paywall screen — UI complete, real IAP not wired yet.
// "Включить (dev)" flips the local devPremium flag so the developer
// can test premium-gated features without making a purchase.

import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Linking, AppState, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { update, useAppState } from '../lib/storage';
import { Icon, IconKey } from '../components/Icon';
import { secondsClean } from '../lib/health';
import { moneySaved, paybackWeeks, formatMoney } from '../lib/money';
import { abstinenceStartMs } from '../lib/stepped';
import { createPayment, confirmPayment, startTrial } from '../lib/billing';
import { scheduleTrialEndReminder } from '../lib/notifications';
import { AppleSignInButton } from '../components/AppleSignInButton';
import { getStoredAccount } from '../lib/auth';

type PlanId = 'monthly' | 'yearly' | 'lifetime';

type Plan = {
  id: PlanId;
  ru: string;
  en: string;
  // Right-hand figure (per-month for recurring, total for lifetime).
  rightRu: string;
  rightEn: string;
  // Small line under the name (duration · total). Empty = none.
  subRu?: string;
  subEn?: string;
  badge?: { ru: string; en: string };
  // Total charged + period — used on the sticky CTA.
  ctaPriceRu: string;
  ctaPriceEn: string;
  ctaPeriodRu: string;
  ctaPeriodEn: string;
};

const PLANS: Plan[] = [
  { id: 'yearly', ru: 'Год', en: 'Yearly',
    rightRu: '166 ₽/мес', rightEn: '$2.50/mo',
    subRu: '12 месяцев · 1990 ₽', subEn: '12 months · $29.99',
    badge: { ru: '−58%', en: '−58%' },
    ctaPriceRu: '1990 ₽', ctaPriceEn: '$29.99', ctaPeriodRu: 'на год', ctaPeriodEn: 'for a year' },
  { id: 'monthly', ru: 'Месяц', en: 'Monthly',
    rightRu: '399 ₽/мес', rightEn: '$5.99/mo',
    ctaPriceRu: '399 ₽', ctaPriceEn: '$5.99', ctaPeriodRu: 'в месяц', ctaPeriodEn: 'per month' },
  { id: 'lifetime', ru: 'Навсегда', en: 'Lifetime',
    rightRu: '3990 ₽', rightEn: '$59.99',
    subRu: 'разовый платёж', subEn: 'one-time payment',
    badge: { ru: 'НАВСЕГДА', en: 'FOREVER' },
    ctaPriceRu: '3990 ₽', ctaPriceEn: '$59.99', ctaPeriodRu: 'навсегда', ctaPeriodEn: 'forever' },
];

// Outcome-framed, not inventory. Every line is ACTUALLY gated in code —
// promising free/non-existent features is an App Store 2.3.1 reject.
type Feature = { i: IconKey; c: string; t: string; d: string };
const FEATURES_RU: Feature[] = [
  { i: 'spark', c: '#30D158', t: 'Безлимит с Бризом', d: 'Без дневного лимита сообщений' },
  { i: 'pulse', c: '#BF5AF2', t: 'Аналитика тяги', d: 'Опасные часы и твои триггеры заранее' },
  { i: 'headphones', c: '#0A84FF', t: 'Все аудиопрактики', d: 'Голос на любой момент' },
  { i: 'toolbox', c: '#FF9F0A', t: 'Все техники', d: 'Полный набор приёмов' },
  { i: 'feather', c: '#FF375F', t: 'Все материалы', d: 'Статьи и программа без ограничений' },
];
const FEATURES_EN: Feature[] = [
  { i: 'spark', c: '#30D158', t: 'Unlimited Breeze', d: 'No daily message cap' },
  { i: 'pulse', c: '#BF5AF2', t: 'Craving analytics', d: 'Your risk hours and triggers ahead of time' },
  { i: 'headphones', c: '#0A84FF', t: 'All audio practices', d: 'A voice for any moment' },
  { i: 'toolbox', c: '#FF9F0A', t: 'All techniques', d: 'The full toolkit' },
  { i: 'feather', c: '#FF375F', t: 'All content', d: 'Every article, unrestricted' },
];

const PRIVACY_URL = 'https://breezapp.ru/privacy-policy.html';
const TERMS_URL = 'https://breezapp.ru/terms.html';

// Brand gradient — «бриз»: green → teal. Used for the hero star badge.
const BRAND_GRADIENT = ['#1DB85A', '#0E9E86'] as const;
// CTA gradient — emerald → blue. Premium, fresh, white text reads crisp.
const CTA_GRADIENT = ['#1DB85A', '#0A84FF'] as const;

export default function Paywall() {
  const t = useTheme();
  const router = useRouter();
  // onb=1 — paywall показан в конце онбординга (после экрана плана). В этом
  // режиме нет «назад» (план уже заменён): закрытие, триал и оплата ведут
  // ВПЕРЁД в приложение. Skip = честный переход на бесплатную версию.
  const { onb } = useLocalSearchParams<{ onb?: string }>();
  const fromOnb = onb === '1';
  const lang = currentLang();
  const ru = lang === 'ru';
  const [state] = useAppState();
  const [selected, setSelected] = useState<PlanId>('yearly');
  const features = ru ? FEATURES_RU : FEATURES_EN;
  const premium = !!state.profile?.devPremium || (!!state.premiumUntil && state.premiumUntil > Date.now());
  const plan = PLANS.find((pl) => pl.id === selected)!;
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  // Пробный период доступен, если ещё не премиум и триал ни разу не брался.
  const eligibleForTrial = !premium && !state.trialUsed;
  // Уже вошёл в аккаунт → «Вход с Apple» на пейволле не показываем (не путаем).
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let alive = true;
    getStoredAccount().then((a) => { if (alive) setSignedIn(!!a); });
    return () => { alive = false; };
  }, []);

  async function startFreeTrial() {
    if (busy) return;
    Haptics.selectionAsync();
    setBusy(true);
    try {
      const st = await startTrial();
      if (st.premium) {
        // Триал выдан (или уже идёт) — отражаем серверный статус целиком.
        await update((s) => ({ ...s, premiumUntil: st.until, premiumPlan: st.plan ?? 'trial', trialUsed: true }));
        try { await scheduleTrialEndReminder(st.until, lang); } catch {}
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          ru ? '7 дней Премиума открыто 🎉' : '7 days of Premium unlocked 🎉',
          ru ? 'Пользуйся всем без ограничений. Напомним за день до конца — без автосписаний.'
             : 'Enjoy everything with no limits. We\'ll remind you a day before it ends — no auto-charges.',
          [{ text: 'OK', onPress: done }],
        );
      } else if (st.trialUsed) {
        // Сервер авторитетно говорит: пробный уже был использован ранее.
        await update((s) => ({ ...s, trialUsed: true }));
        Alert.alert(ru ? 'Пробный уже использован' : 'Trial already used',
          ru ? 'Оформи Премиум, чтобы продолжить.' : 'Subscribe to keep going.');
      } else {
        // Премиум не выдан И сервер НЕ считает триал использованным — это
        // транзиентный сбой. НЕ жжём trialUsed, чтобы кнопка осталась.
        Alert.alert(ru ? 'Не получилось включить пробный' : 'Could not start trial',
          ru ? 'Похоже, сбой связи. Пробный остался — попробуй ещё раз.' : 'A connection hiccup. The trial is intact — try again.');
      }
    } catch (e: any) {
      Alert.alert(ru ? 'Не получилось' : 'Something went wrong', String(e?.message || ''));
    } finally {
      setBusy(false);
    }
  }
  const pendingRef = useRef<string | null>(null);
  const confirmingRef = useRef(false);
  const notifiedRef = useRef(false);

  async function applyStatus(until: number): Promise<boolean> {
    const ok = until > Date.now();
    if (ok) await update((s) => ({ ...s, premiumUntil: until }));
    return ok;
  }

  // After the user pays in the external browser and returns to the app, verify
  // the payment with our server and unlock premium. YooKassa status can lag
  // after redirect, so we retry with backoff (~21s) and — crucially — keep the
  // pending id on failure so a later foreground (or the launch fetchSub) still
  // picks it up. The webhook also grants server-side as a backstop.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (st) => {
      if (st !== 'active' || !pendingRef.current || confirmingRef.current) return;
      confirmingRef.current = true;
      const pid = pendingRef.current;
      setBusy(true);
      const delays = [1500, 2000, 3000, 4000, 5000, 6000];
      let unlocked = false;
      for (let i = 0; i <= delays.length && !unlocked; i++) {
        try {
          const res = await confirmPayment(pid);
          if (await applyStatus(res.until)) unlocked = true;
        } catch {}
        if (!unlocked && i < delays.length) await new Promise((r) => setTimeout(r, delays[i]));
      }
      setBusy(false);
      confirmingRef.current = false;
      if (unlocked) {
        pendingRef.current = null;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(ru ? 'Премиум активен 🎉' : 'Premium active 🎉', ru ? 'Спасибо! Все функции открыты.' : 'Thank you! Everything is unlocked.',
          [{ text: 'OK', onPress: done }]);
      } else if (!notifiedRef.current) {
        notifiedRef.current = true; // keep pendingRef for a later re-check
        Alert.alert(ru ? 'Проверяем оплату' : 'Confirming payment',
          ru ? 'Если оплата прошла — Премиум включится в течение минуты. Можно закрыть и зайти позже.'
             : 'If the payment went through, Premium activates within a minute. You can come back later.');
      }
    });
    return () => sub.remove();
  }, [ru]);

  // ── Personal money anchor ──
  const p = state.profile;
  const localeStr = ru ? 'ru-RU' : 'en-US';
  const currency = p?.currency ?? 'RUB';
  // От ДНЯ ОТКАЗА (как на главной/прогрессе): на фарме первые дни куришь по схеме.
  const saved = p ? moneySaved(p, Math.max(0, secondsClean(abstinenceStartMs(p)))) : 0;
  const savedMin = currency === 'RUB' ? 500 : 5;
  const showSaved = saved >= savedMin;
  const yearlyAmount = ru ? 1990 : 29.99;
  const weeks = p ? paybackWeeks(p, yearlyAmount) : null;
  const paybackWk = weeks && weeks >= 0.5 && weeks <= 52 ? Math.max(1, Math.round(weeks)) : null;
  const wkWord = (n: number) =>
    ru
      ? (n % 10 === 1 && n % 100 !== 11 ? 'неделю' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'недели' : 'недель'))
      : (n === 1 ? 'week' : 'weeks');

  // Куда уходить при закрытии/после успеха. В онбординге — вперёд в приложение
  // (назад идти некуда, план уже заменён); иначе — назад туда, откуда пришли.
  async function done() {
    if (fromOnb) {
      // Выход из онбординг-воронки — здесь и завершаем онбординг (флаг ставился
      // не на плане, чтобы гард не проскочил оффер). Платил или нет — неважно:
      // free-уровень полноценный.
      await update((s) => ({
        ...s,
        profile: s.profile ? { ...s.profile, onboardingComplete: true } : s.profile,
      }));
      router.replace('/(tabs)');
    } else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  async function devToggle() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, devPremium: !s.profile.devPremium } : s.profile,
    }));
  }

  async function purchase() {
    if (busy) return;
    Haptics.selectionAsync();
    setBusy(true);
    try {
      const mail = email.trim();
      const { id, confirmation_url } = await createPayment(selected, mail || undefined);
      pendingRef.current = id;            // verified when the app regains focus
      await Linking.openURL(confirmation_url);
    } catch (e: any) {
      pendingRef.current = null;
      Alert.alert(ru ? 'Не удалось начать оплату' : 'Could not start payment',
        ru ? 'Попробуй ещё раз чуть позже.' : 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      {/* Close — floating chip, below the notch and clearly tappable */}
      <Pressable onPress={done} hitSlop={14}
        style={{
          position: 'absolute', top: insets.top + 6, right: spacing.lg, zIndex: 10,
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
          alignItems: 'center', justifyContent: 'center',
        }}>
        <Text style={{ color: t.text, fontSize: 21, lineHeight: 23, fontWeight: '600' }}>×</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: 8, paddingBottom: 150, gap: 18 }}
        showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View style={{ alignItems: 'center', gap: 10 }}>
          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              width: 64, height: 64, borderRadius: 21,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: BRAND_GRADIENT[1], shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
            }}>
            <Icon.star size={32} color="#fff" />
          </LinearGradient>
          <Text style={{ color: t.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.6 }}>
            {ru ? 'БРИЗ ПРЕМИУМ' : 'BREEZE PREMIUM'}
          </Text>
          <Text style={{ color: t.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', lineHeight: 30 }}>
            {ru ? 'Ты справишься — Бриз рядом' : 'You’ve got this — Breeze is here'}
          </Text>
          {premium && (
            <View style={{
              marginTop: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
              backgroundColor: t.accent + '22', borderWidth: 1, borderColor: t.accent + '55',
            }}>
              <Text style={{ color: t.accent, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>
                {state.profile?.devPremium
                  ? (ru ? 'ПРЕМИУМ АКТИВЕН (DEV)' : 'PREMIUM ACTIVE (DEV)')
                  : (ru ? 'ПРЕМИУМ АКТИВЕН' : 'PREMIUM ACTIVE')}
              </Text>
            </View>
          )}
        </View>

        {/* ── Plans (grouped card, like the reference) ── */}
        <View style={{
          borderRadius: radius.lg, backgroundColor: t.card,
          borderWidth: 1, borderColor: t.border, overflow: 'hidden',
        }}>
          {PLANS.map((pl, idx) => {
            const sel = selected === pl.id;
            return (
              <Pressable key={pl.id} onPress={() => { Haptics.selectionAsync(); setSelected(pl.id); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 14, paddingHorizontal: 14,
                  borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: t.border,
                  backgroundColor: sel ? t.accent + '12' : 'transparent',
                }}>
                {/* Radio / check */}
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 2, borderColor: sel ? t.accent : t.border,
                  backgroundColor: sel ? t.accent : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Icon.check size={13} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{ru ? pl.ru : pl.en}</Text>
                    {pl.badge && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: t.accent }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{ru ? pl.badge.ru : pl.badge.en}</Text>
                      </View>
                    )}
                  </View>
                  {(pl.subRu || pl.subEn) && (
                    <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>{ru ? pl.subRu : pl.subEn}</Text>
                  )}
                </View>
                <Text style={{ color: sel ? t.text : t.textDim, fontSize: 14, fontWeight: '600' }}>
                  {ru ? pl.rightRu : pl.rightEn}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Features (grouped card, scrolls under the sticky button) ── */}
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 2, marginLeft: 4 }}>
          {ru ? 'ПРЕИМУЩЕСТВА ПОДПИСКИ' : 'WHAT YOU GET'}
        </Text>
        <View style={{
          borderRadius: radius.lg, backgroundColor: t.card,
          borderWidth: 1, borderColor: t.border, overflow: 'hidden',
        }}>
          {features.map((f, idx) => {
            const I = Icon[f.i];
            return (
              <View key={f.t} style={{
                flexDirection: 'row', alignItems: 'center', gap: 13,
                paddingVertical: 14, paddingHorizontal: 14,
                borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: t.border,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 11,
                  backgroundColor: f.c, alignItems: 'center', justifyContent: 'center',
                }}>
                  <I size={19} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 }}>{f.t}</Text>
                  <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 17, marginTop: 1.5 }}>{f.d}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Money anchor — honest justification, below all the features */}
        {(showSaved || paybackWk) && (
          <View style={{ paddingHorizontal: 4, gap: 3 }}>
            {showSaved && (
              <Text style={{ color: t.text, fontSize: 14, fontWeight: '700', lineHeight: 20 }}>
                {ru
                  ? `Ты уже сэкономил ${formatMoney(saved, currency, localeStr)} на несожжённых сигаретах.`
                  : `You've already saved ${formatMoney(saved, currency, localeStr)} on cigarettes not smoked.`}
              </Text>
            )}
            {paybackWk && (
              <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 18 }}>
                {ru
                  ? `Год Премиума ≈ ${paybackWk} ${wkWord(paybackWk)} твоего прежнего курения.`
                  : `A year of Premium ≈ ${paybackWk} ${wkWord(paybackWk)} of your old smoking spend.`}
              </Text>
            )}
          </View>
        )}

        {/* Email — for the receipt (чек) and restoring on another device */}
        {!premium && (
          <View style={{ gap: 8 }}>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder={ru ? 'Email для чека (необязательно)' : 'Email for receipt (optional)'}
              placeholderTextColor={t.textDim}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              style={{ backgroundColor: t.bgElev, color: t.text, paddingHorizontal: 14, paddingVertical: 13, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, fontSize: 14.5 }}
            />
            {/* Восстановление — через «Вход с Apple» (только если ещё не вошёл) */}
            {!signedIn && <AppleSignInButton style={{ marginTop: 4 }} dark />}
          </View>
        )}

        {/* Dev mode toggle — dev builds only, never in TestFlight/production */}
        {__DEV__ && <View style={{
          marginTop: 6, padding: 14, borderRadius: radius.md,
          backgroundColor: t.warn + '12', borderWidth: 1, borderColor: t.warn + '40', gap: 10,
        }}>
          <Text style={{ color: t.warn, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {ru ? 'РЕЖИМ РАЗРАБОТЧИКА' : 'DEV MODE'}
          </Text>
          <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>
            {ru
              ? 'Реальная оплата ещё не подключена. Кнопкой ниже включи Премиум локально, чтобы протестировать заблокированные функции.'
              : 'Real payments are not wired yet. Use the toggle below to unlock premium locally for testing.'}
          </Text>
          <Pressable onPress={devToggle}
            style={{ padding: 12, borderRadius: radius.md, backgroundColor: premium ? t.danger : t.accent, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {premium ? (ru ? 'Выключить Премиум' : 'Disable Premium') : (ru ? 'Включить Премиум (dev)' : 'Enable Premium (dev)')}
            </Text>
          </Pressable>
        </View>}
      </ScrollView>

      {/* ── Floating CTA — hovers over the scrolling content, soft fade behind ── */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        {/* Soft fade so the button reads against whatever scrolls under it */}
        <LinearGradient colors={['transparent', t.bg]} locations={[0, 0.55]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 }} pointerEvents="none" />
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 8, gap: 6 }}>
          {eligibleForTrial ? (
            <>
              <Pressable onPress={startFreeTrial} accessibilityRole="button" disabled={busy}
                style={({ pressed }) => ({ opacity: pressed || busy ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
                <LinearGradient colors={CTA_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: radius.xl, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
                    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
                  }}>
                  {busy && <ActivityIndicator color="#fff" />}
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 }}>
                    {busy ? (ru ? 'Открываю…' : 'Opening…') : (ru ? 'Попробовать 7 дней бесплатно' : 'Try 7 days free')}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={purchase} disabled={busy} hitSlop={8} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '600' }}>
                  {ru ? `или подключить сразу — ${plan.ctaPriceRu} ${plan.ctaPeriodRu}` : `or subscribe now — ${plan.ctaPriceEn} ${plan.ctaPeriodEn}`}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={purchase} accessibilityRole="button" disabled={busy}
              style={({ pressed }) => ({ opacity: pressed || busy ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
              <LinearGradient colors={CTA_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: radius.xl, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
                  shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
                }}>
                {busy && <ActivityIndicator color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 }}>
                  {busy
                    ? (ru ? 'Открываю оплату…' : 'Opening payment…')
                    : ru
                      ? `Подключить за ${plan.ctaPriceRu} ${plan.ctaPeriodRu}`
                      : `Get Premium — ${plan.ctaPriceEn} ${plan.ctaPeriodEn}`}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
          <Text style={{ color: t.textDim, fontSize: 10.5, textAlign: 'center', lineHeight: 14 }}>
            {selected === 'lifetime'
              ? (ru ? 'Разовый платёж · ' : 'One-time payment · ')
              : (ru ? 'Продлевается автоматически, отменить в «Способ оплаты» · ' : 'Auto-renews, cancel in “Payment method” · ')}
            <Text style={{ color: t.info }} onPress={() => Linking.openURL(TERMS_URL)}>
              {ru ? 'Условия' : 'Terms'}
            </Text>
            {ru ? ' и ' : ' & '}
            <Text style={{ color: t.info }} onPress={() => Linking.openURL(PRIVACY_URL)}>
              {ru ? 'Политика' : 'Privacy'}
            </Text>
          </Text>
          {/* В онбординге даём явно уйти на бесплатную версию — без тёмных
              паттернов: счётчик, SOS и безопасность доступны и без подписки. */}
          {fromOnb && !premium && (
            <Pressable onPress={done} hitSlop={8} style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
              <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '600' }}>
                {ru ? 'Продолжить с бесплатной версией' : 'Continue with the free version'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
