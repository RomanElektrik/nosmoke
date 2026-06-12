// «Письмо себе» — a time capsule. Written on a strong, determined day; read on
// a weak one. The SOS screen surfaces it mid-craving — nothing argues with a
// craving better than your own words about why you started.
// Visual: a typewritten page — worn, stained paper and monospaced "typed" ink
// (reference: vintage typewriter shots).

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';

const GOLD = '#FFD60A';
const PAPER_HI = '#EFE5CF';   // lit centre of the sheet
const PAPER_LO = '#DDD0B4';   // darker, worn edges
const INK = '#2E2A24';        // typewriter ribbon ink
const INK_DIM = '#7C7260';

// Typewriter face. Courier ships with iOS; Android falls back to monospace.
const mono = Platform.select({ ios: 'Courier New', android: 'monospace' });

// Deterministic pseudo-random — the grain/stains must not change every render.
function rnd(seed: number) {
  let x = seed;
  return () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
}

// Worn-paper overlay: aged edges, coffee-ish stains, speckled grain.
function PaperTexture() {
  const r = rnd(42);
  const grain = Array.from({ length: 90 }, () => ({
    cx: r() * 100, cy: r() * 100, rr: 0.12 + r() * 0.3, o: 0.04 + r() * 0.08,
  }));
  return (
    <>
      {/* darker, slightly dirty edges */}
      <LinearGradient colors={['#00000022', 'transparent', 'transparent', '#00000026']}
        locations={[0, 0.12, 0.88, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <LinearGradient colors={['#00000018', 'transparent', 'transparent', '#0000001C']}
        locations={[0, 0.1, 0.9, 1]}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
        {/* stains */}
        <Ellipse cx={84} cy={14} rx={13} ry={9} fill="#8B6F3A" opacity={0.07} />
        <Ellipse cx={18} cy={78} rx={16} ry={10} fill="#7A5C2E" opacity={0.06} />
        <Ellipse cx={62} cy={94} rx={20} ry={8} fill="#6B5024" opacity={0.05} />
        <Circle cx={9} cy={10} r={5} fill="#8B6F3A" opacity={0.05} />
        {/* grain speckles */}
        {grain.map((g, i) => (
          <Circle key={i} cx={g.cx} cy={g.cy} r={g.rr} fill="#4A3B22" opacity={g.o} />
        ))}
      </Svg>
    </>
  );
}

// The sheet itself — children are laid on top of the texture.
function PaperSheet({ children, tilt = 0 }: { children: React.ReactNode; tilt?: number }) {
  return (
    <View style={{
      borderRadius: 4, overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 9,
      transform: [{ rotate: `${tilt}deg` }],
    }}>
      <LinearGradient colors={[PAPER_LO, PAPER_HI, PAPER_HI, PAPER_LO]} locations={[0, 0.18, 0.8, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <PaperTexture />
      {children}
    </View>
  );
}

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
                  : from === 'sos' ? (ru ? 'Это напечатал ты.' : 'You typed this.') : (ru ? 'Письмо себе' : 'A letter to yourself')}
              </Text>
              {!editing && !!writtenDate && (
                <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2 }}>
                  {ru ? `Напечатано ${writtenDate}` : `Typed on ${writtenDate}`}
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

              {/* Worn sheet to type on */}
              <PaperSheet>
                <TextInput
                  value={draft} onChangeText={setDraft} multiline autoFocus={!letter}
                  placeholder={ru ? 'привет. если ты это читаешь,\nтебе сейчас тяжело.\nпомнишь, почему мы начали?..' : 'hey. if you are reading this,\nit is hard right now.\nremember why we started?..'}
                  placeholderTextColor={INK_DIM}
                  style={{
                    minHeight: 260, textAlignVertical: 'top', color: INK,
                    fontSize: 15.5, lineHeight: 27, fontFamily: mono, letterSpacing: 0.4,
                    paddingHorizontal: 22, paddingVertical: 24,
                  }} />
              </PaperSheet>

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
              {/* The typed page */}
              <PaperSheet tilt={-0.5}>
                <View style={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 30 }}>
                  <Text style={{ color: INK_DIM, fontSize: 12.5, fontFamily: mono, letterSpacing: 0.6, textAlign: 'right', marginBottom: 20 }}>
                    {writtenDate}
                  </Text>
                  <Text style={{ color: INK, fontSize: 15.5, lineHeight: 28, fontFamily: mono, letterSpacing: 0.4 }}>
                    {letter.text}
                  </Text>
                  <Text style={{ color: INK, fontSize: 14, fontFamily: mono, letterSpacing: 0.6, marginTop: 30, textAlign: 'right' }}>
                    {ru ? '— ты, в день решимости' : '— you, on the day you decided'}
                  </Text>
                </View>
              </PaperSheet>

              {from === 'sos' && (
                <Text style={{ color: t.textDim, fontSize: 14.5, lineHeight: 21, textAlign: 'center', paddingHorizontal: 10 }}>
                  {ru ? 'Человек, который это печатал, верил в тебя. Он был прав.' : 'The person who typed this believed in you. They were right.'}
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
