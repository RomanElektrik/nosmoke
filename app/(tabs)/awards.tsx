// "Награды" tab — the achievements wall in the «Атмосфера» style.
// Reuses achievements logic: ACHIEVEMENTS, buildContext, achProgress, isAchUnlocked.
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
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
                  const gid = `ach_${a.id}`;
                  // Тема-зависимые цвета карточки: в тёмной — премиум-тёмная база
                  // со светлым текстом; в светлой — светлая карта с тёмным текстом,
                  // цветное сияние (белое на свету не видно).
                  const dk = t.dark;
                  const baseHi = dk ? '#12161D' : '#FFFFFF';
                  const baseLo = dk ? '#0F131A' : '#F0F0F5';
                  const lockHi = dk ? '#161B23' : '#ECECF1';
                  const lockLo = dk ? '#10141B' : '#E4E4EB';
                  const glow = dk ? '#FFFFFF' : a.color;
                  const badgeBg = unlocked ? (dk ? '#FFFFFF1E' : a.color + '22') : (dk ? '#FFFFFF0A' : '#0000000A');
                  const iconCol = unlocked ? (dk ? '#fff' : a.color) : a.color + (dk ? '66' : '99');
                  const pctBg = dk ? '#00000055' : '#FFFFFFCC';
                  const trackBg = dk ? '#FFFFFF14' : '#00000012';
                  return (
                    <View key={a.id} style={{ width: '47.8%', borderRadius: radius.xl, overflow: 'hidden', height: 178, borderWidth: dk ? 0 : 1, borderColor: t.border, ...(unlocked ? { shadowColor: a.color, shadowOpacity: dk ? 0.4 : 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } } : {}) }}>
                      <LinearGradient
                        colors={unlocked ? [a.color + (dk ? '4D' : '2E'), baseHi, baseLo] : [lockHi, lockLo]}
                        locations={unlocked ? [0, 0.62, 1] : [0, 1]}
                        start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Defs>
                          <RadialGradient id={gid} cx="74%" cy="20%" r="60%">
                            <Stop offset="0" stopColor={glow} stopOpacity={unlocked ? (dk ? 0.38 : 0.5) : 0.06} />
                            <Stop offset="36%" stopColor={a.color} stopOpacity={unlocked ? 1 : 0.18} />
                            <Stop offset="100%" stopColor={a.color} stopOpacity={0} />
                          </RadialGradient>
                        </Defs>
                        <Circle cx="76%" cy="18%" r="46%" fill={`url(#${gid})`} />
                      </Svg>
                      {/* Icon bottom of orb zone */}
                      <View style={{ position: 'absolute', top: 14, left: 14, width: 44, height: 44, borderRadius: 15, backgroundColor: badgeBg, alignItems: 'center', justifyContent: 'center' }}>
                        <I size={24} color={iconCol} />
                      </View>
                      {!unlocked && (
                        <View style={{ position: 'absolute', top: 16, right: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: pctBg }}>
                          <Text style={{ color: t.textDim, fontSize: 10, fontWeight: '800' }}>{Math.round(prog * 100)}%</Text>
                        </View>
                      )}
                      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 13, gap: 4 }}>
                        <Text style={{ color: unlocked ? t.text : t.textDim, fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={2}>
                          {ru ? a.titleRu : a.titleEn}
                        </Text>
                        <Text style={{ color: t.textDim, fontSize: 11, lineHeight: 14 }} numberOfLines={2}>
                          {ru ? a.descRu : a.descEn}
                        </Text>
                        {!unlocked && (
                          <View style={{ height: 4, borderRadius: 4, backgroundColor: trackBg, overflow: 'hidden', marginTop: 4 }}>
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
