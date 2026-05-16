import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation } from '../../lib/i18n';
import { Icon } from '../../components/Icon';

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient
        colors={[t.accentSoft, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 480 }}
      />
      <SafeAreaView style={{ flex: 1, padding: spacing.lg, justifyContent: 'space-between' }}>
        <View style={{ marginTop: 80 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <Icon.leaf size={36} color={t.accent} />
          </View>
          <Text style={{ color: t.text, fontSize: 44, fontWeight: '700', letterSpacing: -1.2, lineHeight: 50 }}>
            {tr('onb.welcome_title')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 18, marginTop: 16, lineHeight: 26 }}>
            {tr('onb.welcome_sub')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 32, lineHeight: 20 }}>
            {tr('onb.promise')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 16, lineHeight: 17, opacity: 0.8 }}>
            {tr('onb.health_disclaimer')}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(onboarding)/quiz')}
          style={({ pressed }) => ({
            backgroundColor: t.accent,
            borderRadius: radius.xl,
            paddingVertical: 18,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{tr('onb.welcome_cta')}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
