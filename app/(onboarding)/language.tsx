import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { setLanguage } from '../../lib/i18n';
import { marketForLang } from '../../lib/subscription';
import { update } from '../../lib/storage';
import { Icon } from '../../components/Icon';

// Самый первый экран приложения — явный выбор языка. Двуязычный по определению:
// ни одной строки через i18n, потому что язык на этом шаге ещё не выбран.
export default function LanguagePick() {
  const t = useTheme();
  const router = useRouter();

  const pick = async (l: 'ru' | 'en') => {
    Haptics.selectionAsync();
    setLanguage(l);
    // Источник правды — корневое поле AppState: профиля на этом шаге ещё нет
    // (он создаётся в квизе). Дублируем в profile.language, если профиль вдруг есть.
    await update((prev) => ({
      ...prev,
      lang: l,
      // Рынок фиксируется здесь НАВСЕГДА: дальше смена языка интерфейса в
      // профиле меняет только язык, но не платёжную модель.
      market: marketForLang(l),
      profile: prev.profile ? { ...prev.profile, language: l } : prev.profile,
    }));
    router.replace('/(onboarding)/welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient
        colors={[t.accent + '26', 'transparent']}
        style={{ position: 'absolute', top: -120, left: -80, right: -80, height: 560, borderRadius: 320 }}
      />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'space-between' }}>
        <View style={{ marginTop: 56 }}>
          <View style={{
            width: 74, height: 74, borderRadius: 23,
            backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
            alignItems: 'center', justifyContent: 'center', marginBottom: 30,
            shadowColor: t.accent, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
          }}>
            <Icon.wind size={40} color={t.accent} />
          </View>

          <Text style={{ color: t.accent, fontSize: 12.5, fontWeight: '800', letterSpacing: 1.6 }}>БРИЗ · BREEZE</Text>
          <Text style={{ color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.9, lineHeight: 40, marginTop: 12 }}>
            Выберите язык
          </Text>
          <Text style={{ color: t.textDim, fontSize: 20, fontWeight: '700', lineHeight: 26, marginTop: 4 }}>
            Choose your language
          </Text>
        </View>

        <View style={{ gap: 12, paddingBottom: 8 }}>
          {([['ru', 'Русский'], ['en', 'English']] as const).map(([code, label]) => (
            <Pressable
              key={code}
              onPress={() => pick(code)}
              style={({ pressed }) => ({
                backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
                borderRadius: radius.lg, paddingVertical: 20, paddingHorizontal: spacing.lg,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <Text style={{ color: t.text, fontSize: 19, fontWeight: '700' }}>{label}</Text>
              <Icon.arrowRight size={20} color={t.textDim} />
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
