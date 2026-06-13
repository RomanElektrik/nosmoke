// Paywall screen — UI complete, real IAP not wired yet.
// "Включить (dev)" flips the local devPremium flag so the developer
// can test premium-gated features without making a purchase.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { update, useAppState } from '../lib/storage';
import { Icon } from '../components/Icon';
import { secondsClean } from '../lib/health';
import { moneySaved, paybackWeeks, formatMoney } from '../lib/money';

type PlanId = 'monthly' | 'yearly' | 'lifetime';

type Plan = {
  id: PlanId;
  ru: string;
  en: string;
  priceRu: string;
  priceEn: string;
  perRu?: string;
  perEn?: string;
  badge?: { ru: string; en: string };
};

const PLANS: Plan[] = [
  { id: 'monthly',  ru: 'Месяц',   en: 'Monthly',   priceRu: '399 ₽',   priceEn: '$5.99' },
  { id: 'yearly',   ru: 'Год',     en: 'Yearly',    priceRu: '1 990 ₽', priceEn: '$29.99',
    perRu: '166 ₽/мес — выгоднее всего', perEn: '$2.50/mo — best value',
    badge: { ru: 'ХИТ · −58%', en: 'POPULAR · −58%' } },
  { id: 'lifetime', ru: 'Навсегда', en: 'Lifetime', priceRu: '3 990 ₽', priceEn: '$59.99',
    perRu: 'один платёж, доступ навсегда', perEn: 'one payment, forever',
    badge: { ru: 'НАВСЕГДА', en: 'FOREVER' } },
];

// Outcome-framed, not inventory: what the user GETS in their day, not how many
// items unlock. Every line must still be ACTUALLY gated in code — promising
// free/non-existent features is an App Store 2.3.1 reject and a refund magnet.
const FEATURES_RU = [
  { i: 'spark' as const, t: 'Бриз рядом круглосуточно — без лимита сообщений' },
  { i: 'pulse' as const, t: 'Видишь свои опасные часы и триггеры заранее' },
  { i: 'headphones' as const, t: 'Любая аудиопрактика под рукой в момент тяги' },
  { i: 'toolbox' as const, t: 'Все техники, чтобы пережить волну' },
  { i: 'feather' as const, t: 'Все статьи и материалы программы' },
];
const FEATURES_EN = [
  { i: 'spark' as const, t: 'Breeze with you 24/7 — no message limit' },
  { i: 'pulse' as const, t: 'See your risk hours and triggers ahead of time' },
  { i: 'headphones' as const, t: 'Any audio practice ready the moment a craving hits' },
  { i: 'toolbox' as const, t: 'Every technique to ride out the wave' },
  { i: 'feather' as const, t: 'All articles and program content' },
];

