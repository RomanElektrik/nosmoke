// «Письмо себе» — a time capsule. Written on a strong, determined day; read on
// a weak one. The SOS screen surfaces it mid-craving — nothing argues with a
// craving better than your own words about why you started.
// Visual: an actual letter — cream paper, serif ink, ruled lines, a wax seal.

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

const GOLD = '#FFD60A';
const PAPER = '#F6EFDF';
const PAPER_EDGE = '#E8DFC8';
const INK = '#3A3226';
const INK_DIM = '#8A7E69';
const WAX = '#B3402F';

// Handwriting-adjacent serif available without bundling fonts.
const serif = Platform.select({ ios: 'Georgia', android: 'serif' });
const serifItalic = Platform.select({ ios: 'Georgia-Italic', android: 'serif' });

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
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient colors={[GOLD + '38', GOLD + '08']}
              style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.letter size={30} color={GOLD} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 }}>
                {editing
                  ? (ru ? 'Письмо себе' : 'A letter to yourself')
                  : from === 'sos' ? (ru ? 'Это написал ты.' : 'You wrote this.') : (ru ? 'Письмо себе' : 'A letter to yourself')}
              </Text>
              {!editing && !!writtenDate && (
                <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2 }}>
                  {ru ? `Запечатано ${writtenDate}` : `Sealed on ${writtenDate}`}
                </Text>
              )}
            </View>
          </View>

          {editing ? (
            <>
              <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 22 }}>
                {ru
                  ? 'Напиши из сегодняшнего дня — дня, когда ты полон решимости. Бриз покажет это письмо тебе же в момент, когда сильно потянет курить.'
                  : 'Write from today — the day you are full of resolve. Breeze will show this letter back to you at the exact moment a craving hits hard.'}
              </Text>

              {/* Paper sheet to write on */}
              <View style={{ borderRadius: 6, backgroundColor: PAPER, borderWidth: 1, borderColor: PAPER_EDGE, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
                <View style={{ height: 3, backgroundColor: PAPER_EDGE, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                <TextInput
                  value={draft} onChangeText={setDraft} multiline autoFocus={!letter}
                  placeholder={ru ? 'Привет. Если ты это читаешь, тебе сейчас тяжело. Помнишь, почему мы начали?..' : 'Hey. If you are reading this, it is hard right now. Remember why we started?..'}
                  placeholderTextColor={INK_DIM}
                  style={{
                    minHeight: 240, textAlignVertical: 'top', color: INK,
                    fontSize: 17, lineHeight: 28, fontFamily: serif,
                    paddingHorizontal: 20, paddingVertical: 18,
                  }} />
              </View>

              <Pressable onPress={save} disabled={!draft.trim()}
                style={({ pressed }) => ({
                  padding: 18, borderRadius: radius.xl, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                  backgroundColor: draft.trim() ? GOLD : t.border, opacity: pressed ? 0.9 : 1,
                })}>
                <Icon.letter size={20} color={draft.trim() ? '#1A1A1A' : t.textDim} />
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
              {/* The letter itself — cream paper, serif ink, ruled footer, wax seal */}
              <View style={{
                borderRadius: 6, backgroundColor: PAPER, borderWidth: 1, borderColor: PAPER_EDGE,
                shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
                transform: [{ rotate: '-0.6deg' }],
              }}>
                <View style={{ height: 3, backgroundColor: PAPER_EDGE, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 26 }}>
                  <Text style={{ color: INK_DIM, fontSize: 13, fontFamily: serifItalic, fontStyle: 'italic', textAlign: 'right', marginBottom: 14 }}>
                    {writtenDate}
                  </Text>
                  <Text style={{ color: INK, fontSize: 17.5, lineHeight: 30, fontFamily: serif }}>
                    {letter.text}
                  </Text>
                  {/* signature line + wax seal */}
                  <View style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <View style={{ width: 120, height: 1, backgroundColor: INK_DIM + '66', marginBottom: 6 }} />
                      <Text style={{ color: INK_DIM, fontSize: 13, fontFamily: serifItalic, fontStyle: 'italic' }}>
                        {ru ? '— ты, в день решимости' : '— you, on the day you decided'}
                      </Text>
                    </View>
                    <View style={{
                      width: 52, height: 52, borderRadius: 26, backgroundColor: WAX,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 3, borderColor: '#9A3526',
                      shadowColor: WAX, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                      transform: [{ rotate: '8deg' }],
                    }}>
                      <Icon.heart size={24} color="#F3D9CF" />
                    </View>
                  </View>
                </View>
              </View>

              {from === 'sos' && (
                <Text style={{ color: t.textDim, fontSize: 14.5, lineHeight: 21, textAlign: 'center', paddingHorizontal: 10 }}>
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
