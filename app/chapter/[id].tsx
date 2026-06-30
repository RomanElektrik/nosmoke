// Читалка одной главы книги «Выдох».
// Настройки (размер/шрифт/фон) персистятся в readerPrefs и применяются ко всем
// главам. Открытие главы помечает её прочитанной (bookProgress, не обнуляем).
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { Icon } from '../../components/Icon';
import { useAppState, DEFAULT_READER_PREFS, type ReaderPrefs } from '../../lib/storage';
import { usePremium } from '../../lib/subscription';
import { getChapter, chapterBody, nextChapter, TOTAL_CHAPTERS } from '../../lib/book';

const SIZE_SCALE = [0.9, 1.0, 1.13, 1.28, 1.45];
const FONT_FAMILY: Record<ReaderPrefs['font'], string | undefined> = {
  system: undefined,
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  rounded: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: undefined }),
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Палитра читалки: 'auto' = тема устройства, 'sepia' = тёплый «бумажный» режим.
function readerPalette(paper: ReaderPrefs['paper'], t: ReturnType<typeof useTheme>) {
  if (paper === 'sepia') {
    return { bg: '#F4ECD8', text: '#3B3024', dim: '#7A6A52', card: '#EBE0C6', border: 'rgba(59,48,36,0.16)' };
  }
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

  const ch = getChapter(id ?? '');
  const locked = !!ch && !ch.free && !premium;
  const prefs = state.readerPrefs ?? DEFAULT_READER_PREFS;
  const rp = readerPalette(prefs.paper, t);
  const scale = SIZE_SCALE[clamp(prefs.size, 0, SIZE_SCALE.length - 1)];
  const ff = FONT_FAMILY[prefs.font];

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/book' as any));

  // Помечаем главу прочитанной при открытии (только доступную). Время первого
  // прочтения не перезаписываем.
  useEffect(() => {
    if (!ch || locked) return;
    setState((s) => {
      const cur = s.bookProgress ?? {};
      if (cur[ch.id]) return s;
      return { ...s, bookProgress: { ...cur, [ch.id]: Date.now() } };
    });
  }, [ch?.id, locked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ch) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ padding: spacing.lg }}>
          <Pressable onPress={back} hitSlop={12}>
            <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Премиум-гард: вступление открыто, главы — за подпиской.
  if (locked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
          <Pressable onPress={back} hitSlop={12}>
            <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 16 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: ch.color + '1F', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.star size={34} color={ch.color} />
          </View>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4 }}>
            {ru ? 'Эта глава — в Премиуме' : 'This chapter is Premium'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 22, textAlign: 'center' }}>
            {ru
              ? 'Вступление открыто для всех. Все 10 глав книги «Выдох» — в Премиуме.'
              : 'The intro is free for everyone. All 10 chapters of «Exhale» are in Premium.'}
          </Text>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push('/paywall' as any); }}
            style={{ marginTop: 6, backgroundColor: t.accent, paddingHorizontal: 26, paddingVertical: 15, borderRadius: radius.lg }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{ru ? 'Открыть книгу' : 'Unlock the book'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const body = chapterBody(ch, ru);
  const I = Icon[ch.icon];
  const bookmarked = (state.bookmarks ?? []).includes(ch.id);
  const next = nextChapter(ch.id);
  const meta = ch.number === 0
    ? (ru ? 'ВСТУПЛЕНИЕ' : 'INTRO')
    : `${ru ? 'ГЛАВА' : 'CHAPTER'} ${ch.number} · ${ru ? 'ИЗ' : 'OF'} ${TOTAL_CHAPTERS}`;

  const toggleBookmark = () => {
    Haptics.selectionAsync();
    setState((s) => {
      const set = new Set(s.bookmarks ?? []);
      set.has(ch.id) ? set.delete(ch.id) : set.add(ch.id);
      return { ...s, bookmarks: [...set] };
    });
  };

  const goNext = () => {
    Haptics.selectionAsync();
    if (!next) { back(); return; }
    const nextLocked = !next.free && !premium;
    router.push((nextLocked ? '/paywall' : `/chapter/${next.id}`) as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: rp.bg }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, gap: 10 }}>
        <Pressable onPress={back} hitSlop={12} style={{ flex: 1 }}>
          <Text style={{ color: ch.color, fontSize: 17, fontWeight: '600' }}>← {ru ? 'Книга' : 'Book'}</Text>
        </Pressable>
        <Pressable onPress={toggleBookmark} hitSlop={12} style={{ padding: 4 }}>
          <Icon.star size={22} color={bookmarked ? ch.color : rp.dim} />
        </Pressable>
        <Pressable onPress={() => { Haptics.selectionAsync(); setShowSettings(true); }} hitSlop={12} style={{ padding: 4, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={{ color: rp.dim, fontSize: 14, fontWeight: '800' }}>А</Text>
          <Text style={{ color: rp.dim, fontSize: 19, fontWeight: '800' }}>А</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <LinearGradient colors={[ch.color + '34', ch.color + '0A']}
          style={{ width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' }}>
          <I size={58} color={ch.color} />
        </LinearGradient>

        <View style={{ padding: spacing.lg, gap: 14 }}>
          <Text style={{ color: ch.color, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>
            {meta} · {ch.readMin} {ru ? 'мин' : 'min'}
          </Text>
          <Text style={{ color: rp.text, fontFamily: ff, fontSize: Math.round(28 * Math.min(scale, 1.25)), fontWeight: '800', letterSpacing: -0.5, lineHeight: Math.round(34 * Math.min(scale, 1.25)) }}>
            {ru ? ch.titleRu : ch.titleEn}
          </Text>

          {body.map((b, i) =>
            b.type === 'h' ? (
              <Text key={i} style={{ color: ch.color, fontFamily: ff, fontSize: Math.round(19 * scale), fontWeight: '800', letterSpacing: -0.2, lineHeight: Math.round(26 * scale), marginTop: 12 }}>
                {b.text}
              </Text>
            ) : (
              <Text key={i} style={{ color: rp.text, fontFamily: ff, fontSize: Math.round(16 * scale), lineHeight: Math.round(26 * scale) }}>
                {b.text}
              </Text>
            ),
          )}

          {/* Главное */}
          <View style={{ marginTop: 8, padding: 16, borderRadius: radius.lg, backgroundColor: ch.color + '14', borderWidth: 1, borderColor: ch.color + '3A' }}>
            <Text style={{ color: ch.color, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>
              {ru ? 'ГЛАВНОЕ' : 'KEY POINT'}
            </Text>
            <Text style={{ color: rp.text, fontFamily: ff, fontSize: Math.round(15 * scale), lineHeight: Math.round(22 * scale), fontWeight: '600' }}>
              {ru ? ch.takeawayRu : ch.takeawayEn}
            </Text>
          </View>

          {/* Next */}
          <Pressable onPress={goNext}
            style={{ marginTop: 14, backgroundColor: ch.color, borderRadius: radius.lg, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              {next
                ? (ru ? 'Следующая глава →' : 'Next chapter →')
                : (ru ? '🎉 Ты прошёл книгу — к оглавлению' : '🎉 You finished — back to contents')}
            </Text>
          </Pressable>

          <Text style={{ color: rp.dim, fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: 'center' }}>
            {ru
              ? 'Книга «Выдох» — образовательная поддержка, не медицинская услуга.'
              : '«Exhale» is educational support, not a medical service.'}
          </Text>
        </View>
      </ScrollView>

      <ReaderSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        prefs={prefs}
        accent={ch.color}
        ru={ru}
        t={t}
        onChange={(patch) => setState((s) => ({ ...s, readerPrefs: { ...(s.readerPrefs ?? DEFAULT_READER_PREFS), ...patch } }))}
      />
    </SafeAreaView>
  );
}

// ── Настройки чтения ───────────────────────────────────────────────────────
function ReaderSettings({
  visible, onClose, prefs, onChange, accent, ru, t,
}: {
  visible: boolean; onClose: () => void; prefs: ReaderPrefs;
  onChange: (p: Partial<ReaderPrefs>) => void; accent: string; ru: boolean; t: ReturnType<typeof useTheme>;
}) {
  const FONTS: { key: ReaderPrefs['font']; ru: string; en: string }[] = [
    { key: 'system', ru: 'Стандарт', en: 'Default' },
    { key: 'serif', ru: 'С засечками', en: 'Serif' },
    { key: 'rounded', ru: 'Округлый', en: 'Rounded' },
  ];
  const PAPERS: { key: ReaderPrefs['paper']; ru: string; en: string }[] = [
    { key: 'auto', ru: 'Как в системе', en: 'System' },
    { key: 'sepia', ru: 'Тёплый', en: 'Warm' },
  ];
  const Chip = ({ active, label, onPress, fontFamily }: { active: boolean; label: string; onPress: () => void; fontFamily?: string }) => (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ flex: 1, paddingVertical: 11, borderRadius: radius.md, alignItems: 'center',
        backgroundColor: active ? accent : t.bgElev, borderWidth: 1, borderColor: active ? accent : t.border }}>
      <Text style={{ color: active ? '#fff' : t.text, fontSize: 14, fontWeight: '700', fontFamily }}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 34, gap: 18 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: t.border }} />
          </View>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>
            {ru ? 'Чтение' : 'Reading'}
          </Text>

          {/* Размер */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{ru ? 'РАЗМЕР' : 'SIZE'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => { Haptics.selectionAsync(); onChange({ size: clamp(prefs.size - 1, 0, SIZE_SCALE.length - 1) }); }}
                style={{ width: 52, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>А−</Text>
              </Pressable>
              <View style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                {SIZE_SCALE.map((_, i) => (
                  <View key={i} style={{ width: i === prefs.size ? 12 : 8, height: i === prefs.size ? 12 : 8, borderRadius: 6, backgroundColor: i <= prefs.size ? accent : t.border }} />
                ))}
              </View>
              <Pressable onPress={() => { Haptics.selectionAsync(); onChange({ size: clamp(prefs.size + 1, 0, SIZE_SCALE.length - 1) }); }}
                style={{ width: 52, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>А+</Text>
              </Pressable>
            </View>
          </View>

          {/* Шрифт */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{ru ? 'ШРИФТ' : 'FONT'}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FONTS.map((f) => (
                <Chip key={f.key} active={prefs.font === f.key} label={ru ? f.ru : f.en} fontFamily={FONT_FAMILY[f.key]} onPress={() => onChange({ font: f.key })} />
              ))}
            </View>
          </View>

          {/* Фон */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{ru ? 'ФОН' : 'BACKGROUND'}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {PAPERS.map((p) => (
                <Chip key={p.key} active={prefs.paper === p.key} label={ru ? p.ru : p.en} onPress={() => onChange({ paper: p.key })} />
              ))}
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
