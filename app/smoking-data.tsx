// «Мои данные о курении» — единственное место, где после онбординга можно
// поправить сигареты/день, цену и размер пачки, валюту.
//
// ЗАЧЕМ: раньше эти четыре числа писались ровно один раз, в квизе, и больше
// нигде. Кто протапал дефолты (15 шт, 220 ₽), а курит 25 по 350 — видел
// неверную экономию ВЕЧНО: копилка, цель, пейвол и ИИ-коуч цитировали цифры,
// которых нет. Опечатка в цене — то же самое. Единственным выходом было
// «Сбросить все данные», то есть потерять весь стаж отказа.
import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { GlassCard } from '../components/GlassCard';
import { moneySaved, formatMoney, pricePerCig } from '../lib/money';
import { secondsClean } from '../lib/health';
import { abstinenceStartMs } from '../lib/stepped';

// Свободный ввод валюты ломал форматирование денег во всём приложении:
// Intl.NumberFormat падал на «руб» и уходил в фолбэк без разделения разрядов.
const CURRENCIES = ['RUB', 'USD', 'EUR', 'KZT', 'BYN', 'UAH'] as const;

export default function SmokingData() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const p = state.profile;

  const [perDay, setPerDay] = useState(String(p?.cigsPerDay ?? 15));
  const [price, setPrice] = useState(String(p?.packPrice ?? 220));
  const [packSize, setPackSize] = useState(String(p?.cigsInPack ?? 20));
  const [currency, setCurrency] = useState(p?.currency ?? 'RUB');
  const [saved, setSaved] = useState(false);

  if (!p) return null;

  const nPerDay = Number(perDay);
  const nPrice = Number(price);
  const nPack = Number(packSize);
  const valid = nPerDay > 0 && nPrice > 0 && nPack > 0;

  // Живой пересчёт: человек видит, что изменится, ДО сохранения.
  const preview = valid
    ? moneySaved({ cigsPerDay: nPerDay, packPrice: nPrice, cigsInPack: nPack },
        Math.max(0, secondsClean(abstinenceStartMs(p))))
    : 0;
  const current = moneySaved(p, Math.max(0, secondsClean(abstinenceStartMs(p))));

  async function save() {
    if (!valid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      profile: s.profile ? {
        ...s.profile,
        cigsPerDay: nPerDay,
        packPrice: nPrice,
        cigsInPack: nPack,
        currency,
      } : s.profile,
    }));
    setSaved(true);
    setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)), 450);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any))} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 }}>
          {ru ? 'Мои данные о курении' : 'My smoking data'}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {ru ? 'От этих цифр считается вся экономия и «не выкурено». Поправь, если они неточные — прогресс и стаж не сбросятся.'
              : 'All your savings and «avoided» numbers come from these. Fix them if they are off — your streak and progress stay.'}
        </Text>

        <GlassCard>
          <Field label={ru ? 'Сигарет в день' : 'Cigarettes per day'} value={perDay} onChange={setPerDay} bad={!(nPerDay > 0)} />
          <Field label={ru ? 'Цена пачки' : 'Pack price'} value={price} onChange={setPrice} bad={!(nPrice > 0)} />
          <Field label={ru ? 'Сигарет в пачке' : 'Cigarettes in a pack'} value={packSize} onChange={setPackSize} bad={!(nPack > 0)} />

          <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 }}>
            {ru ? 'Валюта' : 'Currency'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CURRENCIES.map((c) => (
              <Pressable key={c} onPress={() => { Haptics.selectionAsync(); setCurrency(c); }}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: currency === c ? t.accentSoft : t.border,
                }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 13.5 }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {valid && (
          <GlassCard>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {ru ? 'Сэкономлено станет' : 'Saved becomes'}
            </Text>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '900', letterSpacing: -1, marginTop: 4 }}>
              {formatMoney(Math.round(preview), currency, ru ? 'ru-RU' : 'en-US')}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 13, marginTop: 4 }}>
              {ru ? `сейчас ${formatMoney(Math.round(current), p.currency, 'ru-RU')} · ${formatMoney(Math.round(pricePerCig({ packPrice: nPrice, cigsInPack: nPack }) * nPerDay), currency, 'ru-RU')} в день`
                  : `now ${formatMoney(Math.round(current), p.currency, 'en-US')} · ${formatMoney(Math.round(pricePerCig({ packPrice: nPrice, cigsInPack: nPack }) * nPerDay), currency, 'en-US')} a day`}
            </Text>
          </GlassCard>
        )}

        <Pressable onPress={save} disabled={!valid}
          style={{ paddingVertical: 17, borderRadius: radius.xl, backgroundColor: valid ? t.accent : t.border, alignItems: 'center', marginTop: 4 }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            {saved ? (ru ? 'Сохранено' : 'Saved') : valid ? (ru ? 'Сохранить' : 'Save') : (ru ? 'Впиши числа' : 'Enter the numbers')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, bad }: { label: string; value: string; onChange: (v: string) => void; bad?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} keyboardType="number-pad"
        style={{
          backgroundColor: t.bgElev, color: t.text, paddingHorizontal: 14, paddingVertical: 13,
          borderRadius: radius.md, borderWidth: 1, borderColor: bad ? t.danger : t.border, fontSize: 16, fontWeight: '600',
        }}
      />
    </View>
  );
}
