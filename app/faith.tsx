import { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { GlassCard } from '../components/GlassCard';
import { Icon } from '../components/Icon';

const PRAYERS_RU = [
  {
    id: 'craving_short',
    title: 'Короткая молитва при тяге (30 сек)',
    body:
'Господи Иисусе Христе, Сыне Божий,\nпомилуй меня, грешного.\nИзбави от страсти курения,\nдай силы пройти этот час.',
    note: 'Иисусова молитва — повторяй медленно 10–20 раз, дыша вместе со словами. Хорошо ложится на cyclic sighing.',
  },
  {
    id: 'morning',
    title: 'Утренняя молитва Оптинских старцев',
    body:
'Господи, дай мне с душевным спокойствием встретить всё, что принесёт мне сегодняшний день.\nДай мне всецело предаться воле Твоей святой.\nВо всякий час сего дня во всём наставь и поддержи меня.\nКакие бы я ни получал известия в течение дня, научи меня принять их со спокойной душой и твёрдым убеждением, что на всё святая воля Твоя.\nВо всех словах и делах моих руководи моими мыслями и чувствами.\nВо всех непредвиденных случаях не дай мне забыть, что всё ниспослано Тобою.\nДай мне прямо и разумно действовать с каждым ближним моим, никого не смущая и не огорчая.\nГосподи, дай мне силу перенести утомление наступающего дня и все события в течение дня.\nРуководи моею волею и научи меня молиться, верить, надеяться, терпеть, прощать и любить. Аминь.',
    note: 'Утром, перед кофе. 2 минуты — и день начинается из правильной точки.',
  },
  {
    id: 'evening',
    title: 'Краткая вечерняя молитва',
    body:
'Господи, благодарю Тебя за прошедший день,\nза всё, что было — и за то, что я не закурил.\nПрости мне срывы, малые и большие.\nДай мне сон тихий и завтра — снова свободу от страсти.',
    note: 'Перед сном — благодарность, не вина. Это не отчёт перед судьёй.',
  },
  {
    id: 'st_boniface',
    title: 'Молитва святому Вонифатию (от страстей)',
    body:
'Святый мучениче Вонифатие!\nК тебе, скорому помощнику и тёплому молитвеннику о тех, кто страдает страстью пьянства и иных пагубных привычек,\nсо смирением припадаем.\nИспроси у Господа избавление от страсти курения,\nдабы дух наш не был порабощён никакой плотской привычке,\nно служил Богу в чистоте и крепости. Аминь.',
    note: 'Святой Вонифатий — традиционно к нему обращаются с молитвой о свободе от любой страсти, включая курение.',
  },
];

const SCRIPTURE_RU = [
  {
    ref: '1 Кор. 6:12',
    text: '«Всё мне позволительно, но не всё полезно; всё мне позволительно, но ничто не должно обладать мною».',
  },
  {
    ref: '1 Кор. 6:19–20',
    text: '«Не знаете ли, что тела ваши суть храм живущего в вас Святаго Духа, Которого имеете вы от Бога, и вы не свои? Ибо вы куплены дорогою ценою. Посему прославляйте Бога и в телах ваших».',
  },
  {
    ref: 'Гал. 5:1',
    text: '«Итак стойте в свободе, которую даровал нам Христос, и не подвергайтесь опять игу рабства».',
  },
  {
    ref: 'Флп. 4:13',
    text: '«Всё могу в укрепляющем меня Иисусе Христе».',
  },
];

export default function Faith() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>('craving_short');
  const cur = PRAYERS_RU.find((p) => p.id === selectedPrayer) ?? PRAYERS_RU[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 14, paddingBottom: 40 }}>
        <LinearGradient colors={['#FF950038', '#FF950008']}
          style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.cross size={56} color="#FF9500" />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
          {tr('faith.title')}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          Когда тяга — попробуй прочитать молитву вместе с медленным дыханием. Не ритуал, а опора.
        </Text>

        {/* Prayer selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {PRAYERS_RU.map((p) => {
            const sel = selectedPrayer === p.id;
            return (
              <Pressable key={p.id} onPress={() => setSelectedPrayer(p.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                  backgroundColor: sel ? '#FF9500' : t.bgElev,
                  borderWidth: 1, borderColor: sel ? '#FF9500' : t.border,
                }}>
                <Text style={{ color: sel ? '#fff' : t.text, fontSize: 13, fontWeight: '700' }}>{p.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected prayer */}
        <GlassCard>
          <Text style={{ color: '#FF9500', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            Молитва
          </Text>
          <Text style={{ color: t.text, fontSize: 17, lineHeight: 28, marginTop: 12, fontStyle: 'italic' }}>
            {cur.body}
          </Text>
          {cur.note && (
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.border }}>
              <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>{cur.note}</Text>
            </View>
          )}
        </GlassCard>

        {/* Scripture */}
        <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginLeft: 6 }}>
          Из Писания
        </Text>
        {SCRIPTURE_RU.map((s) => (
          <GlassCard key={s.ref}>
            <Text style={{ color: '#FF9500', fontSize: 12, fontWeight: '700' }}>{s.ref}</Text>
            <Text style={{ color: t.text, fontSize: 15, lineHeight: 23, marginTop: 8 }}>{s.text}</Text>
          </GlassCard>
        ))}

        <GlassCard>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Шаг исповеди</Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
            Если ты воцерковлён — назови курение своей страстью и принеси на исповеди. Это снимает чувство стыда и возвращает благодать. Святитель Феофан Затворник: «Страсть побеждается покаянием, молитвой и трудом».
          </Text>
        </GlassCard>

        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={{ marginTop: 16, padding: 16, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{tr('common.done')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
