// "Награды" tab — the achievements wall in the «Атмосфера» style.
// Reuses achievements logic: ACHIEVEMENTS, buildContext, achProgress, isAchUnlocked.
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { Icon } from '../../components/Icon';
import {
  ACHIEVEMENTS, CATEGORY_LABEL, buildContext, achProgress, isAchUnlocked,
  type AchCategory,
} from '../../lib/achievements';

const ORDER: AchCategory[] = ['time', 'health', 'cigs', 'money', 'engagement', 'recovery'];

export default function AwardsTab() {
  const t = useTheme();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const ctx = buildContext(state);
  const stored = state.achievements ?? {};

  const unlockedCount = ACHIEVEMENTS.filter((a) => stored[a.id] || isAchUnlocked(a, ctx)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient
        colors={[t.accentSoft, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 140, gap: 16 }}>
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 }}>
            {ru ? 'Награды' : 'Awards'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 2 }}>
            {ru ? `Открыто ${unlockedCount} из ${ACHIEVEMENTS.length}` : `${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}
          </Text>
          <View style={{ height: 8, borderRadius: 8, backgroundColor: t.border, overflow: 'hidden', marginTop: 10 }}>
            <View style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`, height: '100%', backgroundColor: t.accent }} />
          </View>
        </View>

        {ORDER.map((cat, ci) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat);
          if (items.length === 0) return null;
          return (
            <Animated.View key={cat} entering={FadeInDown.delay(ci * 50).duration(280)} style={{ gap: 10 }}>
              <Text style={{
                color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.4,
                textTransform: 'uppercase', marginLeft: 6,
              }}>
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
                      backgroundColor: t.card,
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
                      <Text style={{ color: unlocked ? t.text : t.textDim, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>
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
