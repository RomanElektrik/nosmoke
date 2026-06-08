// "What helps me" — the user picks fast craving-busters that suit them. Saved
// to profile.copingMethods and surfaced in the SOS screen so the help is
// personal, not generic. Reachable from onboarding and from SOS.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';
import { COPING_METHODS, CUSTOM_PREFIX } from '../lib/coping';

export default function Coping() {
  const t = useTheme();
  const router = useRouter();
  const [state] = useAppState();
  const ru = (state.profile?.language ?? 'ru') === 'ru';
  const MAX = 2;
  const [picked, setPicked] = useState<string[]>((state.profile?.copingMethods ?? []).slice(0, MAX));
  const [draft, setDraft] = useState('');
  const [warn, setWarn] = useState(false);
  const customs = picked.filter((id) => id.startsWith(CUSTOM_PREFIX));
  const full = picked.length >= MAX;

  function flashLimit() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setWarn(true);
    setTimeout(() => setWarn(false), 2200);
  }

  function toggle(id: string) {
    if (picked.includes(id)) { Haptics.selectionAsync(); setPicked((p) => p.filter((x) => x !== id)); return; }
    if (full) { flashLimit(); return; }
    Haptics.selectionAsync();
    setPicked((p) => [...p, id]);
  }

  function addCustom() {
    const text = draft.trim();
    if (!text) return;
    if (full) { flashLimit(); return; }
    Haptics.selectionAsync();
    setPicked((p) => [...p, CUSTOM_PREFIX + text]);
    setDraft('');
  }

  async function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({ ...s, profile: s.profile ? { ...s.profile, copingMethods: picked } : s.profile }));
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>
              {ru ? 'Что тебе помогает?' : 'What helps you?'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21, marginTop: 6 }}>
              {ru
                ? 'Выбери максимум 2 приёма. В момент тяги меньше выбора = быстрее действуешь, а не зависаешь над списком. Покажем их в SOS.'
                : 'Pick at most 2. In a craving, fewer options = you act faster instead of freezing over a list. Shown in SOS.'}
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={16} color={t.textDim} />
          </Pressable>
        </View>

        {/* Selection counter / limit warning */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md,
          backgroundColor: warn ? t.warn + '1F' : t.bgElev, borderWidth: 1, borderColor: warn ? t.warn : t.border }}>
          <Text style={{ fontSize: 15 }}>{warn ? '✋' : '✓'}</Text>
          <Text style={{ color: warn ? t.warn : t.textDim, fontSize: 13.5, fontWeight: '600', flex: 1 }}>
            {warn
              ? (ru ? 'Максимум 2 — иначе в тяге теряешься. Сними один, чтобы выбрать другой.' : 'Max 2 — more dilutes focus. Remove one to pick another.')
              : (ru ? `Выбрано ${picked.length} из 2` : `${picked.length} of 2 picked`)}
          </Text>
        </View>

        <View style={{ gap: 10, marginTop: 4 }}>
          {/* Add your own — at the top */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={draft} onChangeText={setDraft}
              placeholder={ru ? 'Свой приём…' : 'Your own move…'} placeholderTextColor={t.textDim}
              onSubmitEditing={addCustom} returnKeyType="done"
              style={{ flex: 1, backgroundColor: t.bgElev, color: t.text, paddingHorizontal: 14, paddingVertical: 13, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, fontSize: 15 }}
            />
            <Pressable onPress={addCustom} disabled={!draft.trim()}
              style={({ pressed }) => ({ width: 52, borderRadius: radius.lg, backgroundColor: draft.trim() && !full ? t.accent : t.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>+</Text>
            </Pressable>
          </View>

          {/* User's own custom methods */}
          {customs.map((id) => (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, backgroundColor: '#0A84FF1A', borderWidth: 1.5, borderColor: '#0A84FF' }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#0A84FF24', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.check size={24} color="#0A84FF" />
              </View>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', flex: 1 }}>{id.slice(CUSTOM_PREFIX.length)}</Text>
              <Pressable onPress={() => toggle(id)} hitSlop={10} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
                <Icon.close size={14} color={t.textDim} />
              </Pressable>
            </View>
          ))}

          {COPING_METHODS.map((m) => {
            const on = picked.includes(m.id);
            const dim = !on && full;
            const I = Icon[m.icon];
            return (
              <Pressable key={m.id} onPress={() => toggle(m.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg,
                  backgroundColor: on ? m.color + '1A' : t.bgElev,
                  borderWidth: 1.5, borderColor: on ? m.color : t.border,
                  opacity: pressed ? 0.85 : dim ? 0.4 : 1,
                })}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: m.color + '24', alignItems: 'center', justifyContent: 'center' }}>
                  <I size={24} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{ru ? m.ru : m.en}</Text>
                  <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>{ru ? m.hintRu : m.hintEn}</Text>
                </View>
                <View style={{
                  width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: on ? m.color : 'transparent', borderWidth: on ? 0 : 1.5, borderColor: t.border,
                }}>
                  {on && <Icon.check size={16} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingTop: 12, backgroundColor: t.bg, borderTopWidth: 1, borderTopColor: t.border }}>
        <Pressable onPress={save}
          style={({ pressed }) => ({ padding: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center', opacity: pressed ? 0.9 : 1 })}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {picked.length > 0
              ? (ru ? `Сохранить · выбрано ${picked.length}` : `Save · ${picked.length} picked`)
              : (ru ? 'Пропустить' : 'Skip')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
