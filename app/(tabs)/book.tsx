// Книга «Выдох» — обложка, прогресс, поиск, оглавление, закладки.
// Вступление открыто всем; 10 глав — за Премиум. Прогресс/закладки — в storage.
import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { Icon } from '../../components/Icon';
import { useAppState } from '../../lib/storage';
import { usePremium } from '../../lib/subscription';
import { CHAPTERS, BOOK_META, TOTAL_CHAPTERS, type BookChapter } from '../../lib/book';

function snippetFor(ch: BookChapter, q: string): string | null {
  const fields = [ch.titleRu, ch.leadRu, ...ch.bodyRu.map((b) => b.text)];
  for (const f of fields) {
    const i = f.toLowerCase().indexOf(q);
    if (i >= 0) {
      const start = Math.max(0, i - 28);
      return (start > 0 ? '…' : '') + f.slice(start, i + q.length + 52).trim() + '…';
    }
  }
  return null;
}

export default function BookTab() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const premium = usePremium();
  const [state] = useAppState();
  const [query, setQuery] = useState('');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  const progress = state.bookProgress ?? {};
  const bookmarks = state.bookmarks ?? [];
  const readChapters = CHAPTERS.filter((c) => c.number > 0 && progress[c.id]).length;
  const pct = Math.round((readChapters / TOTAL_CHAPTERS) * 100);

  // «Продолжить» — первая непрочитанная секция по порядку; если всё прочитано —
  // последняя глава.
  const continueCh = CHAPTERS.find((c) => !progress[c.id]) ?? CHAPTERS[CHAPTERS.length - 1];

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return null;
    return CHAPTERS.map((ch) => ({ ch, snip: snippetFor(ch, q) })).filter((r) => r.snip);
  }, [q]);

  const visible = onlyBookmarks ? CHAPTERS.filter((c) => bookmarks.includes(c.id)) : CHAPTERS;

  const open = (ch: BookChapter) => {
    Haptics.selectionAsync();
    const locked = !ch.free && !premium;
    router.push((locked ? '/paywall' : `/chapter/${ch.id}`) as any);
  };

  const Row = ({ ch, snip }: { ch: BookChapter; snip?: string | null }) => {
    const locked = !ch.free && !premium;
    const read = !!progress[ch.id];
    const marked = bookmarks.includes(ch.id);
    const I = Icon[ch.icon];
    return (
      <Pressable onPress={() => open(ch)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, borderRadius: radius.lg }}>
        <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: ch.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
          {ch.number === 0 ? <I size={22} color={ch.color} />
            : <Text style={{ color: ch.color, fontSize: 18, fontWeight: '800' }}>{ch.number}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, flex: 1 }} numberOfLines={2}>
              {ru ? ch.titleRu : ch.titleEn}
            </Text>
            {marked && <Icon.star size={15} color={ch.color} />}
            {read && <Icon.check size={16} color={t.accent} />}
            {locked && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: t.warn + '24', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Icon.star size={10} color={t.warn} />
                <Text style={{ color: t.warn, fontSize: 9, fontWeight: '800' }}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 3, lineHeight: 18 }} numberOfLines={2}>
            {snip ?? (ru ? ch.leadRu : ch.leadEn)}
          </Text>
          <Text style={{ color: ch.color, fontSize: 11, fontWeight: '700', marginTop: 5 }}>
            {ch.number === 0 ? (ru ? 'Вступление' : 'Intro') : `${ru ? 'Глава' : 'Ch.'} ${ch.number}`} · {ch.readMin} {ru ? 'мин' : 'min'}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        {/* Cover */}
        <LinearGradient colors={['#1B4A38', '#0E2A20']} style={{ paddingTop: 40, paddingBottom: 26, paddingHorizontal: spacing.lg }}>
          <Text style={{ color: '#7FE3B0', fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>{ru ? 'КНИГА' : 'BOOK'}</Text>
          <Text style={{ color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1, marginTop: 6 }}>
            {ru ? BOOK_META.titleRu : BOOK_META.titleEn}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14.5, lineHeight: 21, marginTop: 8, maxWidth: 320 }}>
            {ru ? BOOK_META.subtitleRu : BOOK_META.subtitleEn}
          </Text>

          {/* Progress + continue */}
          <View style={{ marginTop: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' }}>
                {ru ? 'Прочитано' : 'Read'}: {readChapters}/{TOTAL_CHAPTERS}
              </Text>
              <Text style={{ color: '#7FE3B0', fontSize: 12, fontWeight: '800' }}>{pct}%</Text>
            </View>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(pct, 2)}%`, height: '100%', backgroundColor: '#34C759', borderRadius: 4 }} />
            </View>
            <Pressable onPress={() => open(continueCh)}
              style={{ marginTop: 6, backgroundColor: '#fff', borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#0E2A20', fontSize: 16, fontWeight: '800' }}>
                {readChapters === 0
                  ? (ru ? 'Начать читать' : 'Start reading')
                  : (ru ? `Продолжить · ${continueCh.number === 0 ? (ru ? 'вступление' : 'intro') : 'гл. ' + continueCh.number}` : `Continue · ${continueCh.number === 0 ? 'intro' : 'ch. ' + continueCh.number}`)}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.lg, gap: 14 }}>
          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, borderRadius: radius.lg, paddingHorizontal: 14, height: 46 }}>
            <Text style={{ fontSize: 16, color: t.textDim }}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={ru ? 'Поиск по книге' : 'Search the book'}
              placeholderTextColor={t.textDim}
              style={{ flex: 1, color: t.text, fontSize: 15 }}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Text style={{ color: t.textDim, fontSize: 18 }}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Search results */}
          {results ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
                {results.length > 0
                  ? `${ru ? 'НАЙДЕНО' : 'FOUND'}: ${results.length}`
                  : (ru ? 'НИЧЕГО НЕ НАЙДЕНО' : 'NOTHING FOUND')}
              </Text>
              {results.map(({ ch, snip }) => <Row key={ch.id} ch={ch} snip={snip} />)}
            </View>
          ) : (
            <>
              {/* Bookmarks filter */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => { Haptics.selectionAsync(); setOnlyBookmarks(false); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: onlyBookmarks ? t.bgElev : t.accent, borderWidth: 1, borderColor: onlyBookmarks ? t.border : t.accent }}>
                  <Text style={{ color: onlyBookmarks ? t.text : '#fff', fontSize: 13, fontWeight: '700' }}>{ru ? 'Все главы' : 'All chapters'}</Text>
                </Pressable>
                <Pressable onPress={() => { Haptics.selectionAsync(); setOnlyBookmarks(true); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: onlyBookmarks ? t.accent : t.bgElev, borderWidth: 1, borderColor: onlyBookmarks ? t.accent : t.border }}>
                  <Icon.star size={13} color={onlyBookmarks ? '#fff' : t.textDim} />
                  <Text style={{ color: onlyBookmarks ? '#fff' : t.text, fontSize: 13, fontWeight: '700' }}>{ru ? 'Закладки' : 'Saved'} {bookmarks.length > 0 ? `· ${bookmarks.length}` : ''}</Text>
                </Pressable>
              </View>

              {onlyBookmarks && visible.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
                  <Icon.star size={30} color={t.textDim} />
                  <Text style={{ color: t.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                    {ru ? 'Пока нет закладок. Открой главу и нажми ☆ вверху, чтобы сохранить.' : 'No bookmarks yet. Open a chapter and tap ☆ to save it.'}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {visible.map((ch, i) => (
                    <Animated.View key={ch.id} entering={FadeInDown.delay(Math.min(i, 8) * 40).duration(260)}>
                      <Row ch={ch} />
                    </Animated.View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
