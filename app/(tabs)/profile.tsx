import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, Alert, TextInput, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, setLanguage, currentLang } from '../../lib/i18n';
import { reset, update, useAppState } from '../../lib/storage';
import { GlassCard } from '../../components/GlassCard';
import { getStep } from '../../lib/stepped';
import { Icon } from '../../components/Icon';
import { SwipeToHome } from '../../components/SwipeToHome';
import { usePremium, isRuMarket } from '../../lib/subscription';
import { getDeviceId } from '../../lib/billing';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { getStoredAccount, signOutAccount, deleteAccount, type Account } from '../../lib/auth';
import { cancelAllNotifications } from '../../lib/notifications';

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
        <DeleteAccountRow />

        {/* Платёжная вывеска только на RU-рынке: вне его экран оплаты пуст
            (payment-method сам себя закрывает), а ревьюер видел мёртвый контрол. */}
        {isRuMarket() && (
          <LinkRow icon="wallet" label={lang === 'ru' ? 'Премиум' : 'Premium'}
            onPress={() => router.push('/payment-method' as any)} />
        )}

        <LinkRow icon="flame" label={lang === 'ru' ? 'Мои данные о курении' : 'My smoking data'}
          onPress={() => router.push('/smoking-data' as any)} />

        <MethodCard />

        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{tr('profile.language')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['ru', 'en'] as const).map((l) => (
                <Pressable key={l} onPress={async () => {
                  setLanguage(l);
                  // Только язык интерфейса. Рынок (и платная модель) залатчен
                  // при первом запуске и здесь намеренно не меняется.
                  await update((st) => ({ ...st, lang: l, profile: st.profile ? { ...st.profile, language: l } : st.profile }));
                }}
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
              { text: tr('profile.reset'), style: 'destructive', onPress: async () => { await reset(); await cancelAllNotifications(); router.replace('/(onboarding)/welcome'); } },
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

  // 🔴 Перечитываем при КАЖДОМ фокусе, а не один раз на маунте. DeleteAccountRow —
  // отдельный компонент со своим состоянием: после удаления аккаунта карточка
  // «Вход выполнен» продолжала висеть, и выглядело это так, будто удаление не
  // сработало (ровно то, за что Apple уже отбивала дважды).
  useFocusEffect(useCallback(() => {
    let alive = true;
    getStoredAccount().then((a) => { if (alive) { setAcct(a); setReady(true); } });
    return () => { alive = false; };
  }, []));

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
              ru ? 'Подписка останется на аккаунте — войдёшь снова и восстановишь.' : 'Your data stays on the account — sign in again to restore.',
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
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{ru ? 'Сохрани подписку' : 'Save your progress'}</Text>
      <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>
        {ru ? 'Войди — и подписка восстановится на новом телефоне в один тап.' : 'Sign in — your progress restores on a new phone in one tap.'}
      </Text>
      <AppleSignInButton style={{ marginTop: 12 }} onDone={() => getStoredAccount().then(setAcct)} />
    </GlassCard>
  );
}

// App Review 5.1.1(v): удаление аккаунта обязано быть легко находимым.
// Отдельная полноразмерная строка в профиле, видна ВСЕГДА (не только после
// входа): ревьюер дважды не нашёл мелкую ссылку внутри карточки.
function DeleteAccountRow() {
  const t = useTheme();
  const ru = currentLang() === 'ru';
  if (Platform.OS !== 'ios') return null;
  const onPress = async () => {
    const acct = await getStoredAccount();
    if (!acct) {
      Alert.alert(
        ru ? 'Аккаунта нет' : 'No account',
        ru ? 'На этом устройстве нет аккаунта — удалять нечего. Если ты создавал аккаунт раньше, войди через Apple выше, затем удали.'
           : 'There is no account on this device — nothing to delete. If you created an account before, sign in with Apple above, then delete it.',
      );
      return;
    }
    Alert.alert(
      ru ? 'Удалить аккаунт?' : 'Delete account?',
      ru ? 'Аккаунт и все его данные будут удалены с сервера навсегда. Это действие необратимо.'
         : 'Your account and all its data will be permanently deleted from our server. This cannot be undone.',
      [
        { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: ru ? 'Удалить навсегда' : 'Delete forever', style: 'destructive', onPress: async () => {
            const okDeleted = await deleteAccount();
            if (okDeleted) {
              Alert.alert(ru ? 'Аккаунт удалён' : 'Account deleted',
                ru ? 'Все данные аккаунта стёрты с сервера.' : 'All account data has been erased from our server.');
            } else {
              // Врать об удалении нельзя: юзер решит, что данных больше нет.
              Alert.alert(ru ? 'Не получилось удалить' : "Couldn't delete",
                ru ? 'Сервер не ответил. Проверь соединение и попробуй ещё раз — аккаунт остался на месте.'
                   : "The server didn't respond. Check your connection and try again — your account is still there.");
            }
          } },
      ],
    );
  };
  return (
    <Pressable onPress={onPress}>
      <GlassCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.danger + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={20} color={t.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.danger, fontSize: 16, fontWeight: '600' }}>
              {ru ? 'Удалить аккаунт и данные' : 'Delete account & data'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>
              {ru ? 'Стереть аккаунт с сервера навсегда' : 'Permanently erase your account from our server'}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
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
  // Оплата только на российском рынке — остальным карточка Премиума не нужна.
  if (!isRuMarket()) return null;
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

