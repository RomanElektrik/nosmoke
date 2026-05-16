// Safety gate before activating any medication course.
// Requires the user to review contraindications + confirm a prescription/consult.
import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { update } from '../lib/storage';
import { Icon } from '../components/Icon';
import { MED_SAFETY, type Medication } from '../lib/medication';

export default function MedGate() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const { med } = useLocalSearchParams<{ med: Medication }>();

  const [noContra, setNoContra] = useState(false);
  const [hasRx, setHasRx] = useState(false);

  if (!med || !MED_SAFETY[med]) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ padding: spacing.lg }}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12}>
            <Text style={{ color: t.accent, fontSize: 17 }}>← {lang === 'ru' ? 'Назад' : 'Back'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const info = MED_SAFETY[med];
  const color = med === 'cytisine' ? '#30D158' : med === 'bupropion' ? '#FF9500' : '#0A84FF';
  const name = lang === 'ru' ? info.nameRu : info.nameEn;
  const contra = lang === 'ru' ? info.contraindicationsRu : info.contraindicationsEn;
  const side = lang === 'ru' ? info.sideEffectsRu : info.sideEffectsEn;
  const warning = lang === 'ru' ? info.warningRu : info.warningEn;
  const rxNote = lang === 'ru' ? info.rxNoteRu : info.rxNoteEn;

  const canActivate = noContra && hasRx;

  async function activate() {
    if (!canActivate || !med) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const startMs = Date.now();
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, medication: med, medicationStartedAt: startMs } : s.profile,
    }));
    try {
      const { scheduleMedicationDoses } = await import('../lib/notifications');
      await scheduleMedicationDoses(lang, med, startMs);
    } catch {}
    (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {lang === 'ru' ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 14, paddingBottom: 60 }}>
        <LinearGradient colors={[color + '38', color + '08']}
          style={{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.shield size={32} color={color} />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>
          {lang === 'ru' ? `Перед началом: ${name}` : `Before you start: ${name}`}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21 }}>
          {lang === 'ru'
            ? 'Это не назначение. Приложение помогает вести расписание препарата, который тебе подобрал врач — прочитай и подтверди два пункта.'
            : 'This is not a prescription. The app helps you track a medication chosen by your doctor — please read and confirm two points.'}
        </Text>

        {/* Rx status */}
        <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: (info.rxRequired ? '#FF453A' : '#FF9500') + '14', borderWidth: 1, borderColor: (info.rxRequired ? '#FF453A' : '#FF9500') + '44', gap: 6 }}>
          <Text style={{ color: info.rxRequired ? '#FF453A' : '#FF9500', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {info.rxRequired
              ? (lang === 'ru' ? 'Рецептурный препарат' : 'Prescription medication')
              : (lang === 'ru' ? 'Без рецепта — но с осторожностью' : 'OTC — but use with care')}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>{rxNote}</Text>
        </View>

        {/* Warning */}
        <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: '#FF453A14', borderWidth: 1, borderColor: '#FF453A44', gap: 6 }}>
          <Text style={{ color: '#FF453A', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Важное предупреждение' : 'Important warning'}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>{warning}</Text>
        </View>

        {/* Contraindications */}
        <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8 }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
            {lang === 'ru' ? 'Нельзя принимать, если есть:' : 'Do not take if you have:'}
          </Text>
          {contra.map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: '#FF453A', fontSize: 14 }}>•</Text>
              <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20, flex: 1 }}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Side effects */}
        <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8 }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
            {lang === 'ru' ? 'Возможные побочные эффекты:' : 'Possible side effects:'}
          </Text>
          {side.map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 14 }}>•</Text>
              <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20, flex: 1 }}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Confirmations */}
        <CheckRow t={t} color={color} checked={noContra} onToggle={() => { Haptics.selectionAsync(); setNoContra(!noContra); }}
          label={lang === 'ru'
            ? 'Я прочитал список выше, и ни один из этих пунктов ко мне не относится.'
            : 'I have read the list above and none of these points apply to me.'} />
        <CheckRow t={t} color={color} checked={hasRx} onToggle={() => { Haptics.selectionAsync(); setHasRx(!hasRx); }}
          label={info.rxRequired
            ? (lang === 'ru'
              ? 'У меня есть рецепт от врача именно на этот препарат.'
              : 'I have a doctor’s prescription for this exact medication.')
            : (lang === 'ru'
              ? 'Я проконсультировался с врачом или фармацевтом перед приёмом.'
              : 'I have consulted a doctor or pharmacist before taking it.')} />

        <Pressable onPress={activate} disabled={!canActivate}
          style={{ marginTop: 6, padding: 18, borderRadius: radius.xl, backgroundColor: canActivate ? color : t.border, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            {lang === 'ru' ? 'Начать вести расписание' : 'Start tracking the schedule'}
          </Text>
        </Pressable>

        <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
          {lang === 'ru'
            ? 'Приложение не заменяет врача и не назначает лечение. Все дозировки и сроки определяет только врач.'
            : 'The app does not replace a doctor or prescribe treatment. A doctor decides all doses and duration.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function CheckRow({ t, color, checked, onToggle, label }: any) {
  return (
    <Pressable onPress={onToggle}
      style={{
        flexDirection: 'row', gap: 12, alignItems: 'flex-start',
        padding: 14, borderRadius: radius.lg,
        backgroundColor: checked ? color + '14' : t.bgElev,
        borderWidth: 1, borderColor: checked ? color : t.border,
      }}>
      <View style={{
        width: 24, height: 24, borderRadius: 7, borderWidth: 2, marginTop: 1,
        borderColor: checked ? color : t.border,
        backgroundColor: checked ? color : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Icon.check size={14} color="#fff" />}
      </View>
      <Text style={{ color: t.text, fontSize: 14, lineHeight: 20, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}
