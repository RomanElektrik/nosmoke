// Achievements screen — the badge wall. Unlocked badges are in colour;
// locked ones are dimmed with a progress bar, so there is always something
// close to unlock (Kwit / Smoke Free pattern).
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState } from '../lib/storage';
import { Icon } from '../components/Icon';
import {
  ACHIEVEMENTS, CATEGORY_LABEL, buildContext, achProgress, isAchUnlocked,
  type AchCategory,
} from '../lib/achievements';

const ORDER: AchCategory[] = ['time', 'health', 'cigs', 'money', 'engagement', 'recovery'];

export default function Achievements() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const ctx = buildContext(state);
  const stored = state.achievements ?? {};

  const unlockedCount = ACHIEVEMENTS.filter((a) => stored[a.id] || isAchUnlocked(a, ctx)).length;

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
            {ru ? 'Достижения' : 'Achievements'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, marginTop: 4 }}>
            {ru ? `Открыто ${unlockedCount} из ${ACHIEVEMENTS.length}` : `${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}
          </Text>
          <View style={{ height: 8, borderRadius: 8, backgroundColor: t.border, overflow: 'hidden', marginTop: 10 }}>
            <View style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`, height: '100%', backgroundColor: t.accent }} />
          </View>
        </View>

        {ORDER.map((cat, ci) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat);
          return (
            <Animated.View key={cat} entering={FadeInDown.delay(ci * 50).duration(280)} style={{ gap: 10 }}>
              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
                {ru ? CATEGORY_LABEL[cat].ru : CATEGORY_LABEL[cat].en}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {items.map((a) => {
                  const unlocked = !!stored[a.id] || isAchUnlocked(a, ctx);
                  const prog = achProgress(a, ctx);
                  const I = Icon[a.icon];
                  return (
                    <View key={a.id} style={{
                      width: '47.8%',
                      backgroundColor: t.bgElev,
                      borderRadius: radius.lg,
                      borderWidth: 1, borderColor: unlocked ? a.color + '60' : t.border,
                      padding: 14, gap: 8,
                    }}>
                      <View style={{
                        width: 46, height: 46, borderRadius: 14,
                        backgroundColor: unlocked ? a.color + '22' : t.border + '70',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <I size={24} color={unlocked ? a.color : t.textDim} />
                      </View>
                      <Text style={{
                        color: unlocked ? t.text : t.textDim, fontSize: 14, fontWeight: '700',
                      }} numberOfLines={2}>
                        {ru ? a.titleRu : a.titleEn}
                      </Text>
                      <Text style={{ color: t.textDim, fontSize: 11, lineHeight: 15 }} numberOfLines={2}>
                        {ru ? a.descRu : a.descEn}
                      </Text>
                      {unlocked ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Icon.check size={12} color={a.color} />
                          <Text style={{ color: a.color, fontSize: 11, fontWeight: '800' }}>
                            {ru ? 'Открыто' : 'Unlocked'}
                          </Text>
                        </View>
                      ) : (
                        <View style={{ height: 5, borderRadius: 5, backgroundColor: t.border, overflow: 'hidden' }}>
                          <View style={{ width: `${prog * 100}%`, height: '100%', backgroundColor: a.color }} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
