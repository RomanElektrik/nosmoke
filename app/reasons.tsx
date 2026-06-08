// "Why I'm quitting" board — personal reasons the user can write and reorder.
// Seeded from onboarding whyQuit on first open. Shown in SOS and on the home
// screen as motivation. Evidence: reconnecting with personal reasons in a
// craving moment measurably helps resistance.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';

export default function Reasons() {
  const t = useTheme();
  const router = useRouter();
  const [state] = useAppState();
  const ru = (state.profile?.language ?? 'ru') === 'ru';
  const seed = state.profile?.reasons ?? (state.profile?.whyQuit ? [state.profile.whyQuit] : []);
  const [list, setList] = useState<string[]>(seed);
  const [draft, setDraft] = useState('');

  function add() {
    const text = draft.trim();
    if (!text) return;
    Haptics.selectionAsync();
    setList((l) => [...l, text]);
    setDraft('');
  }
  function remove(i: number) {
    Haptics.selectionAsync();
    setList((l) => l.filter((_, idx) => idx !== i));
  }
  async function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({ ...s, profile: s.profile ? { ...s.profile, reasons: list } : s.profile }));
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>{ru ? 'Почему я бросаю' : 'Why I\'m quitting'}</Text>
            <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21, marginTop: 6 }}>
              {ru ? 'Твои причины. В момент тяги мы покажем их — чтобы вспомнить, ради чего.' : 'Your reasons. We show them in a craving moment, so you remember what it\'s for.'}
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={16} color={t.textDim} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <TextInput value={draft} onChangeText={setDraft} placeholder={ru ? 'Например: видеть, как растут дети' : 'e.g. to watch my kids grow'} placeholderTextColor={t.textDim}
            onSubmitEditing={add} returnKeyType="done"
            style={{ flex: 1, backgroundColor: t.bgElev, color: t.text, paddingHorizontal: 14, paddingVertical: 13, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, fontSize: 15 }} />
          <Pressable onPress={add} disabled={!draft.trim()}
            style={({ pressed }) => ({ width: 52, borderRadius: radius.lg, backgroundColor: draft.trim() ? t.accent : t.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>+</Text>
          </Pressable>
        </View>

        {list.map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: t.accent + '10', borderWidth: 1, borderColor: t.accent + '33' }}>
            <Icon.heartPulse size={22} color={t.accent} />
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 22 }}>{r}</Text>
            <Pressable onPress={() => remove(i)} hitSlop={10} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
              <Icon.close size={14} color={t.textDim} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingTop: 12, backgroundColor: t.bg, borderTopWidth: 1, borderTopColor: t.border }}>
        <Pressable onPress={save}
          style={({ pressed }) => ({ padding: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center', opacity: pressed ? 0.9 : 1 })}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{ru ? 'Сохранить' : 'Save'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
