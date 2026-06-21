import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing } from '../../lib/theme';
import { useTranslation } from '../../lib/i18n';
import { Icon } from '../../components/Icon';

// Стартовый экран онбординга — чистая премиальная подача в стиле «Гида по
// приложению»: зелёный eyebrow, крупный жирный заголовок, спокойное описание и
// одна зелёная кнопка. Без перегруза текстом.
export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Мягкий бренд-орб сверху */}
      <LinearGradient
        colors={[t.accent + '26', 'transparent']}
        style={{ position: 'absolute', top: -120, left: -80, right: -80, height: 560, borderRadius: 320 }}
      />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'space-between' }}>
        <View style={{ marginTop: 56 }}>
          {/* Бренд-значок — ветер */}
          <View style={{
            width: 74, height: 74, borderRadius: 23,
            backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
            alignItems: 'center', justifyContent: 'center', marginBottom: 30,
            shadowColor: t.accent, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
          }}>
            <Icon.wind size={40} color={t.accent} />
          </View>

          <Text style={{ color: t.accent, fontSize: 12.5, fontWeight: '800', letterSpacing: 1.6 }}>БРИЗ</Text>
          <Text style={{ color: t.text, fontSize: 40, fontWeight: '800', letterSpacing: -1.1, lineHeight: 45, marginTop: 12 }}>
            {tr('onb.welcome_title')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 16.5, lineHeight: 24, marginTop: 16 }}>
            {tr('onb.welcome_sub')}
          </Text>
        </View>

        <View style={{ gap: 16, paddingBottom: 8 }}>
          <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 17, opacity: 0.85 }}>
            {tr('onb.health_disclaimer')}
          </Text>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push('/(onboarding)/quiz'); }}
            style={({ pressed }) => ({
              backgroundColor: t.accent, borderRadius: 16, paddingVertical: 17, alignItems: 'center',
              opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }],
              shadowColor: t.accent, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
            })}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 }}>
              {tr('onb.welcome_cta')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
