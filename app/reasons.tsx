// "Why I'm quitting" board — each reason has its own emoji, colour and an
// optional photo. Stored as Reason objects (legacy strings auto-migrated).
// Shown in SOS and on the Progress tab.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useAppState, update, normalizeReasons, type Reason } from '../lib/storage';
import { Icon } from '../components/Icon';
import { pickPhoto } from '../lib/media';

const EMOJIS = ['❤️', '👨‍👩‍👧', '🫁', '💪', '🏃', '💰', '🧒', '👶', '🐶', '🌅', '🎯', '🧠', '🏡', '😤'];
const COLORS = ['#FF453A', '#30D158', '#0A84FF', '#FF9F0A', '#BF5AF2', '#5AC8FA', '#FF2D78', '#5E5CE6'];

export default function Reasons() {
  const t = useTheme();
  const router = useRouter();
  const [state] = useAppState();
  const ru = (state.profile?.language ?? 'ru') === 'ru';
  const seed = normalizeReasons(state.profile?.reasons ?? (state.profile?.whyQuit ? [state.profile.whyQuit] : []));
  const [list, setList] = useState<Reason[]>(seed);

  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [photo, setPhoto] = useState<string | undefined>();

  async function choosePhoto() {
    const uri = await pickPhoto();
    if (uri) { Haptics.selectionAsync(); setPhoto(uri); }
  }
  function add() {
    const tx = text.trim();
    if (!tx) return;
    Haptics.selectionAsync();
    setList((l) => [...l, { text: tx, emoji, color, photo }]);
    setText(''); setPhoto(undefined);
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
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: 14 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>{ru ? 'Почему я бросаю' : 'Why I\'m quitting'}</Text>
            <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21, marginTop: 6 }}>
              {ru ? 'Твои причины — с фото и значком. В момент тяги мы их покажем.' : 'Your reasons — with a photo and icon. We show them in a craving.'}
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={16} color={t.textDim} />
          </Pressable>
        </View>

        {/* Compose new reason */}
        <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 12 }}>
          {/* emoji row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => { Haptics.selectionAsync(); setEmoji(e); setPhoto(undefined); }}
                style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: (!photo && e === emoji) ? color + '24' : t.card, borderWidth: 1.5, borderColor: (!photo && e === emoji) ? color : t.border }}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* color row + photo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {COLORS.map((c) => (
              <Pressable key={c} onPress={() => { Haptics.selectionAsync(); setColor(c); }}
                style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff' }} />
            ))}
            <Pressable onPress={choosePhoto} hitSlop={6} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 15, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: 14 }}>📷</Text>}
            </Pressable>
          </View>
          {/* text + add */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput value={text} onChangeText={setText} placeholder={ru ? 'Например: видеть, как растут дети' : 'e.g. watch my kids grow'} placeholderTextColor={t.textDim}
              onSubmitEditing={add} returnKeyType="done"
              style={{ flex: 1, backgroundColor: t.card, color: t.text, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, fontSize: 15 }} />
            <Pressable onPress={add} disabled={!text.trim()}
              style={({ pressed }) => ({ width: 50, borderRadius: radius.md, backgroundColor: text.trim() ? color : t.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginTop: -2 }}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Existing reasons */}
        {list.map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: (r.color ?? t.accent) + '14', borderWidth: 1, borderColor: (r.color ?? t.accent) + '3A' }}>
            {r.photo
              ? <Image source={{ uri: r.photo }} style={{ width: 46, height: 46, borderRadius: 14 }} />
              : <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: (r.color ?? t.accent) + '26', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24 }}>{r.emoji ?? '❤️'}</Text></View>}
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 22 }}>{r.text}</Text>
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
