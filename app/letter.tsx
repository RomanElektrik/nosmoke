// «Письмо себе» — a time capsule. Written on a strong, determined day; read on
// a weak one. The SOS screen surfaces it mid-craving — nothing argues with a
// craving better than your own words about why you started.

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';

const C = '#FFD60A';

export default function Letter() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const letter = state.profile?.futureLetter;
  const [editing, setEditing] = useState(!letter);
  const [draft, setDraft] = useState(letter?.text ?? '');

  async function save() {
    const text = draft.trim();
    if (!text) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      profile: s.profile
        ? { ...s.profile, futureLetter: { text, createdAt: s.profile.futureLetter?.createdAt ?? Date.now() } }
        : s.profile,
    }));
    setEditing(false);
  }

  const writtenDate = letter
    ? new Date(letter.createdAt).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={12}
            accessibilityRole="button" accessibilityLabel={ru ? 'Назад' : 'Back'}>
            <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 4, paddingBottom: 40, gap: 16 }}
          keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[C + '38', C + '08']}
            style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.feather size={34} color={C} />
          </LinearGradient>

          {editing ? (
            <>
              <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>
                {ru ? 'Письмо себе' : 'A letter to yourself'}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 22 }}>
                {ru
                  ? 'Напиши из сегодняшнего дня — дня, когда ты полон решимости. Бриз покажет это письмо тебе же в момент, когда сильно потянет курить.\n\nНапиши, почему ты бросаешь. Что ты чувствуешь к сигаретам прямо сейчас. Что хочешь сказать себе слабому от себя сильного.'
                  : 'Write from today — the day you are full of resolve. Breeze will show this letter back to you at the exact moment a craving hits hard.\n\nWrite why you are quitting. What you feel about cigarettes right now. What your strong self wants to tell your weak moment.'}
              </Text>
              <TextInput
                value={draft} onChangeText={setDraft} multiline autoFocus={!letter}
                placeholder={ru ? 'Привет. Если ты это читаешь, тебе сейчас тяжело. Помнишь, почему мы начали?..' : 'Hey. If you are reading this, it is hard right now. Remember why we started?..'}
                placeholderTextColor={t.textDim}
                style={{
                  minHeight: 220, textAlignVertical: 'top', color: t.text, fontSize: 16, lineHeight: 24,
                  backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, borderRadius: radius.lg, padding: 16,
                }} />
              <Pressable onPress={save} disabled={!draft.trim()}
                style={({ pressed }) => ({
                  padding: 18, borderRadius: radius.xl, alignItems: 'center',
                  backgroundColor: draft.trim() ? C : t.border, opacity: pressed ? 0.9 : 1,
                })}>
                <Text style={{ color: draft.trim() ? '#1A1A1A' : t.textDim, fontWeight: '800', fontSize: 16 }}>
                  {ru ? 'Запечатать письмо' : 'Seal the letter'}
                </Text>
              </Pressable>
              {!!letter && (
                <Pressable onPress={() => { setDraft(letter.text); setEditing(false); }} style={{ alignItems: 'center', paddingVertical: 6 }}>
                  <Text style={{ color: t.textDim, fontSize: 14 }}>{ru ? 'Отмена' : 'Cancel'}</Text>
                </Pressable>
              )}
            </>
          ) : letter ? (
            <>
              <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>
                {from === 'sos'
                  ? (ru ? 'Это написал ты.' : 'You wrote this.')
                  : (ru ? 'Письмо себе' : 'A letter to yourself')}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 13 }}>
                {ru ? `Запечатано ${writtenDate}` : `Sealed on ${writtenDate}`}
              </Text>
              <View style={{ backgroundColor: t.bgElev, borderWidth: 1, borderColor: C + '44', borderRadius: radius.lg, padding: 18 }}>
                <Text style={{ color: t.text, fontSize: 17, lineHeight: 27 }}>{letter.text}</Text>
              </View>
              {from === 'sos' && (
                <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21, textAlign: 'center' }}>
                  {ru ? 'Человек, который это писал, верил в тебя. Он был прав.' : 'The person who wrote this believed in you. They were right.'}
                </Text>
              )}
              <Pressable onPress={() => { Haptics.selectionAsync(); setEditing(true); }}
                style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: t.textDim, fontSize: 14 }}>{ru ? 'Переписать' : 'Rewrite'}</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
