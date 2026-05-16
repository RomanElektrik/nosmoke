// Premium paywall. Soft freemium — the free core is fully usable; this screen
// sells depth and convenience. Reachable from premium-gated features and once
// after onboarding.
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { Icon } from '../components/Icon';
import {
  PLANS, PREMIUM_FEATURES_RU, PREMIUM_FEATURES_EN, type PlanId,
  getPackages, purchasePackage, restorePurchases, usePremium, devTogglePremium,
} from '../lib/subscription';

export default function Paywall() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const premium = usePremium();

  const [selected, setSelected] = useState<PlanId>('annual');
  const [packages, setPackages] = useState<Record<PlanId, any> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { getPackages().then(setPackages); }, []);
  // Close automatically once the user becomes premium.
  useEffect(() => { if (premium) router.back(); }, [premium]);

  const features = ru ? PREMIUM_FEATURES_RU : PREMIUM_FEATURES_EN;

  function priceFor(id: PlanId): string {
    const pkg = packages?.[id];
    const storePrice = pkg?.product?.priceString;
    return storePrice || PLANS.find((p) => p.id === id)!.priceFallback;
  }

  async function buy() {
    const pkg = packages?.[selected];
    if (!pkg) {
      setMsg(ru ? 'Магазин недоступен. Попробуй позже или обнови приложение.' : 'Store unavailable. Try again later.');
      return;
    }
    setBusy(true); setMsg('');
    const res = await purchasePackage(pkg);
    setBusy(false);
    if (res === 'ok') { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    else if (res === 'error') setMsg(ru ? 'Не удалось оформить покупку.' : 'Purchase failed.');
  }

  async function restore() {
    setBusy(true); setMsg('');
    const res = await restorePurchases();
    setBusy(false);
    if (res === 'error') setMsg(ru ? 'Покупки не найдены.' : 'No purchases found.');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient colors={[t.accentSoft, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.textDim, fontSize: 16 }}>{ru ? 'Закрыть' : 'Close'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16, paddingBottom: 40 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.crown size={36} color={t.accent} />
        </View>
        <Text style={{ color: t.text, fontSize: 32, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38 }}>
          {ru ? 'NoSmokeUp Premium' : 'NoSmokeUp Premium'}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 22 }}>
          {ru
            ? 'Бросить курить можно и бесплатно — это ядро всегда открыто. Premium добавляет глубину: безлимитный ИИ-коуч, всю программу и аналитику.'
            : 'You can quit for free — the core is always open. Premium adds depth: an unlimited AI coach, the full program and analytics.'}
        </Text>

        {/* Features */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {features.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.accent + '24', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.check size={14} color={t.accent} />
              </View>
              <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={{ gap: 10, marginTop: 8 }}>
          {PLANS.map((p) => {
            const sel = selected === p.id;
            return (
              <Pressable key={p.id} onPress={() => { Haptics.selectionAsync(); setSelected(p.id); }}
                style={{
                  padding: 16, borderRadius: radius.lg,
                  backgroundColor: sel ? t.accent + '14' : t.bgElev,
                  borderWidth: 2, borderColor: sel ? t.accent : t.border,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                }}>
                <View style={{
                  width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                  borderColor: sel ? t.accent : t.border,
                  backgroundColor: sel ? t.accent : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Icon.check size={13} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
                      {ru ? p.titleRu : p.titleEn}
                    </Text>
                    {p.best && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: t.accent }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                          {ru ? 'ВЫГОДНО' : 'BEST'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{ru ? p.subRu : p.subEn}</Text>
                </View>
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }}>{priceFor(p.id)}</Text>
              </Pressable>
            );
          })}
        </View>

        {!!msg && <Text style={{ color: t.danger, fontSize: 13, textAlign: 'center' }}>{msg}</Text>}

        <Pressable onPress={buy} disabled={busy}
          style={{ marginTop: 4, padding: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
                {ru ? 'Оформить Premium' : 'Get Premium'}
              </Text>}
        </Pressable>

        <Pressable onPress={restore} disabled={busy} style={{ padding: 10, alignItems: 'center' }}>
          <Text style={{ color: t.textDim, fontSize: 14 }}>{ru ? 'Восстановить покупки' : 'Restore purchases'}</Text>
        </Pressable>

        <Text style={{ color: t.textDim, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>
          {ru
            ? 'Подписка продлевается автоматически, пока её не отменить в настройках магазина. «Навсегда» — разовая покупка без продления.'
            : 'Subscriptions renew automatically until cancelled in store settings. "Lifetime" is a one-time purchase.'}
        </Text>

        {__DEV__ && (
          <Pressable onPress={() => devTogglePremium()} style={{ padding: 10, alignItems: 'center' }}>
            <Text style={{ color: t.textDim, fontSize: 11 }}>[dev] переключить Premium</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