export default function Paywall() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const [selected, setSelected] = useState<PlanId>('yearly');
  const features = lang === 'ru' ? FEATURES_RU : FEATURES_EN;
  const premium = !!state.profile?.devPremium;
  const plan = PLANS.find((pl) => pl.id === selected)!;
  const planPrice = lang === 'ru' ? plan.priceRu : plan.priceEn;

  // ── Personal money anchor ──
  // «Ты уже сэкономил X» + «год окупается за ~N недель твоего курения».
  // Honest, never shown when we have no spend data (fresh profile / no price).
  const p = state.profile;
  const localeStr = lang === 'ru' ? 'ru-RU' : 'en-US';
  const currency = p?.currency ?? 'RUB';
  const saved = p ? moneySaved(p, secondsClean(p.quitDate)) : 0;
  // Don't show «ты сэкономил 3 ₽» on day one — it reads as pathetic. Only
  // surface the saved line once it's a number worth bragging about.
  const savedMin = currency === 'RUB' ? 500 : 5;
  const showSaved = saved >= savedMin;
  const yearlyAmount = lang === 'ru' ? 1990 : 29.99;
  const weeks = p ? paybackWeeks(p, yearlyAmount) : null;
  const paybackWk = weeks && weeks >= 0.5 && weeks <= 52 ? Math.max(1, Math.round(weeks)) : null;
  const wkWord = (n: number) =>
    lang === 'ru'
      ? (n % 10 === 1 && n % 100 !== 11 ? 'неделю' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'недели' : 'недель'))
      : (n === 1 ? 'week' : 'weeks');

  async function devToggle() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, devPremium: !s.profile.devPremium } : s.profile,
    }));
  }

  function purchase() {
    Haptics.selectionAsync();
    Alert.alert(
      lang === 'ru' ? 'Подключение оплаты в разработке' : 'Payments not yet wired',
      lang === 'ru'
        ? 'Подписка появится в следующей версии приложения.'
        : 'Subscriptions are coming in the next release.',
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40, gap: 20 }}>
        {/* Close */}
        <Pressable onPress={() => router.back()} hitSlop={12}
          style={{ alignSelf: 'flex-end', padding: 6 }}>
          <Text style={{ color: t.textDim, fontSize: 26, lineHeight: 28 }}>×</Text>
        </Pressable>

        <View style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: t.accent + '24', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.star size={32} color={t.accent} />
          </View>
          <Text style={{ color: t.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }}>
            {lang === 'ru' ? 'БРИЗ ПРЕМИУМ' : 'BREEZE PREMIUM'}
          </Text>
          <Text style={{ color: t.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center', lineHeight: 32 }}>
            {lang === 'ru' ? 'Ты справишься.\nБриз — рядом 24/7.' : 'You’ve got this.\nBreeze is here 24/7.'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, textAlign: 'center', lineHeight: 21, paddingHorizontal: 14 }}>
            {lang === 'ru'
              ? 'Без лимитов, когда тяжело. Всё, что помогает не сорваться — в одном месте.'
              : 'No limits when it’s hard. Everything that helps you not relapse — in one place.'}
          </Text>
          {premium && (
            <View style={{
              marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
              backgroundColor: t.accent + '22', borderWidth: 1, borderColor: t.accent + '55',
            }}>
              <Text style={{ color: t.accent, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>
                {lang === 'ru' ? 'ПРЕМИУМ АКТИВЕН (DEV)' : 'PREMIUM ACTIVE (DEV)'}
              </Text>
            </View>
          )}
        </View>

        {/* Personal money anchor — only when we have real numbers to show */}
        {(showSaved || paybackWk) && (
          <View style={{
            padding: 16, borderRadius: radius.lg, gap: 6,
            backgroundColor: t.accent + '12', borderWidth: 1, borderColor: t.accent + '33',
          }}>
            {showSaved && (
              <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', lineHeight: 21 }}>
                {lang === 'ru'
                  ? `Ты уже сэкономил ${formatMoney(saved, currency, localeStr)} на несожжённых сигаретах.`
                  : `You've already saved ${formatMoney(saved, currency, localeStr)} on cigarettes not smoked.`}
              </Text>
            )}
            {paybackWk && (
              <Text style={{ color: t.textDim, fontSize: 13.5, lineHeight: 19 }}>
                {lang === 'ru'
                  ? `Год Премиума ≈ ${paybackWk} ${wkWord(paybackWk)} твоего прежнего курения.`
                  : `A year of Premium ≈ ${paybackWk} ${wkWord(paybackWk)} of your old smoking spend.`}
              </Text>
            )}
          </View>
        )}

        {/* Features */}
        <View style={{ gap: 10 }}>
          {features.map((f) => {
            const I = Icon[f.i];
            return (
              <View key={f.t} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 13, borderRadius: radius.md,
                backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
              }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center',
                }}>
                  <I size={19} color={t.accent} />
                </View>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '600', flex: 1, lineHeight: 20 }}>{f.t}</Text>
                <Icon.check size={17} color={t.accent} />
              </View>
            );
          })}
        </View>

        {/* Plans */}
        <View style={{ gap: 10, marginTop: 6 }}>
          {PLANS.map((p) => {
            const sel = selected === p.id;
            return (
              <Pressable key={p.id} onPress={() => { Haptics.selectionAsync(); setSelected(p.id); }}
                style={{
                  padding: 16, borderRadius: radius.lg,
                  backgroundColor: sel ? t.accent + '14' : t.card,
                  borderWidth: 2, borderColor: sel ? t.accent : t.border,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 2, borderColor: sel ? t.accent : t.border,
                  backgroundColor: sel ? t.accent : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Icon.check size={12} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>
                      {lang === 'ru' ? p.ru : p.en}
                    </Text>
                    {p.badge && (
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
                        backgroundColor: t.warn + '24',
                      }}>
                        <Text style={{ color: t.warn, fontSize: 11, fontWeight: '800' }}>
                          {lang === 'ru' ? p.badge.ru : p.badge.en}
                        </Text>
                      </View>
                    )}
                  </View>
                  {(p.perRu || p.perEn) && (
                    <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                      {lang === 'ru' ? p.perRu : p.perEn}
                    </Text>
                  )}
                </View>
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }}>
                  {lang === 'ru' ? p.priceRu : p.priceEn}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={purchase}
          style={{
            paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.xl, backgroundColor: t.accent,
            alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
          <Text style={{ color: '#fff', fontSize: 17.5, fontWeight: '800' }}>
            {lang === 'ru' ? 'Начать менять жизнь' : 'Start changing your life'}
          </Text>
          <Text style={{ color: '#ffffffcc', fontSize: 13, fontWeight: '600' }}>
            {selected === 'lifetime'
              ? (lang === 'ru' ? `${planPrice} — один раз, навсегда` : `${planPrice} — once, forever`)
              : selected === 'yearly'
                ? (lang === 'ru' ? `${planPrice}/год · ≈ 166 ₽/мес` : `${planPrice}/yr · ≈ $2.50/mo`)
                : (lang === 'ru' ? `${planPrice}/мес` : `${planPrice}/mo`)}
          </Text>
        </Pressable>

        <Text style={{ color: t.textDim, fontSize: 11, textAlign: 'center', lineHeight: 16, paddingHorizontal: 10 }}>
          {selected === 'lifetime'
            ? (lang === 'ru'
                ? 'Разовый платёж картой через ЮKassa. Доступ навсегда, без автосписаний.'
                : 'One-time card payment via YooKassa. Lifetime access, no recurring charges.')
            : (lang === 'ru'
                ? 'Оплата картой через ЮKassa. Продлевается автоматически, отменить можно в любой момент в профиле.'
                : 'Card payment via YooKassa. Renews automatically, cancel anytime in your profile.')}
        </Text>

        {/* Dev mode toggle — dev builds only, never in TestFlight/production:
            a visible toggle would hand out premium for free AND fail review. */}
        {__DEV__ && <View style={{
          marginTop: 14, padding: 14, borderRadius: radius.md,
          backgroundColor: t.warn + '12', borderWidth: 1, borderColor: t.warn + '40', gap: 10,
        }}>
          <Text style={{ color: t.warn, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'РЕЖИМ РАЗРАБОТЧИКА' : 'DEV MODE'}
          </Text>
          <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>
            {lang === 'ru'
              ? 'Реальная оплата ещё не подключена. Кнопкой ниже включи Премиум локально, чтобы протестировать заблокированные функции.'
              : 'Real payments are not wired yet. Use the toggle below to unlock premium locally for testing.'}
          </Text>
          <Pressable onPress={devToggle}
            style={{
              padding: 12, borderRadius: radius.md,
              backgroundColor: premium ? t.danger : t.accent,
              alignItems: 'center',
            }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {premium
                ? (lang === 'ru' ? 'Выключить Премиум' : 'Disable Premium')
                : (lang === 'ru' ? 'Включить Премиум (dev)' : 'Enable Premium (dev)')}
            </Text>
          </Pressable>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}
