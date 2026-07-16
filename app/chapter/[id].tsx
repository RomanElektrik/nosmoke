// Читалка книги «Выдох». Заход = сразу текст текущей главы. Свайп листает главы
// (react-native-pager-view, одна глава = одна страница). Тап по названию → модалка
// оглавления; кнопка «Аа» → настройки чтения (размер/межстрочье/шрифт/тема).
// Премиум-главы внутри пейджера показывают заглушку с кнопкой Paywall.
// Виртуализация: тяжёлый текст рендерится только для страниц рядом с текущей (±1).
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PagerView from '../../components/PagerCompat';
import * as Haptics from 'expo-haptics';
import { useFonts } from 'expo-font';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import { Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { useTheme, radius, spacing } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { Icon } from '../../components/Icon';
import { useAppState, DEFAULT_READER_PREFS, type ReaderPrefs } from '../../lib/storage';
import { usePremium } from '../../lib/subscription';
import { track } from '../../lib/analytics';
import { chapterBody, CHAPTERS, TOTAL_CHAPTERS, partName, type BookChapter } from '../../lib/book';

// Темы читалки — отдельно от темы приложения.
const READER_THEMES = {
  light: { bg: '#FFFFFF', text: '#1A1A1A', dim: '#7A7A7A', card: '#F2F2EF', border: 'rgba(0,0,0,0.08)' },
  sepia: { bg: '#EDE4D8', text: '#463A2C', dim: '#8A7960', card: '#E3D7C5', border: 'rgba(74,60,46,0.18)' },
  dark:  { bg: '#15130F', text: '#E8E2D6', dim: '#9A8F7E', card: '#211D17', border: 'rgba(255,255,255,0.10)' },
} as const;

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const premium = usePremium();
  const [state, setState] = useAppState();
  const pagerRef = useRef<PagerView>(null);
  const [fontsLoaded] = useFonts({ Lora_400Regular, Lora_700Bold, Merriweather_400Regular, Merriweather_700Bold });

  const prefs: ReaderPrefs = { ...DEFAULT_READER_PREFS, ...(state.readerPrefs ?? {}) };
  const RT = READER_THEMES[prefs.theme] ?? READER_THEMES.sepia;
  const fam = resolveFont(prefs.font, fontsLoaded);

  const startIndex = Math.max(0, CHAPTERS.findIndex((c) => c.id === (id ?? 'intro')));
  const [page, setPage] = useState(startIndex);
  const [showTOC, setShowTOC] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const current = CHAPTERS[page] ?? CHAPTERS[0];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any));

  const bookmarked = (state.bookmarks ?? []).includes(current.id);
  const toggleBookmark = () => {
    Haptics.selectionAsync();
    setState((s) => {
      const set = new Set(s.bookmarks ?? []);
      set.has(current.id) ? set.delete(current.id) : set.add(current.id);
      return { ...s, bookmarks: [...set] };
    });
  };

  const markRead = (ch: BookChapter | undefined) => {
    if (!ch || (!ch.free && !premium)) return;
    setState((s) => {
      const m = s.bookProgress ?? {};
      if (m[ch.id]) return s;
      track('chapter_read', { id: ch.id });
      return { ...s, bookProgress: { ...m, [ch.id]: Date.now() } };
    });
  };
  useEffect(() => { markRead(CHAPTERS[startIndex]); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // «Прочитано» — только если юзер задержался на главе ≥3 сек. Иначе быстрый
  // пролёт свайпами через несколько глав помечал их все прочитанными.
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPageSelected = (e: { nativeEvent: { position: number } }) => {
    const i = e.nativeEvent.position;
    setPage(i);
    if (dwellRef.current) clearTimeout(dwellRef.current);
    dwellRef.current = setTimeout(() => markRead(CHAPTERS[i]), 3000);
    Haptics.selectionAsync();
  };
  useEffect(() => () => { if (dwellRef.current) clearTimeout(dwellRef.current); }, []);

  const goToChapter = (i: number) => {
    setShowTOC(false);
    setPage(i);
    pagerRef.current?.setPageWithoutAnimation(i);
    markRead(CHAPTERS[i]);
  };

  // Функциональный апдейт от СВЕЖЕГО состояния: со снапшотом prefs два быстрых
  // тапа «А+» до ре-рендера давали +1 вместо +2.
  const setPref = (p: Partial<ReaderPrefs>) =>
    setState((s) => ({ ...s, readerPrefs: { ...DEFAULT_READER_PREFS, ...s.readerPrefs, ...p } }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: RT.bg }} edges={['top']}>
      {/* ШАПКА */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, gap: 6 }}>
        <Pressable onPress={back} hitSlop={10} style={{ padding: 6 }}>
          <Text style={{ color: RT.text, fontSize: 26, fontWeight: '300', marginTop: -3 }}>‹</Text>
        </Pressable>
        <Pressable onPress={() => { Haptics.selectionAsync(); setShowTOC(true); }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Text numberOfLines={1} style={{ color: RT.text, fontSize: 16, fontWeight: '800', maxWidth: '82%' }}>
            {current.number === 0 ? (ru ? 'Вступление' : 'Intro') : `${ru ? 'Глава' : 'Ch.'} ${current.number}`} · {ru ? current.titleRu : (current.titleEn ?? current.titleRu)}
          </Text>
          <Icon.chevronDown size={15} color={RT.dim} />
        </Pressable>
        <Pressable onPress={toggleBookmark} hitSlop={10} style={{ padding: 6 }}>
          <Icon.star size={20} color={bookmarked ? RT.text : RT.dim} />
        </Pressable>
        <Pressable onPress={() => { Haptics.selectionAsync(); setShowSettings(true); }} hitSlop={10}
          style={{ padding: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
          <Text style={{ color: RT.text, fontSize: 13, fontWeight: '800' }}>А</Text>
          <Text style={{ color: RT.text, fontSize: 18, fontWeight: '800' }}>А</Text>
        </Pressable>
      </View>

      {/* ПЕЙДЖЕР — свайп листает главы */}
      <PagerView ref={pagerRef} style={{ flex: 1 }} initialPage={startIndex} offscreenPageLimit={1} onPageSelected={onPageSelected}>
        {CHAPTERS.map((ch, i) => {
          const locked = !ch.free && !premium;
          const heavy = Math.abs(i - page) <= 1; // виртуализация
          return (
            <View key={ch.id} style={{ flex: 1, backgroundColor: RT.bg }}>
              {!heavy ? (
                <View style={{ flex: 1 }} />
              ) : locked ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: ch.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon.star size={34} color={ch.color} />
                  </View>
                  <Text style={{ color: RT.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
                    {ru ? 'Эта глава — в Премиуме' : 'Premium chapter'}
                  </Text>
                  <Text style={{ color: RT.dim, fontSize: 14.5, lineHeight: 21, textAlign: 'center' }}>
                    {ru ? 'Вступление открыто всем. Все главы книги «Выдох» — в Премиуме.' : 'The intro is free. All chapters are Premium.'}
                  </Text>
                  <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/paywall' as any); }}
                    style={{ marginTop: 4, backgroundColor: ch.color, paddingHorizontal: 26, paddingVertical: 14, borderRadius: radius.lg }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{ru ? 'Открыть книгу' : 'Unlock'}</Text>
                  </Pressable>
                </View>
              ) : (
                <ChapterText ch={ch} ru={ru} RT={RT} fam={fam} fontSize={prefs.fontSize} lh={prefs.lineHeight} />
              )}
            </View>
          );
        })}
      </PagerView>

      <TOCModal
        visible={showTOC} onClose={() => setShowTOC(false)} onPick={goToChapter}
        page={page} premium={premium} progress={state.bookProgress ?? {}} bookmarks={state.bookmarks ?? []} ru={ru} t={t}
      />
      <SettingsModal
        visible={showSettings} onClose={() => setShowSettings(false)}
        prefs={prefs} setPref={setPref} fontsLoaded={fontsLoaded} ru={ru} t={t}
      />
    </SafeAreaView>
  );
}

// ── Текст главы ────────────────────────────────────────────────────────────
type ReaderColors = { bg: string; text: string; dim: string; card: string; border: string };
function ChapterText({ ch, ru, RT, fam, fontSize, lh }: {
  ch: BookChapter; ru: boolean; RT: ReaderColors; fam: Fam; fontSize: number; lh: number;
}) {
  const blocks = chapterBody(ch, ru);
  const meta = ch.number === 0
    ? `${partName(ch.part, ru)} · ${ru ? 'ВСТУПЛЕНИЕ' : 'INTRO'}`
    : `${partName(ch.part, ru)} · ${ru ? 'ГЛАВА' : 'CH.'} ${ch.number} / ${TOTAL_CHAPTERS} · ${ch.readMin} ${ru ? 'мин' : 'min'}`;
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 96, maxWidth: 680, alignSelf: 'center', width: '100%' }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: RT.dim, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>{meta}</Text>
      <Text style={{ color: RT.text, fontFamily: fam.bold, fontWeight: fam.faux ? '800' : 'normal', fontSize: fontSize + 13, lineHeight: (fontSize + 13) * 1.14, letterSpacing: -0.5, marginBottom: 18 }}>
        {ru ? ch.titleRu : (ch.titleEn ?? ch.titleRu)}
      </Text>
      {blocks.map((b, k) =>
        b.type === 'h' ? (
          <Text key={k} style={{ color: RT.text, fontFamily: fam.bold, fontWeight: fam.faux ? '800' : 'normal', fontSize: fontSize + 2, lineHeight: (fontSize + 2) * 1.3, marginTop: 18, marginBottom: 4 }}>
            {b.text}
          </Text>
        ) : (
          <Text key={k} style={{ color: RT.text, fontFamily: fam.body, fontSize, lineHeight: fontSize * lh, marginBottom: 15 }}>
            {b.text}
          </Text>
        ),
      )}
      <View style={{ marginTop: 12, padding: 16, borderRadius: radius.lg, backgroundColor: RT.card, borderWidth: 1, borderColor: RT.border }}>
        <Text style={{ color: RT.dim, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>{ru ? 'ГЛАВНОЕ' : 'KEY POINT'}</Text>
        <Text style={{ color: RT.text, fontFamily: fam.body, fontSize: fontSize - 1, lineHeight: (fontSize - 1) * 1.4, fontWeight: fam.faux ? '600' : 'normal' }}>
          {ru ? ch.takeawayRu : (ch.takeawayEn ?? ch.takeawayRu)}
        </Text>
      </View>
      <Text style={{ color: RT.dim, fontSize: 11, textAlign: 'center', marginTop: 14 }}>
        {ru ? 'Свайп ← → листает главы' : 'Swipe ← → to turn pages'}
      </Text>
    </ScrollView>
  );
}

// ── Оглавление (модалка) ───────────────────────────────────────────────────
function TOCModal({ visible, onClose, onPick, page, premium, progress, bookmarks, ru, t }: {
  visible: boolean; onClose: () => void; onPick: (i: number) => void; page: number;
  premium: boolean; progress: Record<string, number>; bookmarks: string[]; ru: boolean; t: ReturnType<typeof useTheme>;
}) {
  let lastPart = '';
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>{ru ? 'Оглавление' : 'Contents'}</Text>
          <Pressable onPress={onClose} hitSlop={12}><Icon.close size={24} color={t.text} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40, gap: 8 }}>
          {CHAPTERS.map((ch, i) => {
            const locked = !ch.free && !premium;
            const read = !!progress[ch.id];
            const marked = bookmarks.includes(ch.id);
            const head = ch.part !== lastPart ? partName((lastPart = ch.part), ru) : null;
            return (
              <View key={ch.id} style={{ gap: 8 }}>
                {head && (
                  <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: i === 0 ? 0 : 10, marginLeft: 4 }}>{head}</Text>
                )}
                <Pressable onPress={() => onPick(i)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radius.lg,
                    backgroundColor: i === page ? t.accent + '14' : t.bgElev, borderWidth: 1, borderColor: i === page ? t.accent : t.border }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.textDim + '1A', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>{ch.number === 0 ? '•' : ch.number}</Text>
                  </View>
                  <Text style={{ flex: 1, color: t.text, fontSize: 15, fontWeight: '600' }} numberOfLines={2}>
                    {ru ? ch.titleRu : (ch.titleEn ?? ch.titleRu)}
                  </Text>
                  {marked && <Icon.star size={14} color={t.accent} />}
                  {read && <Icon.check size={16} color={t.accent} />}
                  {locked && <Icon.star size={14} color={t.warn} />}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Настройки чтения (модалка снизу) ───────────────────────────────────────
function SettingsModal({ visible, onClose, prefs, setPref, fontsLoaded, ru, t }: {
  visible: boolean; onClose: () => void; prefs: ReaderPrefs;
  setPref: (p: Partial<ReaderPrefs>) => void; fontsLoaded: boolean; ru: boolean; t: ReturnType<typeof useTheme>;
}) {
  const FONTS: { key: ReaderPrefs['font']; label: string }[] = [
    { key: 'system', label: ru ? 'Системный' : 'System' },
    { key: 'lora', label: 'Lora' },
    { key: 'merriweather', label: 'Merriweather' },
    { key: 'georgia', label: 'Georgia' },
  ];
  const THEMES: ReaderPrefs['theme'][] = ['light', 'sepia', 'dark'];
  const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ width: 56, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
      <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.bg, padding: spacing.lg, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 18 }}>
          <View style={{ alignItems: 'center' }}><View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: t.border }} /></View>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>{ru ? 'Чтение' : 'Reading'}</Text>

          {/* Размер */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>{ru ? 'РАЗМЕР' : 'SIZE'}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn label="А−" onPress={() => setPref({ fontSize: clamp(prefs.fontSize - 1, 16, 26) })} />
              <Btn label="А+" onPress={() => setPref({ fontSize: clamp(prefs.fontSize + 1, 16, 26) })} />
            </View>
          </View>

          {/* Межстрочье */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>{ru ? 'МЕЖСТРОЧЬЕ' : 'SPACING'}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn label="−" onPress={() => setPref({ lineHeight: Math.round(clamp(prefs.lineHeight - 0.1, 1.4, 1.95) * 100) / 100 })} />
              <Btn label="+" onPress={() => setPref({ lineHeight: Math.round(clamp(prefs.lineHeight + 0.1, 1.4, 1.95) * 100) / 100 })} />
            </View>
          </View>

          {/* Шрифт */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>{ru ? 'ШРИФТ' : 'FONT'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FONTS.map((f) => {
                const active = prefs.font === f.key;
                const ff = resolveFont(f.key, fontsLoaded).body;
                return (
                  <Pressable key={f.key} onPress={() => { Haptics.selectionAsync(); setPref({ font: f.key }); }}
                    style={{ flexGrow: 1, flexBasis: '47%', paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
                      backgroundColor: active ? t.accent : t.bgElev, borderWidth: 1, borderColor: active ? t.accent : t.border }}>
                    <Text style={{ color: active ? '#fff' : t.text, fontSize: 15, fontWeight: '700', fontFamily: ff }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Тема */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>{ru ? 'ТЕМА' : 'THEME'}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {THEMES.map((th) => {
                const active = prefs.theme === th;
                const rt = READER_THEMES[th];
                return (
                  <Pressable key={th} onPress={() => { Haptics.selectionAsync(); setPref({ theme: th }); }}
                    style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: rt.bg, borderWidth: 2, borderColor: active ? t.accent : t.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: rt.text, fontWeight: '800', fontSize: 17 }}>Аа</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable onPress={onClose} style={{ marginTop: 2, alignItems: 'center', paddingVertical: 14, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{ru ? 'Готово' : 'Done'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
