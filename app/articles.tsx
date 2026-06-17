// Knowledge base — list of coping articles, grouped by category.
import { ScrollView, View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { Icon } from '../components/Icon';
import { ARTICLES, ARTICLE_CATEGORY, ARTICLE_IMAGES, articleAspect, type ArticleCategory } from '../lib/articles';
import { usePremium } from '../lib/subscription';

const ORDER: ArticleCategory[] = ['craving', 'slip', 'triggers', 'body', 'meds', 'motivation'];

export default function Articles() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const premium = usePremium();
  // Free = the first 3 articles AS DISPLAYED (the list is grouped by category,
  // so an array-order slice could leave the top cards locked). Building the flat
  // display order guarantees the top 3 of the list are always free.
  const displayOrder = ORDER.flatMap((cat) => ARTICLES.filter((a) => a.category === cat));
  const freeIds = new Set([
    ...displayOrder.slice(0, 3).map((a) => a.id),
    // 🔴 Безопасность лекарств — НИКОГДА не за деньги (wellness-правило проекта):
    // противопоказания и «назначает только врач» должны быть доступны бесплатно.
    ...ARTICLES.filter((a) => a.category === 'meds').map((a) => a.id),
  ]);

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
                const locked = !premium && !freeIds.has(a.id);
                return (
                  <Pressable key={a.id} onPress={() => router.push((locked ? '/paywall' : `/article/${a.id}`) as any)}
                    style={{
                      backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
                      borderRadius: radius.lg, overflow: 'hidden',
                    }}>
                    {img
                      ? <Image source={img} style={{ width: '100%', height: 210, opacity: locked ? 0.55 : 1 }} resizeMode="cover" />
                      : <View style={{ width: '100%', height: 210, backgroundColor: a.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                          <I size={48} color={a.color} />
                        </View>}
                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3, flex: 1 }} numberOfLines={2}>
                          {ru ? a.titleRu : a.titleEn}
                        </Text>
                        {locked && (
                          <View style={{
                            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
                            backgroundColor: t.warn + '24', flexDirection: 'row', alignItems: 'center', gap: 4,
                          }}>
                            <Icon.star size={11} color={t.warn} />
                            <Text style={{ color: t.warn, fontSize: 10, fontWeight: '800' }}>PRO</Text>
                          </View>
                        )}
                      </View>
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
