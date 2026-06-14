import { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, Alert, TextInput, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, setLanguage, currentLang } from '../../lib/i18n';
import { reset, update, useAppState } from '../../lib/storage';
import { GlassCard } from '../../components/GlassCard';
import { getStep } from '../../lib/stepped';
import { Icon } from '../../components/Icon';
import { SwipeToHome } from '../../components/SwipeToHome';
import { usePremium } from '../../lib/subscription';
import { getDeviceId } from '../../lib/billing';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { getStoredAccount, signOutAccount, type Account } from '../../lib/auth';

const PRIVACY_URL = 'https://breezapp.ru/privacy-policy.html';
const TERMS_URL = 'https://breezapp.ru/terms.html';
const SUPPORT_EMAIL = 'istrelkov829@gmail.com';

// Запрос возврата — письмом на поддержку (вручную), как в App Store / Netflix.
// Не самообслуживание: подписку нельзя отменить «в один тап» с возвратом денег.
async function contactSupportRefund(ru: boolean) {
  const id = await getDeviceId().catch(() => '');
  const subject = encodeURIComponent(ru ? 'Бриз — запрос на возврат' : 'Breeze — refund request');
  const body = encodeURIComponent(
    (ru
      ? 'Здравствуйте! Прошу рассмотреть возврат за подписку Премиум.\n\nПричина: \n'
      : 'Hi! Please consider a refund for my Premium subscription.\n\nReason: \n') + `\nID: ${id}`,
  );
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
}

export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const lang = currentLang();
  const p = state.profile;
  if (!p) return null;

  return (
    <SwipeToHome>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 14, paddingBottom: 80 }}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.8, marginVertical: 8 }}>
          {tr('profile.title')}
        </Text>

        <PremiumCard />

        <AccountCard />

        <LinkRow icon="wallet" label={lang === 'ru' ? 'Способ оплаты' : 'Payment method'}
          onPress={() => router.push('/payment-method' as any)} />

        <MethodCard />

        <HabitCard />

        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{tr('profile.language')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['ru', 'en'] as const).map((l) => (
                <Pressable key={l} onPress={() => setLanguage(l)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                    backgroundColor: lang === l ? t.accentSoft : t.border,
                  }}>
                  <Text style={{ color: t.text, fontWeight: '600' }}>{l.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </GlassCard>

        <LinkRow icon="compass" label={lang === 'ru' ? 'Гид по приложению' : 'App tour'}
          onPress={async () => {
            await update((s) => ({ ...s, tourV1Done: false }));
            router.replace('/(tabs)');
          }} />

        <LinkRow icon="shield" label={lang === 'ru' ? 'Политика конфиденциальности' : 'Privacy policy'}
          onPress={() => Linking.openURL(PRIVACY_URL)} />
        <LinkRow icon="feather" label={lang === 'ru' ? 'Условия использования' : 'Terms of use'}
          onPress={() => Linking.openURL(TERMS_URL)} />

        <Pressable
          onPress={() =>
            Alert.alert(tr('profile.reset'), tr('profile.reset_confirm'), [
              { text: tr('common.cancel'), style: 'cancel' },
              { text: tr('profile.reset'), style: 'destructive', onPress: async () => { await reset(); router.replace('/(onboarding)/welcome'); } },
            ])
          }
          style={{ padding: 16, alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: t.danger, fontWeight: '600' }}>{tr('profile.reset')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
    </SwipeToHome>
  );
}

function AccountCard() {
  const t = useTheme();
  const ru = currentLang() === 'ru';
  const [acct, setAcct] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getStoredAccount().then((a) => { if (alive) { setAcct(a); setReady(true); } });
    return () => { alive = false; };
  }, []);

  if (Platform.OS !== 'ios') return null; // пока только Apple (iOS); Google — следующим
  if (!ready) return null;

  if (acct) {
    return (
      <GlassCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.shield size={20} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{ru ? 'Вход выполнен' : 'Signed in'}</Text>
            <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>
              {acct.email && !acct.email.includes('privaterelay.appleid')
                ? acct.email
                : (ru ? 'Apple ID · скрытая почта' : 'Apple ID · hidden email')}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => Alert.alert(
              ru ? 'Выйти из аккаунта?' : 'Sign out?',
              ru ? 'Подписка останется на аккаунте — войдёшь снова и восстановишь.' : 'Your subscription stays on the account — sign in again to restore.',
              [
                { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
                { text: ru ? 'Выйти' : 'Sign out', style: 'destructive', onPress: async () => { await signOutAccount(); setAcct(null); } },
              ],
            )}>
            <Text style={{ color: t.danger, fontSize: 14, fontWeight: '600' }}>{ru ? 'Выйти' : 'Sign out'}</Text>
          </Pressable>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{ru ? 'Сохрани подписку' : 'Save your subscription'}</Text>
      <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>
        {ru ? 'Войди — и подписка восстановится на новом телефоне в один тап.' : 'Sign in — your subscription restores on a new phone in one tap.'}
      </Text>
      <AppleSignInButton style={{ marginTop: 12 }} onDone={() => getStoredAccount().then(setAcct)} />
    </GlassCard>
  );
}

