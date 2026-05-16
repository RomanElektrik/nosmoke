import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, Switch, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, setLanguage, currentLang } from '../../lib/i18n';
import { reset, update, useAppState } from '../../lib/storage';
import { GlassCard } from '../../components/GlassCard';
import { getStep } from '../../lib/stepped';
import { Icon } from '../../components/Icon';
import { SwipeToHome } from '../../components/SwipeToHome';
import { scheduleDailyCheckIn } from '../../lib/notifications';
import { secondsClean } from '../../lib/health';
import { moneySaved, cigsAvoided, formatMoney } from '../../lib/money';
import { usePremium } from '../../lib/subscription';

export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const lang = currentLang();
  const p = state.profile;
  if (!p) return null;
  const secs = secondsClean(p.quitDate);

  return (
    <SwipeToHome>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 80 }}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.8, marginVertical: 8 }}>
          {tr('profile.title')}
        </Text>

        <GlassCard>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {tr('profile.stats')}
          </Text>
          <Text style={{ color: t.text, marginTop: 8, fontSize: 15 }}>
            {tr('profile.since', { date: new Date(p.quitDate).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US') })}
          </Text>
          <Text style={{ color: t.text, marginTop: 6, fontSize: 15 }}>
            {Math.floor(cigsAvoided(p, secs))} · {formatMoney(moneySaved(p, secs), p.currency, lang === 'ru' ? 'ru-RU' : 'en-US')}
          </Text>
        </GlassCard>

        <PremiumCard />

        <HabitCard />

        <MethodCard />

        <CheckInTimeCard />

        <QuickActionsCard />

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

        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{tr('profile.faith')}</Text>
            <Switch
              value={p.faithEnabled}
              onValueChange={(v) => update((s) => ({ ...s, profile: s.profile ? { ...s.profile, faithEnabled: v } : s.profile }))}
              trackColor={{ true: t.accent, false: t.border }}
            />
          </View>
          {p.faithEnabled && (
            <Pressable onPress={() => router.push('/faith')}
              style={{ marginTop: 10, padding: 12, borderRadius: radius.md, backgroundColor: t.accentSoft }}>
              <Text style={{ color: t.accent, fontWeight: '600' }}>→ {tr('faith.title')}</Text>
            </Pressable>
          )}
        </GlassCard>

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
  const premium = usePremium();
  if (premium) {
    return (
      <GlassCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon.crown size={22} color={t.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
              {lang === 'ru' ? 'Premium активен' : 'Premium active'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {lang === 'ru' ? 'Спасибо за поддержку. Все функции открыты.' : 'Thank you. All features unlocked.'}
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  }
  return (
    <Pressable onPress={() => router.push('/paywall' as any)}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.accent + '14', borderWidth: 1, borderColor: t.accent + '50',
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accent + '28', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.crown size={24} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>NoSmokeUp Premium</Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
            {lang === 'ru' ? 'Безлимитный ИИ, вся программа и аналитика' : 'Unlimited AI, full program and analytics'}
          </Text>
        </View>
        <Text style={{ color: t.accent, fontSize: 20 }}>›</Text>
      </View>
    </Pressable>
  );
}

function CheckInTimeCard() {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const p = state.profile;
  if (!p) return null;
  const cur = p.checkInHour ?? 21;
  const presets = [9, 12, 18, 20, 21, 22];

  async function setHour(h: number) {
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, checkInHour: h } : s.profile,
    }));
    await scheduleDailyCheckIn(lang, h);
  }

  return (
    <GlassCard>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>
        {lang === 'ru' ? 'Время чек-ина' : 'Check-in time'}
      </Text>
      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4 }}>
        {lang === 'ru' ? 'Когда мы тебя спросим: «Курил сегодня?»' : 'When we ask: "Did you smoke today?"'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {presets.map((h) => {
          const sel = cur === h;
          return (
            <Pressable key={h} onPress={() => setHour(h)}
              style={{
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                backgroundColor: sel ? t.accent : t.bgElev,
                borderWidth: 1, borderColor: sel ? t.accent : t.border,
              }}>
              <Text style={{ color: sel ? '#fff' : t.text, fontWeight: '700' }}>
                {String(h).padStart(2, '0')}:00
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

function QuickActionsCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const items = [
    { ru: 'Перетестировать зависимость',  en: 'Retake dependence test', href: '/practice/fagerstrom', icon: Icon.flask, color: '#0A84FF' },
    { ru: 'Журнал тяги',                  en: 'Craving journal',         href: '/journal',             icon: Icon.brush, color: '#FF9F0A' },
    { ru: 'Цель и копилка',               en: 'Goal & jar',              href: '/goal',                icon: Icon.target, color: '#30D158' },
    { ru: '8-недельный курс',             en: '8-week course',           href: '/program',             icon: Icon.toolbox, color: '#BF5AF2' },
  ];
  return (
    <GlassCard>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
        {lang === 'ru' ? 'Быстрые действия' : 'Quick actions'}
      </Text>
      <View style={{ gap: 6 }}>
        {items.map((it) => {
          const I = it.icon;
          return (
            <Pressable key={it.href} onPress={() => router.push(it.href as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: it.color + '24', alignItems: 'center', justifyContent: 'center' }}>
                <I size={18} color={it.color} />
              </View>
              <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{lang === 'ru' ? it.ru : it.en}</Text>
              <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
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
        {lang === 'ru' ? 'Моя привычка' : 'My habit'}
      </Text>
      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4 }}>
        {lang === 'ru' ? 'От этих чисел считаются «сэкономлено» и «не выкурено»' : 'Stats are calculated from these numbers'}
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

function AiKeyCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const p = state.profile;
  const [key, setKey] = useState(p?.openrouterKey ?? '');
  const [model, setModel] = useState(p?.openrouterModel ?? 'anthropic/claude-sonnet-4.5');
  const [savedAt, setSavedAt] = useState(0);

  if (!p) return null;

  async function save() {
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, openrouterKey: key.trim() || undefined, openrouterModel: model.trim() || undefined } : s.profile,
    }));
    setSavedAt(Date.now());
  }
  async function clear() {
    setKey('');
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, openrouterKey: undefined } : s.profile,
    }));
  }

  return (
    <GlassCard>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{tr('profile.ai_section')}</Text>
      <Text style={{ color: t.textDim, fontSize: 13, marginTop: 6, lineHeight: 18 }}>{tr('profile.ai_help')}</Text>
      <Pressable onPress={() => Linking.openURL('https://openrouter.ai/keys')} style={{ marginTop: 6 }}>
        <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>openrouter.ai/keys →</Text>
      </Pressable>

      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 14, marginBottom: 6 }}>{tr('profile.ai_key_label')}</Text>
      <TextInput
        value={key} onChangeText={setKey} autoCapitalize="none" autoCorrect={false}
        placeholder={tr('profile.ai_key_ph')} placeholderTextColor={t.textDim}
        secureTextEntry
        style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.border, fontSize: 14 }}
      />

      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 12, marginBottom: 6 }}>{tr('profile.ai_model_label')}</Text>
      <TextInput
        value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false}
        placeholder="anthropic/claude-sonnet-4.5" placeholderTextColor={t.textDim}
        style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.border, fontSize: 14 }}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pressable onPress={save} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {savedAt && Date.now() - savedAt < 2000 ? tr('profile.ai_saved') : tr('profile.ai_save')}
          </Text>
        </Pressable>
        {p.openrouterKey && (
          <Pressable onPress={clear} style={{ padding: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.textDim, fontWeight: '600' }}>{tr('profile.ai_clear')}</Text>
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}
