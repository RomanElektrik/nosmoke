import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, TextInput, Linking } from 'react-native';
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

  function manage() {
    Alert.alert(
      ru ? 'Подписка Премиум' : 'Premium subscription',
      (lifetime ? (ru ? 'Доступ навсегда.' : 'Lifetime access.') : (ru ? `Активна до ${dateStr}.` : `Active until ${dateStr}.`)) + '\n\n' +
      (ru
        ? 'Это разовая оплата за период — автосписаний нет, отдельно отменять ничего не нужно. По окончании доступ просто не продлевается. Вопрос по возврату — напиши нам.'
        : 'This is a one-time payment for the period — no auto-charges, nothing to cancel. After it ends, access simply stops. Refund questions — contact us.'),
      [
        { text: ru ? 'Закрыть' : 'Close' },
        { text: ru ? 'Написать в поддержку' : 'Contact support', onPress: () => Linking.openURL('mailto:istrelkov829@gmail.com?subject=Бриз%20—%20подписка') },
      ],
    );
  }

  const sub = premium
    ? (lifetime ? (ru ? 'Доступ навсегда · управление' : 'Lifetime · manage')
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
            {premium ? (ru ? 'Премиум активен' : 'Premium active') : (ru ? 'Открой Премиум' : 'Unlock Premium')}
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
