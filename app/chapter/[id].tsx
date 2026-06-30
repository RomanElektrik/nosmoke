// Читалка книги «Выдох» — плавный пейджер: одна глава = одна страница,
// перелистывается горизонтальным свайпом (FlatList pagingEnabled — без нативных
// зависимостей, работает в Expo Go). Книжные шрифты (Lora/Merriweather), тёплая
// «бумага», регулируемый размер и межстрочье — всё в readerPrefs. Открытая глава
// помечается прочитанной (bookProgress, не обнуляем).
import { useEffect, useRef, useState, memo } from 'react';
import { View, Text, Pressable, Modal, Platform, FlatList, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFonts } from 'expo-font';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import { Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { Icon } from '../../components/Icon';
import { useAppState, DEFAULT_READER_PREFS, type ReaderPrefs } from '../../lib/storage';
import { usePremium } from '../../lib/subscription';
import { chapterBody, CHAPTERS, TOTAL_CHAPTERS, type BookChapter } from '../../lib/book';

const SIZE_PX = [16, 18, 20, 22, 25];
const LH_MULT = [1.45, 1.62, 1.82];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type Fam = { body: string | undefined; bold: string | undefined; faux: boolean };
function resolveFont(font: ReaderPrefs['font'], loaded: boolean): Fam {
  if ((font === 'lora' || font === 'merriweather') && !loaded) return { body: undefined, bold: undefined, faux: true };
  switch (font) {
    case 'lora': return { body: 'Lora_400Regular', bold: 'Lora_700Bold', faux: false };
    case 'merriweather': return { body: 'Merriweather_400Regular', bold: 'Merriweather_700Bold', faux: false };
    case 'georgia': return { body: SERIF, bold: SERIF, faux: true };
    default: return { body: undefined, bold: undefined, faux: true };
  }
}
type RP = { bg: string; text: string; dim: string; card: string; border: string };
function readerPalette(paper: ReaderPrefs['paper'], t: ReturnType<typeof useTheme>): RP {
  if (paper === 'sepia') return { bg: '#F4ECD8', text: '#3B3024', dim: '#7A6A52', card: '#EBE0C6', border: 'rgba(59,48,36,0.16)' };
  return { bg: t.bg, text: t.text, dim: t.textDim, card: t.bgElev, border: t.border };
}

export default function ChapterScreen() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const premium = usePremium();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useAppState();
  const [showSettings, setShowSettings] = useState(false);
  const listRef = useRef<FlatList<BookChapter>>(null);
  const width = Dimensions.get('window').width;

  const [fontsLoaded] = useFonts({ Lora_400Regular, Lora_700Bold, Merriweather_400Regular, Merriweather_700Bold });

  const startIdx = Math.max(0, CHAPTERS.findIndex((c) => c.id === (id ?? 'intro')));
  const [current, setCurrent] = useState(startIdx);

  const prefs = state.readerPrefs ?? DEFAULT_READER_PREFS;
  const rp = readerPalette(prefs.paper, t);
  const cur = CHAPTERS[current] ?? CHAPTERS[0];

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/book' as any));

  const markRead = (ch: BookChapter | undefined) => {
    if (!ch || (!ch.free && !premium)) return;
    setState((s) => {
      const m = s.bookProgress ?? {};
      if (m[ch.id]) return s;
      return { ...s, bookProgress: { ...m, [ch.id]: Date.now() } };
    });
  };

  // Помечаем стартовую главу прочитанной один раз.
  useEffect(() => { markRead(CHAPTERS[startIdx]); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSettle = (x: number) => {
    const i = clamp(Math.round(x / width), 0, CHAPTERS.length - 1);
    if (i !== current) { setCurrent(i); Haptics.selectionAsync(); markRead(CHAPTERS[i]); }
  };

  const bookmarked = (state.bookmarks ?? []).includes(cur.id);
  const toggleBookmark = () => {
    Haptics.selectionAsync();
    setState((s) => {
      const set = new Set(s.bookmarks ?? []);
      set.has(cur.id) ? set.delete(cur.id) : set.add(cur.id);
      return { ...s, bookmarks: [...set] };
    });
  };

  const patch = (p: Partial<ReaderPrefs>) =>
    setState((s) => ({ ...s, readerPrefs: { ...(s.readerPrefs ?? DEFAULT_READER_PREFS), ...p } }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: rp.bg }} edges={['top']}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, gap: 10 }}>
        <Pressable onPress={back} hitSlop={12} style={{ flex: 1 }}>
          <Text style={{ color: cur.color, fontSize: 17, fontWeight: '600' }}>← {ru ? 'Книга' : 'Book'}</Text>
        </Pressable>
        <Text style={{ color: rp.dim, fontSize: 12, fontWeight: '700' }}>
          {cur.number === 0 ? (ru ? 'Вступление' : 'Intro') : `${cur.number} / ${TOTAL_CHAPTERS}`}
        </Text>
        <Pressable onPress={toggleBookmark} hitSlop={12} style={{ padding: 4 }}>
          <Icon.star size={22} color={bookmarked ? cur.color : rp.dim} />
        </Pressable>
        <Pressable onPress={() => { Haptics.selectionAsync(); setShowSettings(true); }} hitSlop={12} style={{ padding: 4, flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
          <Text style={{ color: rp.dim, fontSize: 13, fontWeight: '800' }}>А</Text>
          <Text style={{ color: rp.dim, fontSize: 19, fontWeight: '800' }}>А</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={CHAPTERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIdx}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollToIndexFailed={(info) => { setTimeout(() => listRef.current?.scrollToOffset({ offset: info.index * width, animated: false }), 60); }}
        keyExtractor={(c) => c.id}
        onMomentumScrollEnd={(e) => onSettle(e.nativeEvent.contentOffset.x)}
        renderItem={({ item }) => (
          <ChapterPage
            ch={item} width={width} prefs={prefs} fontsLoaded={fontsLoaded} rp={rp} ru={ru}
            premium={premium} onPaywall={() => { Haptics.selectionAsync(); router.push('/paywall' as any); }}
          />
        )}
      />

      <ReaderSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        prefs={prefs}
        accent={cur.color}
        ru={ru}
        t={t}
        fontsLoaded={fontsLoaded}
        onChange={patch}
      />
    </SafeAreaView>
  );
}

// ── Одна страница-глава ────────────────────────────────────────────────────
const ChapterPage = memo(function ChapterPage({
  ch, width, prefs, fontsLoaded, rp, ru, premium, onPaywall,
}: {
  ch: BookChapter; width: number; prefs: ReaderPrefs; fontsLoaded: boolean;
  rp: RP; ru: boolean; premium: boolean; onPaywall: () => void;
}) {
  const locked = !ch.free && !premium;
  const fam = resolveFont(prefs.font, fontsLoaded);
  const body = SIZE_PX[clamp(prefs.size, 0, SIZE_PX.length - 1)];
  const lh = Math.round(body * LH_MULT[clamp(prefs.lineHeight, 0, LH_MULT.length - 1)]);
  const head = Math.round(body * 1.18);
  const title = Math.round(body * 1.62);
  const I = Icon[ch.icon];

  if (locked) {
    return (
      <View style={{ width, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 16 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: ch.color + '1F', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.star size={34} color={ch.color} />
        </View>
        <Text style={{ color: rp.text, fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4 }}>
          {ru ? 'Эта глава — в Премиуме' : 'This chapter is Premium'}
        </Text>
        <Text style={{ color: rp.dim, fontSize: 15, lineHeight: 22, textAlign: 'center' }}>
          {ru ? 'Вступление открыто для всех. Все главы книги «Выдох» — в Премиуме.' : 'The intro is free. All chapters of «Exhale» are Premium.'}
        </Text>
        <Pressable onPress={onPaywall} style={{ marginTop: 6, backgroundColor: ch.color, paddingHorizontal: 26, paddingVertical: 15, borderRadius: radius.lg }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{ru ? 'Открыть книгу' : 'Unlock the book'}</Text>
        </Pressable>
      </View>
    );
  }

  const blocks = chapterBody(ch, ru);
  const meta = ch.number === 0
    ? (ru ? 'ВСТУПЛЕНИЕ' : 'INTRO')
    : `${ru ? 'ГЛАВА' : 'CHAPTER'} ${ch.number} · ${ru ? 'ИЗ' : 'OF'} ${TOTAL_CHAPTERS}`;

  return (
    <View style={{ width }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[ch.color + '30', ch.color + '08']}
          style={{ width: '100%', height: 168, alignItems: 'center', justifyContent: 'center' }}>
          <I size={56} color={ch.color} />
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: 16, gap: 14, maxWidth: 680, alignSelf: 'center', width: '100%' }}>
          <Text style={{ color: ch.color, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>
            {ch.part} · {meta} · {ch.readMin} {ru ? 'мин' : 'min'}
          </Text>
          <Text style={{ color: rp.text, fontFamily: fam.bold, fontWeight: fam.faux ? '800' : 'normal', fontSize: title, letterSpacing: -0.5, lineHeight: Math.round(title * 1.18) }}>
            {ru ? ch.titleRu : (ch.titleEn ?? ch.titleRu)}
          </Text>

          {blocks.map((b, i) =>
            b.type === 'h' ? (
              <Text key={i} style={{ color: ch.color, fontFamily: fam.bold, fontWeight: fam.faux ? '800' : 'normal', fontSize: head, letterSpacing: -0.2, lineHeight: Math.round(head * 1.3), marginTop: 14 }}>
                {b.text}
              </Text>
            ) : (
              <Text key={i} style={{ color: rp.text, fontFamily: fam.body, fontSize: body, lineHeight: lh }}>
                {b.text}
              </Text>
            ),
          )}

          {/* Главное */}
          <View style={{ marginTop: 10, padding: 16, borderRadius: radius.lg, backgroundColor: ch.color + '14', borderWidth: 1, borderColor: ch.color + '3A' }}>
            <Text style={{ color: ch.color, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>
              {ru ? 'ГЛАВНОЕ' : 'KEY POINT'}
            </Text>
            <Text style={{ color: rp.text, fontFamily: fam.body, fontSize: Math.round(body * 0.95), lineHeight: Math.round(body * 1.4), fontWeight: fam.faux ? '600' : 'normal' }}>
              {ru ? ch.takeawayRu : (ch.takeawayEn ?? ch.takeawayRu)}
            </Text>
          </View>

          <Text style={{ color: rp.dim, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
            {ru ? 'Листай свайпом, как страницы →' : 'Swipe to turn pages →'}
          </Text>
          <Text style={{ color: rp.dim, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 2 }}>
            {ru ? 'Книга «Выдох» — образовательная поддержка, не медицинская услуга.' : '«Exhale» is educational support, not a medical service.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
});

// ── Настройки чтения ───────────────────────────────────────────────────────
function ReaderSettings({
  visible, onClose, prefs, onChange, accent, ru, t, fontsLoaded,
}: {
  visible: boolean; onClose: () => void; prefs: ReaderPrefs;
  onChange: (p: Partial<ReaderPrefs>) => void; accent: string; ru: boolean;
  t: ReturnType<typeof useTheme>; fontsLoaded: boolean;
}) {
  const FONTS: { key: ReaderPrefs['font']; label: string }[] = [
    { key: 'system', label: ru ? 'Системный' : 'System' },
    { key: 'lora', label: 'Lora' },
    { key: 'merriweather', label: 'Merriweather' },
    { key: 'georgia', label: 'Georgia' },
  ];
  const PAPERS: { key: ReaderPrefs['paper']; ru: string; en: string }[] = [
    { key: 'sepia', ru: 'Бумага', en: 'Paper' },
    { key: 'auto', ru: 'Как в системе', en: 'System' },
  ];
  const Stepper = ({ label, value, max, onMinus, onPlus }: { label: string; value: number; max: number; onMinus: () => void; onPlus: () => void }) => (
    <View style={{ gap: 8 }}>
      <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => { Haptics.selectionAsync(); onMinus(); }}
          style={{ width: 52, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }}>−</Text>
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          {Array.from({ length: max + 1 }).map((_, i) => (
            <View key={i} style={{ width: i === value ? 12 : 8, height: i === value ? 12 : 8, borderRadius: 6, backgroundColor: i <= value ? accent : t.border }} />
          ))}
        </View>
        <Pressable onPress={() => { Haptics.selectionAsync(); onPlus(); }}
          style={{ width: 52, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 34, gap: 18 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: t.border }} />
          </View>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>{ru ? 'Чтение' : 'Reading'}</Text>

          <Stepper label={ru ? 'РАЗМЕР' : 'SIZE'} value={prefs.size} max={SIZE_PX.length - 1}
            onMinus={() => onChange({ size: clamp(prefs.size - 1, 0, SIZE_PX.length - 1) })}
            onPlus={() => onChange({ size: clamp(prefs.size + 1, 0, SIZE_PX.length - 1) })} />

          <Stepper label={ru ? 'МЕЖСТРОЧЬЕ' : 'LINE SPACING'} value={prefs.lineHeight} max={LH_MULT.length - 1}
            onMinus={() => onChange({ lineHeight: clamp(prefs.lineHeight - 1, 0, LH_MULT.length - 1) })}
            onPlus={() => onChange({ lineHeight: clamp(prefs.lineHeight + 1, 0, LH_MULT.length - 1) })} />

          {/* Шрифт */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{ru ? 'ШРИФТ' : 'FONT'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FONTS.map((f) => {
                const active = prefs.font === f.key;
                const ff = resolveFont(f.key, fontsLoaded).body;
                return (
                  <Pressable key={f.key} onPress={() => { Haptics.selectionAsync(); onChange({ font: f.key }); }}
                    style={{ flexGrow: 1, flexBasis: '47%', paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
                      backgroundColor: active ? accent : t.bgElev, borderWidth: 1, borderColor: active ? accent : t.border }}>
                    <Text style={{ color: active ? '#fff' : t.text, fontSize: 15, fontWeight: '700', fontFamily: ff }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Фон */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{ru ? 'ФОН' : 'BACKGROUND'}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {PAPERS.map((p) => {
                const active = prefs.paper === p.key;
                return (
                  <Pressable key={p.key} onPress={() => { Haptics.selectionAsync(); onChange({ paper: p.key }); }}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
                      backgroundColor: active ? accent : t.bgElev, borderWidth: 1, borderColor: active ? accent : t.border }}>
                    <Text style={{ color: active ? '#fff' : t.text, fontSize: 14, fontWeight: '700' }}>{ru ? p.ru : p.en}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable onPress={onClose} style={{ marginTop: 4, alignItems: 'center', paddingVertical: 14, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{ru ? 'Готово' : 'Done'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
