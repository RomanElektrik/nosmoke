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
            <Animated.View key={cat} entering={FadeInDown.delay(ci * 50).duration(280)} style={{ gap: 12 }}>
              <Text style={{
                color: t.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginLeft: 2, marginTop: 6,
              }}>
                {ru ? CATEGORY_LABEL[cat].ru : CATEGORY_LABEL[cat].en}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {items.map((a) => {
                  const unlocked = !!stored[a.id] || isAchUnlocked(a, ctx);
                  const prog = achProgress(a, ctx);
                  const I = Icon[a.icon];
                  return (
                    <View key={a.id} style={{ width: '47.8%', borderRadius: radius.xl, overflow: 'hidden', height: 170, ...(unlocked ? { shadowColor: a.color, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } } : {}) }}>
                      {/* Background — saturated for unlocked, muted for locked */}
                      {unlocked ? (
                        <LinearGradient colors={[a.color, a.color + 'AA', '#0A0E13']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1.2 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                      ) : (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, borderRadius: radius.xl }} />
                      )}
                      {/* Soft halo */}
                      {unlocked && <View style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFFFF14' }} />}
                      {/* Icon */}
                      <View style={{ position: 'absolute', top: 14, left: 14, width: 50, height: 50, borderRadius: 25, backgroundColor: unlocked ? '#FFFFFF22' : a.color + '14', alignItems: 'center', justifyContent: 'center' }}>
                        <I size={26} color={unlocked ? '#fff' : a.color + '70'} />
                      </View>
                      {/* Lock indicator for locked */}
                      {!unlocked && (
                        <View style={{ position: 'absolute', top: 14, right: 14, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: t.border }}>
                          <Text style={{ color: t.textDim, fontSize: 10, fontWeight: '800' }}>{Math.round(prog * 100)}%</Text>
                        </View>
                      )}
                      {/* Text */}
                      <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12, gap: 4 }}>
                        <Text style={{ color: unlocked ? '#fff' : t.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={2}>
                          {ru ? a.titleRu : a.titleEn}
                        </Text>
                        <Text style={{ color: unlocked ? '#FFFFFFC8' : t.textDim, fontSize: 11, lineHeight: 14 }} numberOfLines={2}>
                          {ru ? a.descRu : a.descEn}
                        </Text>
                        {!unlocked && (
                          <View style={{ height: 4, borderRadius: 4, backgroundColor: t.border, overflow: 'hidden', marginTop: 4 }}>
                            <View style={{ width: `${prog * 100}%`, height: '100%', backgroundColor: a.color, borderRadius: 4 }} />
                          </View>
                        )}
                      </View>
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
