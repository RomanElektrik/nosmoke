// Knowledge base — list of coping articles, grouped by category.
import { ScrollView, View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { Icon } from '../components/Icon';
import { ARTICLES, ARTICLE_CATEGORY, ARTICLE_IMAGES, type ArticleCategory } from '../lib/articles';

const ORDER: ArticleCategory[] = ['craving', 'slip', 'triggers', 'body', 'meds', 'motivation'];

export default function Articles() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 50, gap: 18 }}>
        <View>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }}>
            {ru ? 'Знание' : 'Knowledge'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, marginTop: 4, lineHeight: 21 }}>
            {ru
              ? 'Короткие статьи о том, как справляться. Доказательно, без воды.'
              : 'Short articles on how to cope. Evidence-based, no fluff.'}
          </Text>
        </View>

        {ORDER.map((cat, ci) => {
          const items = ARTICLES.filter((a) => a.category === cat);
          if (items.length === 0) return null;
          const meta = ARTICLE_CATEGORY[cat];
          return (
            <Animated.View key={cat} entering={FadeInDown.delay(ci * 50).duration(280)} style={{ gap: 10 }}>
              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 }}>
                {ru ? meta.ru : meta.en}
              </Text>
              {items.map((a) => {
                const I = Icon[a.icon];
                const img = ARTICLE_IMAGES[a.id];
                return (
                  <Pressable key={a.id} onPress={() => router.push(`/article/${a.id}` as any)}
                    style={{
                      backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
                      borderRadius: radius.lg, overflow: 'hidden',
                    }}>
                    {img
                      ? <Image source={img} style={{ width: '100%', aspectRatio: 1.75 }} resizeMode="cover" />
                      : <View style={{ width: '100%', aspectRatio: 1.75, backgroundColor: a.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                          <I size={44} color={a.color} />
                        </View>}
                    <View style={{ padding: 14 }}>
                      <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={2}>
                        {ru ? a.titleRu : a.titleEn}
                      </Text>
                      <Text style={{ color: t.textDim, fontSize: 13, marginTop: 4, lineHeight: 19 }} numberOfLines={2}>
                        {ru ? a.leadRu : a.leadEn}
                      </Text>
                      <Text style={{ color: a.color, fontSize: 12, fontWeight: '700', marginTop: 8 }}>
                        {a.readMin} {ru ? 'мин чтения' : 'min read'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
