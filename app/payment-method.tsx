// Способ оплаты — привязанная карта для автопродления и её отвязка.
// Требование ЮKassa для подключения рекуррентных платежей: пользователь должен
// иметь возможность сам отвязать карту, без обращения в поддержку.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { update, useAppState } from '../lib/storage';
import { Icon } from '../components/Icon';
import { unbindCard } from '../lib/billing';

// До первой реальной привязки карты (рекуррент у магазина включается) показываем
// карту-образец, чтобы сценарий отвязки был виден. Реальная карта её заменит.
const DEMO = { type: 'МИР', last4: '4321' };

export default function PaymentMethod() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const [busy, setBusy] = useState(false);

  // undefined → ещё не отвязывал (показываем образец); {..} → реальная карта; null → отвязана.
  const card = state.boundCard === null ? null : (state.boundCard ?? DEMO);

  function confirmUnbind() {
    Haptics.selectionAsync();
    Alert.alert(
      ru ? 'Отвязать карту?' : 'Remove card?',
      ru ? 'Автопродление больше не будет списывать с этой карты. Текущая подписка продолжит действовать до конца оплаченного периода.'
         : 'Auto-renewal will no longer charge this card. Your current subscription stays active until the paid period ends.',
      [
        { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: ru ? 'Отвязать' : 'Remove', style: 'destructive', onPress: doUnbind },
      ],
    );
  }

  async function doUnbind() {
    setBusy(true);
    try {
      await unbindCard();
    } catch {}
    await update((s) => ({ ...s, boundCard: null }));
    setBusy(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(ru ? 'Карта отвязана' : 'Card removed',
      ru ? 'Автосписаний по этой карте больше не будет.' : 'No more automatic charges on this card.');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18 }}>
        <View>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 }}>
            {ru ? 'Способ оплаты' : 'Payment method'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            {ru
              ? 'Карта, с которой продлевается подписка. Можешь отвязать её в любой момент — списаний больше не будет.'
              : 'The card your subscription renews from. You can remove it any time — no more charges.'}
          </Text>
        </View>

        {card ? (
          <>
            {/* Привязанная карта */}
            <View style={{
              padding: 16, borderRadius: radius.lg, backgroundColor: t.card,
              borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 14,
            }}>
              <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.wallet size={24} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
                  {card.type} •••• {card.last4}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }}>
                  {ru ? 'Привязана для автопродления' : 'Saved for auto-renewal'}
                </Text>
              </View>
            </View>

            {/* Отвязать */}
            <Pressable onPress={confirmUnbind} disabled={busy}
              style={{
                padding: 16, borderRadius: radius.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
                backgroundColor: t.danger + '14', borderWidth: 1, borderColor: t.danger + '55',
              }}>
              {busy && <ActivityIndicator color={t.danger} />}
              <Icon.cross size={18} color={t.danger} />
              <Text style={{ color: t.danger, fontSize: 16, fontWeight: '700' }}>
                {ru ? 'Отвязать карту' : 'Remove card'}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, alignItems: 'center', gap: 8 }}>
            <Icon.wallet size={30} color={t.textDim} />
            <Text style={{ color: t.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              {ru
                ? 'Карта не привязана. Она появится здесь после оплаты с автопродлением — и её можно будет отвязать.'
                : 'No card saved. It will appear here after a payment with auto-renewal — and you can remove it.'}
            </Text>
          </View>
        )}

        <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18, paddingHorizontal: 2 }}>
          {ru
            ? 'Отвязка карты не отменяет уже оплаченный период — доступ сохранится до его конца. Вопрос по возврату — напиши в поддержку: istrelkov829@gmail.com.'
            : 'Removing the card does not cancel the already-paid period — access remains until it ends. Refund questions: istrelkov829@gmail.com.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