function LinkRow({ icon, label, onPress }: { icon: keyof typeof Icon; label: string; onPress: () => void }) {
  const t = useTheme();
  const I = Icon[icon];
  return (
    <Pressable onPress={onPress}>
      <GlassCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <I size={22} color={t.textDim} />
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{label}</Text>
          <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function MethodCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const stepId = state.profile?.currentStep;
  if (!stepId) return null;
  const step = getStep(stepId);
  return (
    <Pressable onPress={() => router.push('/method')}>
      <GlassCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 12, backgroundColor: step.color + '24',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: step.color, fontWeight: '800', fontSize: 16 }}>{step.index}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>
              {lang === 'ru' ? 'Метод' : 'Method'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
              {lang === 'ru' ? step.titleRu : step.titleEn}
            </Text>
          </View>
          <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function PremiumCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const ru = lang === 'ru';
  const [state] = useAppState();
  const premium = usePremium();
  const until = state.premiumUntil ?? 0;
  const lifetime = until > Date.now() + 40 * 365 * 86400_000;
  const dateStr = new Date(until).toLocaleDateString(ru ? 'ru-RU' : 'en-US');
  // Авто-продление обещаем только когда реально привязана карта.
  const realCard = !!(state.boundCard && state.boundCard.last4);
  const onTrial = premium && state.premiumPlan === 'trial';
  const daysLeft = Math.max(0, Math.ceil((until - Date.now()) / 86400_000));

  function manage() {
    if (onTrial) {
      Alert.alert(
        ru ? 'Пробный период' : 'Free trial',
        (ru ? `Осталось ${daysLeft} дн. полного доступа.` : `${daysLeft} days of full access left.`) + '\n\n' +
        (ru ? 'Автосписаний нет — после окончания доступ просто закроется. Оформи Премиум, чтобы продолжить без перерыва.'
            : 'No auto-charges — access just ends afterwards. Subscribe to continue without a break.'),
        [
          { text: ru ? 'Закрыть' : 'Close' },
          { text: ru ? 'Оформить Премиум' : 'Get Premium', onPress: () => router.push('/paywall' as any) },
        ],
      );
      return;
    }
    const head = lifetime ? (ru ? 'Доступ навсегда.' : 'Lifetime access.') : (ru ? `Активна до ${dateStr}.` : `Active until ${dateStr}.`);
    const note = lifetime
      ? (ru ? 'Разовая оплата — продлевать не нужно.' : 'One-time payment — nothing to renew.')
      : realCard
        ? (ru ? 'Продлевается автоматически. Отменить автопродление — отвязать карту в «Способ оплаты». Доступ сохранится до конца оплаченного периода.'
              : 'Renews automatically. To stop it, remove the card in “Payment method”. Access stays until the paid period ends.')
        : (ru ? 'Доступ — до конца оплаченного периода. Автосписаний нет.' : 'Access lasts until the paid period ends. No automatic charges.');
    Alert.alert(ru ? 'Подписка Премиум' : 'Premium subscription', head + '\n\n' + note, [
      { text: ru ? 'Закрыть' : 'Close' },
      ...(realCard ? [{ text: ru ? 'Способ оплаты' : 'Payment method', onPress: () => router.push('/payment-method' as any) }] : []),
      { text: ru ? 'Запросить возврат' : 'Request a refund', onPress: () => contactSupportRefund(ru) },
    ]);
  }

  const sub = premium
    ? (onTrial ? (ru ? `Пробный период · осталось ${daysLeft} дн.` : `Free trial · ${daysLeft} days left`)
       : lifetime ? (ru ? 'Доступ навсегда · управление' : 'Lifetime · manage')
       : realCard ? (ru ? `Продлевается · до ${dateStr} · управление` : `Renews · until ${dateStr} · manage`)
       : (ru ? `Активен до ${dateStr} · управление` : `Until ${dateStr} · manage`))
    : (ru ? 'Безлимит ИИ, все аудиопрактики, статьи и техники' : 'Unlimited AI, all audio, articles and techniques');

  return (
    <Pressable onPress={() => (premium ? manage() : router.push('/paywall' as any))}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: premium ? t.accent + '14' : t.card,
        borderWidth: 1, borderColor: premium ? t.accent + '60' : t.border,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <View style={{
          width: 46, height: 46, borderRadius: 14,
          backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.star size={22} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
            {premium ? (onTrial ? (ru ? 'Пробный Премиум' : 'Trial Premium') : (ru ? 'Премиум активен' : 'Premium active')) : (ru ? 'Открой Премиум' : 'Unlock Premium')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{sub}</Text>
        </View>
        <Text style={{ color: t.textDim, fontSize: 20 }}>›</Text>
      </View>
    </Pressable>
  );
}

function HabitCard() {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const p = state.profile;
  const [perday, setPerday] = useState(String(p?.cigsPerDay ?? ''));
  const [packPrice, setPackPrice] = useState(String(p?.packPrice ?? ''));
  const [packSize, setPackSize] = useState(String(p?.cigsInPack ?? ''));
  const [currency, setCurrency] = useState(p?.currency ?? 'RUB');
  const [savedAt, setSavedAt] = useState(0);

  if (!p) return null;
  const issue = !p.cigsPerDay || !p.packPrice || !p.cigsInPack;

  async function save() {
    await update((s) => ({
      ...s,
      profile: s.profile ? {
        ...s.profile,
        cigsPerDay: Number(perday) || 0,
        packPrice: Number(packPrice) || 0,
        cigsInPack: Number(packSize) || 20,
        currency: currency.trim() || 'RUB',
      } : s.profile,
    }));
    setSavedAt(Date.now());
  }

  return (
    <GlassCard>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>
        {lang === 'ru' ? 'Данные о курении' : 'Smoking data'}
      </Text>
      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
        {lang === 'ru'
          ? 'Поправь, если ошибся при настройке. От этих чисел считается экономия — пересчёт идёт за всё время.'
          : 'Fix these if you set them up wrong. Savings are calculated from them — recomputed across your whole streak.'}
      </Text>

      {issue && (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: t.warn + '20', borderWidth: 1, borderColor: t.warn + '50' }}>
          <Text style={{ color: t.warn, fontSize: 12, fontWeight: '700' }}>
            {lang === 'ru' ? 'Заполни поля — иначе цифры на главной будут 0' : 'Fill the fields or stats stay at 0'}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, marginBottom: 4 }}>{lang === 'ru' ? 'Сигарет / день' : 'Cigs / day'}</Text>
          <TextInput value={perday} onChangeText={setPerday} keyboardType="number-pad" placeholder="15" placeholderTextColor={t.textDim}
            style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 16, fontWeight: '700' }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, marginBottom: 4 }}>{lang === 'ru' ? 'Цена пачки' : 'Pack price'}</Text>
          <TextInput value={packPrice} onChangeText={setPackPrice} keyboardType="number-pad" placeholder="220" placeholderTextColor={t.textDim}
            style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 16, fontWeight: '700' }} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, marginBottom: 4 }}>{lang === 'ru' ? 'Сигарет в пачке' : 'Cigs in pack'}</Text>
          <TextInput value={packSize} onChangeText={setPackSize} keyboardType="number-pad" placeholder="20" placeholderTextColor={t.textDim}
            style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 16, fontWeight: '700' }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, marginBottom: 4 }}>{lang === 'ru' ? 'Валюта' : 'Currency'}</Text>
          <TextInput value={currency} onChangeText={setCurrency} autoCapitalize="characters" autoCorrect={false} placeholder="RUB" placeholderTextColor={t.textDim}
            style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 16, fontWeight: '700' }} />
        </View>
      </View>

      <Pressable onPress={save}
        style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: t.accent, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>
          {savedAt && Date.now() - savedAt < 2000 ? (lang === 'ru' ? 'Сохранено' : 'Saved') : (lang === 'ru' ? 'Сохранить' : 'Save')}
        </Text>
      </Pressable>
    </GlassCard>
  );
}
