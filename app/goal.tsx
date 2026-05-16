import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';

const SUGGESTIONS_RU = [
  { label: 'AirPods Pro', amount: 24990 },
  { label: 'Велосипед', amount: 35000 },
  { label: 'Отпуск на море', amount: 80000 },
  { label: 'Курс по новой профессии', amount: 50000 },
  { label: 'Подарок маме', amount: 15000 },
  { label: 'iPhone', amount: 89990 },
];
const SUGGESTIONS_EN = [
  { label: 'AirPods Pro', amount: 249 },
  { label: 'Bicycle', amount: 400 },
  { label: 'Beach vacation', amount: 1200 },
  { label: 'Online course', amount: 500 },
  { label: 'Gift for mom', amount: 200 },
  { label: 'iPhone', amount: 999 },
];

export default function Goal() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const lang = currentLang();
  const p = state.profile;
  const [label, setLabel] = useState(p?.goalLabel ?? '');
  const [amount, setAmount] = useState(p?.goalAmount ? String(p.goalAmount) : '');
  const [committed, setCommitted] = useState(p?.committedAmount ? String(p.committedAmount) : '');
  const [partner, setPartner] = useState(p?.contractPartner ?? '');

  if (!p) return null;
  const suggestions = lang === 'ru' ? SUGGESTIONS_RU : SUGGESTIONS_EN;

  async function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      profile: s.profile ? {
        ...s.profile,
        goalLabel: label.trim(),
        goalAmount: Number(amount) || undefined,
        committedAmount: Number(committed) || undefined,
        contractPartner: partner.trim() || undefined,
      } : s.profile,
    }));
    router.back();
  }

  async function shareContract() {
    if (!partner.trim() || !committed) return;
    Haptics.selectionAsync();
    const msg = lang === 'ru'
      ? `${partner}, я бросаю курить. Если сорвусь — отдаю тебе ${committed} ${p!.currency}. Если продержусь — потрачу на «${label || 'свою цель'}». Подержи меня в этом.`
      : `${partner}, I'm quitting smoking. If I slip, you get ${committed} ${p!.currency}. If I make it, I spend it on "${label || 'my goal'}". Hold me to this.`;
    try { await Share.share({ message: msg }); } catch {}
  }

  async function clearGoal() {
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, goalLabel: undefined, goalAmount: undefined } : s.profile,
    }));
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: t.accent, fontSize: 17 }}>{tr('common.cancel')}</Text>
          </Pressable>
          {p.goalAmount && (
            <Pressable onPress={clearGoal} hitSlop={12}>
              <Text style={{ color: t.danger, fontSize: 15 }}>{lang === 'ru' ? 'Удалить' : 'Remove'}</Text>
            </Pressable>
          )}
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
          <LinearGradient colors={['#30D15838', '#30D15808']}
            style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.sparkle size={52} color="#30D158" />
          </LinearGradient>

          <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
            {lang === 'ru' ? 'Поставь цель' : 'Set a goal'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 22 }}>
            {lang === 'ru'
              ? 'На что потратишь сэкономленные деньги? Видеть конкретную вещь — мощнее абстрактной «экономии».'
              : 'Where will the saved money go? A concrete reward beats abstract savings.'}
          </Text>

          <View style={{ gap: 6 }}>
            <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {lang === 'ru' ? 'Что хочу' : 'What I want'}
            </Text>
            <TextInput
              value={label} onChangeText={setLabel}
              placeholder={lang === 'ru' ? 'AirPods, велосипед, отпуск...' : 'AirPods, bicycle, vacation...'}
              placeholderTextColor={t.textDim}
              style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, fontSize: 16 }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {lang === 'ru' ? `Сколько стоит (${p.currency})` : `Price (${p.currency})`}
            </Text>
            <TextInput
              value={amount} onChangeText={setAmount} keyboardType="number-pad"
              placeholder="0" placeholderTextColor={t.textDim}
              style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, fontSize: 22, fontWeight: '700' }}
            />
          </View>

          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>
            {lang === 'ru' ? 'Идеи' : 'Ideas'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {suggestions.map((s) => (
              <Pressable key={s.label} onPress={() => { Haptics.selectionAsync(); setLabel(s.label); setAmount(String(s.amount)); }}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.text, fontSize: 13 }}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Active deposit contract */}
          <View style={{ marginTop: 18, padding: 16, borderRadius: radius.lg, backgroundColor: '#0A84FF14', borderWidth: 1, borderColor: '#0A84FF40', gap: 10 }}>
            <Text style={{ color: '#0A84FF', fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
              {lang === 'ru' ? 'Депозит-контракт (по желанию)' : 'Deposit contract (optional)'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
              {lang === 'ru'
                ? 'Cochrane 2025: финансовые стимулы повышают шанс бросить в 1,5 раза. Скажи близкому: «если сорвусь — отдаю эти деньги». Это работает.'
                : 'Cochrane 2025: financial incentives raise quit odds ×1.5. Tell someone close: "if I slip, this money is yours". It works.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.textDim, fontSize: 11, marginBottom: 4 }}>
                  {lang === 'ru' ? `Сумма (${p.currency})` : `Amount (${p.currency})`}
                </Text>
                <TextInput value={committed} onChangeText={setCommitted} keyboardType="number-pad" placeholder="0" placeholderTextColor={t.textDim}
                  style={{ backgroundColor: t.bgElev, color: t.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 16, fontWeight: '700' }} />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={{ color: t.textDim, fontSize: 11, marginBottom: 4 }}>
                  {lang === 'ru' ? 'Партнёр' : 'Partner'}
                </Text>
                <TextInput value={partner} onChangeText={setPartner} placeholder={lang === 'ru' ? 'Имя' : 'Name'} placeholderTextColor={t.textDim}
                  style={{ backgroundColor: t.bgElev, color: t.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 14 }} />
              </View>
            </View>
            <Pressable onPress={shareContract} disabled={!partner.trim() || !committed}
              style={{ padding: 12, borderRadius: 10, backgroundColor: partner.trim() && committed ? '#0A84FF' : t.border, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {lang === 'ru' ? 'Отправить контракт партнёру' : 'Send contract to partner'}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={save} disabled={!label.trim() || !Number(amount)}
            style={{ marginTop: 12, padding: 18, borderRadius: radius.xl, backgroundColor: label.trim() && Number(amount) ? '#30D158' : t.border, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{tr('common.save')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
