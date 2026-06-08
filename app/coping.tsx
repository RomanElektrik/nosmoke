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
  const [picked, setPicked] = useState<string[]>(state.profile?.copingMethods ?? []);
  const [draft, setDraft] = useState('');
  const customs = picked.filter((id) => id.startsWith(CUSTOM_PREFIX));

  function toggle(id: string) {
    Haptics.selectionAsync();
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function addCustom() {
    const text = draft.trim();
    if (!text) return;
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
                ? 'Когда тянет — эти быстрые приёмы сбивают тягу за пару минут. Отметь те, что подходят тебе — покажем их на экране SOS.'
                : 'When the urge hits, these quick moves cut it in a couple of minutes. Pick the ones that fit — we\'ll show them on the SOS screen.'}
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={16} color={t.textDim} />
          </Pressable>
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
              style={({ pressed }) => ({ width: 52, borderRadius: radius.lg, backgroundColor: draft.trim() ? t.accent : t.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
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
            const I = Icon[m.icon];
            return (
              <Pressable key={m.id} onPress={() => toggle(m.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg,
                  backgroundColor: on ? m.color + '1A' : t.bgElev,
                  borderWidth: 1.5, borderColor: on ? m.color : t.border,
                  opacity: pressed ? 0.85 : 1,
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
