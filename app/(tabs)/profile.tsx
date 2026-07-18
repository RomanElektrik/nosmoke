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
import { getStoredAccount, signOutAccount, deleteAccount, type Account } from '../../lib/auth';

const PRIVACY_URL = 'https://breezapp.ru/privacy-policy.html';
const TERMS_URL = 'https://breezapp.ru/terms.html';

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

        <LinkRow icon="wallet" label={lang === 'ru' ? 'Премиум' : 'Premium'}
          onPress={() => router.push('/payment-method' as any)} />

        <MethodCard />

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
        {/* App Review 5.1.1(v): у входа обязан быть путь ПОЛНОГО удаления аккаунта. */}
        <Pressable
          hitSlop={8}
          style={{ marginTop: 10, alignSelf: 'flex-start' }}
          onPress={() => Alert.alert(
            ru ? 'Удалить аккаунт?' : 'Delete account?',
            ru ? 'Аккаунт и его данные будут удалены с сервера навсегда. Локальный прогресс на этом устройстве останется.'
               : 'Your account and its data will be permanently deleted from our server. Local progress on this device stays.',
            [
              { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
              { text: ru ? 'Удалить навсегда' : 'Delete forever', style: 'destructive', onPress: async () => {
                  await deleteAccount();
                  setAcct(null);
                  Alert.alert(ru ? 'Аккаунт удалён' : 'Account deleted',
                    ru ? 'Все данные аккаунта стёрты с сервера.' : 'All account data has been erased from our server.');
                } },
            ],
          )}>
          <Text style={{ color: t.textDim, fontSize: 13, textDecorationLine: 'underline' }}>
            {ru ? 'Удалить аккаунт и данные' : 'Delete account & data'}
          </Text>
        </Pressable>
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
  // App Review 3.1.1: покупок в приложении нет — карточка Премиума скрыта.
  return null;
  const until = state.premiumUntil ?? 0;
  const lifetime = until > Date.now() + 40 * 365 * 86400_000;
  const dateStr = new Date(until).toLocaleDateString(ru ? 'ru-RU' : 'en-US');
  // lifetime сильнее плана: если until — «навсегда» (2100 год), это не триал,
  // даже если сервер прислал исторический plan='trial' (иначе рисовали
  // «Пробный · осталось 26 800 дн.»).
  const onTrial = premium && state.premiumPlan === 'trial' && !lifetime;
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
    const head = lifetime ? (ru ? 'Доступ навсегда.' : 'Lifetime access.') : (ru ? `Активен до ${dateStr}.` : `Active until ${dateStr}.`);
    const note = ru
      ? 'Разовая покупка «Навсегда» — продлевать ничего не нужно, автосписаний нет.'
      : 'One-time “Forever” purchase — nothing to renew, no automatic charges.';
    Alert.alert(ru ? 'Премиум' : 'Premium', head + '\n\n' + note, [
      { text: ru ? 'Закрыть' : 'Close' },
      { text: ru ? 'Подробнее' : 'Details', onPress: () => router.push('/payment-method' as any) },
    ]);
  }

  const sub = premium
    ? (onTrial ? (ru ? `Пробный период · осталось ${daysLeft} дн.` : `Free trial · ${daysLeft} days left`)
       : lifetime ? (ru ? 'Доступ навсегда · управление' : 'Lifetime · manage')
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

