// Премиум — статус доступа. Модель lifetime-only: карта не привязывается,
// подписки/автопродления/автосписаний нет, поэтому «способом оплаты» управлять
// нечем. Экран показывает статус, ведёт на paywall и поясняет порядок возврата.
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState } from '../lib/storage';
import { usePremium } from '../lib/subscription';
import { Icon } from '../components/Icon';

export default function PaymentMethod() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const premium = usePremium();

  const until = state.premiumUntil ?? 0;
  const lifetime = until > Date.now() + 40 * 365 * 86400_000;
  // lifetime сильнее плана: если until — «навсегда» (2100 год), это не триал,
  // даже если сервер прислал исторический plan='trial' (иначе рисовали
  // «Пробный · осталось 26 800 дн.»).
  const onTrial = premium && state.premiumPlan === 'trial' && !lifetime;
  const daysLeft = Math.max(0, Math.ceil((until - Date.now()) / 86400_000));
  const dateStr = new Date(until).toLocaleDateString(ru ? 'ru-RU' : 'en-US');

  const statusLine = !premium
    ? (ru ? 'Оформи Премиум, чтобы открыть всё' : 'Get Premium to unlock everything')
    : onTrial ? (ru ? `Пробный период · осталось ${daysLeft} дн.` : `Free trial · ${daysLeft} days left`)
    : lifetime ? (ru ? 'Доступ навсегда' : 'Lifetime access')
    : (ru ? `Активен до ${dateStr}` : `Active until ${dateStr}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16 }}>
        <View>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 }}>
            {ru ? 'Премиум' : 'Premium'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            {ru ? 'Статус доступа и порядок возврата.' : 'Access status and refund terms.'}
          </Text>
        </View>

        {/* Статус */}
        <View style={{
          padding: 16, borderRadius: radius.lg,
          backgroundColor: premium ? t.accent + '14' : t.card,
          borderWidth: 1, borderColor: premium ? t.accent + '55' : t.border,
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.star size={22} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
              {premium
                ? (onTrial ? (ru ? 'Пробный Премиум' : 'Trial Premium') : (ru ? 'Премиум активен' : 'Premium active'))
                : (ru ? 'Премиум не активен' : 'Premium not active')}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>{statusLine}</Text>
          </View>
        </View>

        {!premium && (
          <Pressable onPress={() => router.push('/paywall' as any)}
            style={{ padding: 16, borderRadius: radius.lg, alignItems: 'center', backgroundColor: t.accent }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{ru ? 'Открыть Премиум' : 'Get Premium'}</Text>
          </Pressable>
        )}

        {/* Как устроена оплата */}
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 6 }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
            {ru ? 'Разовая покупка «Навсегда»' : 'One-time “Forever” purchase'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
            {ru
              ? '7 дней бесплатно без карты, дальше — один платёж 490 ₽ за пожизненный доступ. Карта не привязывается, подписки и автосписаний нет — отменять нечего.'
              : '7 days free with no card, then a single 490 ₽ payment for lifetime access. No card is saved, no subscription, no auto-charges — nothing to cancel.'}
          </Text>
        </View>

        <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18, paddingHorizontal: 2 }}>
          {ru
            ? 'Премиум — разовый платёж, будущих списаний нет. Порядок возврата описан в Условиях использования.'
            : 'Premium is a one-time payment; there are no future charges. Refund terms are described in the Terms of Use.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
