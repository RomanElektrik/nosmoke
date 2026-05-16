// Article reader.
import { ScrollView, View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { Icon } from '../../components/Icon';
import { getArticle, ARTICLE_CATEGORY, ARTICLE_IMAGES } from '../../lib/articles';

export default function ArticleScreen() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = getArticle(id ?? '');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (!a) {
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

  const cat = ARTICLE_CATEGORY[a.category];
  const body = ru ? a.bodyRu : a.bodyEn;
  const I = Icon[a.icon];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={back} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {ARTICLE_IMAGES[a.id]
          ? <Image source={ARTICLE_IMAGES[a.id]} style={{ width: '100%', aspectRatio: 1.75 }} resizeMode="cover" />
          : <LinearGradient colors={[a.color + '38', a.color + '0A']}
              style={{ width: '100%', aspectRatio: 1.75, alignItems: 'center', justifyContent: 'center' }}>
              <I size={64} color={a.color} />
            </LinearGradient>}
      <View style={{ padding: spacing.lg, gap: 14 }}>
        <Text style={{ color: a.color, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
          {(ru ? cat.ru : cat.en)} · {a.readMin} {ru ? 'мин' : 'min'}
        </Text>
        <Text style={{ color: t.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, lineHeight: 33 }}>
          {ru ? a.titleRu : a.titleEn}
        </Text>

        {body.map((p, i) => (
          <Text key={i} style={{ color: t.text, fontSize: 16, lineHeight: 25 }}>{p}</Text>
        ))}

        {/* Takeaway */}
        <View style={{
          marginTop: 6, padding: 16, borderRadius: radius.lg,
          backgroundColor: a.color + '14', borderWidth: 1, borderColor: a.color + '3A',
        }}>
          <Text style={{ color: a.color, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            {ru ? 'Главное' : 'Key point'}
          </Text>
          <Text style={{ color: t.text, fontSize: 15, lineHeight: 22, fontWeight: '600' }}>
            {ru ? a.takeawayRu : a.takeawayEn}
          </Text>
        </View>

        <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
          {ru
            ? 'Справочная информация, не медицинская услуга. По вопросам лекарств и здоровья обращайся к врачу.'
            : 'Reference information, not a medical service. For medication and health questions, see a doctor.'}
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
