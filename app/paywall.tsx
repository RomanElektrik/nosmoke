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

type PlanId = 'weekly' | 'monthly' | 'yearly' | 'lifetime';

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
  { id: 'weekly',   ru: 'Неделя',  en: 'Weekly',    priceRu: '199 ₽',   priceEn: '$2.99' },
  { id: 'monthly',  ru: 'Месяц',   en: 'Monthly',   priceRu: '399 ₽',   priceEn: '$5.99' },
  { id: 'yearly',   ru: 'Год',     en: 'Yearly',    priceRu: '1 990 ₽', priceEn: '$29.99',
    perRu: '≈ 166 ₽/мес', perEn: '≈ $2.50/mo',
    badge: { ru: '7 дней бесплатно · −58%', en: '7-day trial · −58%' } },
  { id: 'lifetime', ru: 'Навсегда', en: 'Lifetime', priceRu: '3 990 ₽', priceEn: '$59.99',
    badge: { ru: 'Один раз', en: 'One-time' } },
];

const FEATURES_RU = [
  { i: 'spark' as const, t: 'Безлимит ИИ-помощника' },
  { i: 'toolbox' as const, t: 'Все техники и практики' },
  { i: 'leaf' as const, t: 'Все программы: НЗТ, цитизин, варениклин' },
  { i: 'feather' as const, t: 'Все статьи и материалы' },
  { i: 'pulse' as const, t: 'Расширенная аналитика и графики' },
  { i: 'shield' as const, t: 'Депозит-контракт для мотивации' },
  { i: 'star' as const, t: 'Премиум-темы и иконки' },
];
const FEATURES_EN = [
  { i: 'spark' as const, t: 'Unlimited AI assistant' },
  { i: 'toolbox' as const, t: 'All techniques and practices' },
  { i: 'leaf' as const, t: 'All programs: NRT, cytisine, varenicline' },
  { i: 'feather' as const, t: 'All articles and content' },
  { i: 'pulse' as const, t: 'Extended analytics and charts' },
  { i: 'shield' as const, t: 'Commitment contract for motivation' },
  { i: 'star' as const, t: 'Premium themes and icons' },
];

export default function Paywall() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const [selected, setSelected] = useState<PlanId>('yearly');
  const features = lang === 'ru' ? FEATURES_RU : FEATURES_EN;
  const premium = !!state.profile?.devPremium;

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

        <View style={{ alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: t.accent + '24', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.star size={32} color={t.accent} />
          </View>
          <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' }}>
            {lang === 'ru' ? 'Премиум' : 'Premium'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, textAlign: 'center', lineHeight: 21, paddingHorizontal: 14 }}>
            {lang === 'ru'
              ? 'Полный план отказа: безлимит ИИ, все программы, статьи и техники, расширенная аналитика.'
              : 'Full quit toolkit: unlimited AI, all programs, articles and techniques, extended analytics.'}
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

        {/* Features */}
        <View style={{ gap: 10 }}>
          {features.map((f) => {
            const I = Icon[f.i];
            return (
              <View key={f.t} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 12, borderRadius: radius.md,
                backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 11,
                  backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center',
                }}>
                  <I size={18} color={t.accent} />
                </View>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '600', flex: 1 }}>{f.t}</Text>
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
            padding: 18, borderRadius: radius.xl, backgroundColor: t.accent,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
            {selected === 'yearly'
              ? (lang === 'ru' ? 'Попробовать 7 дней бесплатно' : 'Start 7-day free trial')
              : (lang === 'ru' ? 'Подписаться' : 'Subscribe')}
          </Text>
        </Pressable>

        <Text style={{ color: t.textDim, fontSize: 11, textAlign: 'center', lineHeight: 16, paddingHorizontal: 10 }}>
          {lang === 'ru'
            ? 'Подписка возобновляется автоматически. Отмена в любой момент в настройках Apple ID.'
            : 'Subscription auto-renews. Cancel anytime in Apple ID settings.'}
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
