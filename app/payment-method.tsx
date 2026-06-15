// Способ оплаты и управление подпиской: статус, отвязка карты (для рекуррента),
// запрос возврата. Возврат — НЕ самообслуживанием (как в App Store / Netflix):
// отмена не возвращает текущий период, деньги — только по запросу на поддержку,
// вручную. Если возврат одобрят — премиум снимется сам при проверке статуса.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { update, useAppState } from '../lib/storage';
import { usePremium } from '../lib/subscription';
import { Icon } from '../components/Icon';
import { unbindCard, getDeviceId } from '../lib/billing';

const SUPPORT = 'istrelkov829@gmail.com';

export default function PaymentMethod() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const premium = usePremium();
  const [busy, setBusy] = useState(false);

  const until = state.premiumUntil ?? 0;
  const lifetime = until > Date.now() + 40 * 365 * 86400_000;
  const dateStr = new Date(until).toLocaleDateString(ru ? 'ru-RU' : 'en-US');
  // Реальная привязанная карта (для автопродления). Образцов больше не показываем.
  // Привязанный способ автопродления — карта (с last4) или СБП/SberPay (только тип).
  const bound = (state.boundCard && state.boundCard.type) ? state.boundCard : null;
  const hasCard = !!(bound && bound.last4);

  function confirmUnbind() {
    Haptics.selectionAsync();
    Alert.alert(
      hasCard ? (ru ? 'Отвязать карту?' : 'Remove card?') : (ru ? 'Отвязать способ оплаты?' : 'Remove payment method?'),
      ru ? 'Автопродление больше не будет списывать. Доступ сохранится до конца оплаченного периода.'
         : 'Auto-renewal will stop charging. Access stays until the paid period ends.',
      [
        { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: ru ? 'Отвязать' : 'Remove', style: 'destructive', onPress: doUnbind },
      ],
    );
  }

  async function doUnbind() {
    setBusy(true);
    try { await unbindCard(); } catch {}
    await update((s) => ({ ...s, boundCard: null }));
    setBusy(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(ru ? 'Карта отвязана' : 'Card removed',
      ru ? 'Автосписаний по этой карте больше не будет.' : 'No more automatic charges on this card.');
  }

  async function requestRefund() {
    Haptics.selectionAsync();
    const id = await getDeviceId().catch(() => '');
    const subject = encodeURIComponent(ru ? 'Бриз — запрос на возврат' : 'Breeze — refund request');
    const body = encodeURIComponent(
      (ru
        ? 'Здравствуйте! Прошу рассмотреть возврат за подписку Премиум.\n\nПричина: \n'
        : 'Hi! Please consider a refund for my Premium subscription.\n\nReason: \n') + `\nID: ${id}`,
    );
    Linking.openURL(`mailto:${SUPPORT}?subject=${subject}&body=${body}`);
  }

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
            {ru ? 'Подписка' : 'Subscription'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            {ru ? 'Статус, способ оплаты и возврат — всё здесь.'
                : 'Status, payment method and refunds — all here.'}
          </Text>
        </View>

        {/* Статус подписки */}
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
              {premium ? (ru ? 'Премиум активен' : 'Premium active') : (ru ? 'Подписка не активна' : 'No active subscription')}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>
              {premium
                ? lifetime ? (ru ? 'Доступ навсегда' : 'Lifetime access') : (ru ? `Активен до ${dateStr}` : `Active until ${dateStr}`)
                : (ru ? 'Оформи Премиум, чтобы открыть всё' : 'Get Premium to unlock everything')}
            </Text>
          </View>
        </View>

        {!premium && (
          <Pressable onPress={() => router.push('/paywall' as any)}
            style={{ padding: 16, borderRadius: radius.lg, alignItems: 'center', backgroundColor: t.accent }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{ru ? 'Открыть Премиум' : 'Get Premium'}</Text>
          </Pressable>
        )}

        {/* Привязанный способ автопродления — карта или СБП/SberPay */}
        {bound && (
          <>
            <View style={{
              padding: 16, borderRadius: radius.lg, backgroundColor: t.card,
              borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 14,
            }}>
              <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.wallet size={24} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
                  {bound.type}{bound.last4 ? ` •••• ${bound.last4}` : ''}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>
                  {ru ? 'Привязана для автопродления' : 'Saved for auto-renewal'}
                </Text>
              </View>
            </View>

            <Pressable onPress={confirmUnbind} disabled={busy}
              style={{
                padding: 16, borderRadius: radius.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
                backgroundColor: t.danger + '14', borderWidth: 1, borderColor: t.danger + '55',
              }}>
              {busy && <ActivityIndicator color={t.danger} />}
              <Icon.cross size={18} color={t.danger} />
              <Text style={{ color: t.danger, fontSize: 16, fontWeight: '700' }}>
                {hasCard ? (ru ? 'Отвязать карту' : 'Remove card') : (ru ? 'Отвязать способ оплаты' : 'Remove payment method')}
              </Text>
            </Pressable>
          </>
        )}

        {/* Премиум есть, но способ не привязан (разовая оплата за период) */}
        {premium && !bound && !lifetime && (
          <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
              {ru ? 'Оплата разовая за период — карта не привязана, автосписаний нет.'
                  : 'One-time payment for the period — no card saved, no automatic charges.'}
            </Text>
          </View>
        )}

        {/* Запрос возврата — письмом на поддержку (вручную) */}
        {premium && (
          <Pressable onPress={requestRefund}
            style={{
              padding: 16, borderRadius: radius.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
              backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
            }}>
            <Icon.feather size={18} color={t.textDim} />
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
              {ru ? 'Запросить возврат' : 'Request a refund'}
            </Text>
          </Pressable>
        )}

        <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18, paddingHorizontal: 2 }}>
          {ru
            ? `Отмена подписки не возвращает деньги за уже оплаченный период — доступ просто сохранится до его конца. Возврат рассматривается по запросу на ${SUPPORT} в соответствии с законом. Если возврат одобрят — Премиум отключится автоматически.`
            : `Cancelling does not refund the already-paid period — access simply stays until it ends. Refunds are reviewed on request at ${SUPPORT} as required by law. If a refund is approved, Premium turns off automatically.`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
