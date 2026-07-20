// Web-вариант читалки (react-native-pager-view не поддерживает web и валит
// бандл). Простой скролл-ридер в sepia-теме — для web-превью и скриншотов;
// нативная читалка со свайпами живёт в [id].tsx.
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getChapter, chapterBody, BOOK_META } from '../../lib/book';
import { currentLang } from '../../lib/i18n';
import { usePremium } from '../../lib/subscription';

const T = { bg: '#F5EDDE', text: '#2A2118', dim: '#8A7B66', card: '#EDE2CC', border: '#DFD2B8' };

export default function ChapterWeb() {
  const router = useRouter();
  const premium = usePremium();
  // Язык как в нативной читалке — раньше был захардкожен RU, и EN-юзер
  // видел русскую книгу в web-версии.
  const ru = currentLang() === 'ru';
  const { id } = useLocalSearchParams<{ id: string }>();
  // Неизвестный id → intro (как в нативе), а не пустой белый экран.
  const ch = getChapter(String(id ?? 'intro')) ?? getChapter('intro');
  // back() без истории (прямой deep-link) запирал юзера — фолбэк на табы.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  if (!ch) return null;
  // Премиум-гейт как в нативной читалке: web-бандл не должен раздавать
  // платные главы бесплатно.
  if (!ch.free && !premium) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
        <Text style={{ color: T.text, fontSize: 24, fontWeight: '800', textAlign: 'center', fontFamily: 'Georgia' }}>{ru ? ch.titleRu : (ch.titleEn ?? ch.titleRu)}</Text>
        <Text style={{ color: T.dim, fontSize: 16, textAlign: 'center' }}>{ru ? 'Эта глава открывается с Премиумом.' : 'This chapter unlocks with Premium.'}</Text>
        <Pressable onPress={() => router.push('/paywall')} style={{ backgroundColor: '#1DB85A', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{ru ? 'Открыть Премиум' : 'Unlock Premium'}</Text>
        </Pressable>
        <Pressable onPress={goBack} hitSlop={10}><Text style={{ color: T.dim }}>{ru ? 'Назад' : 'Back'}</Text></Pressable>
      </View>
    );
  }
  const blocks = chapterBody(ch, ru);
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 54, paddingHorizontal: 18, paddingBottom: 10 }}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Text style={{ fontSize: 26, color: T.dim }}>‹</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', color: T.dim, fontSize: 14 }}>{ru ? BOOK_META.titleRu : BOOK_META.titleEn}</Text>
        <Text style={{ fontSize: 20, color: T.dim }}>☆</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}>
        {ch.number > 0 && (
          <Text style={{ color: T.dim, fontSize: 13, letterSpacing: 1.2, marginTop: 18, textTransform: 'uppercase' }}>
            {ru ? 'Глава' : 'Chapter'} {ch.number} · {ch.readMin} {ru ? 'мин' : 'min'}
          </Text>
        )}
        <Text style={{ color: T.text, fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 8, fontFamily: 'Georgia' }}>
          {ru ? ch.titleRu : (ch.titleEn ?? ch.titleRu)}
        </Text>
        <Text style={{ color: T.dim, fontSize: 17, lineHeight: 26, marginTop: 14, fontStyle: 'italic', fontFamily: 'Georgia' }}>
          {ru ? ch.leadRu : (ch.leadEn ?? ch.leadRu)}
        </Text>
        {blocks.map((b, i) =>
          b.type === 'h' ? (
            <Text key={i} style={{ color: T.text, fontSize: 22, fontWeight: '700', marginTop: 26, fontFamily: 'Georgia' }}>{b.text}</Text>
          ) : (
            <Text key={i} style={{ color: T.text, fontSize: 19, lineHeight: 32, marginTop: 16, fontFamily: 'Georgia' }}>{b.text}</Text>
          )
        )}
        <View style={{ backgroundColor: T.card, borderColor: T.border, borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 30 }}>
          <Text style={{ color: T.dim, fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>{ru ? 'ГЛАВНОЕ' : 'KEY TAKEAWAY'}</Text>
          <Text style={{ color: T.text, fontSize: 17, lineHeight: 27, fontFamily: 'Georgia' }}>{ru ? ch.takeawayRu : (ch.takeawayEn ?? ch.takeawayRu)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
