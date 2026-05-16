// Design-style picker. 5 styles differing in colour AND form (corner radius,
// borders, flat vs elevated). Live preview per style.
import { useColorScheme, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius, THEME_LIST, setThemeId, getThemeId, type ThemeStyle } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { Icon } from '../components/Icon';

export default function Appearance() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const scheme = useColorScheme();
  const [state] = useAppState();
  const active = (state.profile?.themeId as string) || getThemeId();

  async function pick(id: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setThemeId(id as any);
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, themeId: id } : s.profile,
    }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 14, paddingBottom: 50 }}>
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.7 }}>
          {ru ? 'Оформление' : 'Appearance'}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {ru
            ? 'Пять стилей — отличаются не только цветом, но и формой: углы, рамки, характер карточек. Светлая/тёмная подбирается под систему.'
            : 'Five styles — they differ not only in colour but in form: corners, borders, card character. Light/dark follows the system.'}
        </Text>

        {THEME_LIST.map((ts) => (
          <ThemeRow key={ts.id} ts={ts} dark={scheme === 'dark'} ru={ru}
            selected={active === ts.id} accent={t.accent} text={t.text} textDim={t.textDim}
            onPick={() => pick(ts.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeRow({ ts, dark, ru, selected, accent, text, textDim, onPick }: {
  ts: ThemeStyle; dark: boolean; ru: boolean; selected: boolean;
  accent: string; text: string; textDim: string; onPick: () => void;
}) {
  const p = dark ? ts.dark : ts.light;
  const sh = ts.shape;
  return (
    <Pressable onPress={onPick}
      style={{
        borderRadius: radius.lg,
        borderWidth: 2, borderColor: selected ? accent : 'transparent',
        overflow: 'hidden',
      }}>
      {/* Live preview rendered in this style's own palette + shape */}
      <View style={{ backgroundColor: p.bg, padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: p.text, fontSize: 17, fontWeight: '700' }}>
            {ru ? ts.nameRu : ts.nameEn}
          </Text>
          {selected && (
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.check size={13} color="#fff" />
            </View>
          )}
        </View>

        {/* mini cards */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{
            flex: 1, height: 52, backgroundColor: p.bgElev, borderRadius: sh.md,
            borderWidth: ts.borderW, borderColor: p.border,
            ...(ts.cardFlat ? {} : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }),
            padding: 8, justifyContent: 'center', gap: 5,
          }}>
            <View style={{ width: '70%', height: 6, borderRadius: 3, backgroundColor: p.textDim, opacity: 0.5 }} />
            <View style={{ width: '45%', height: 6, borderRadius: 3, backgroundColor: p.textDim, opacity: 0.3 }} />
          </View>
          <View style={{
            width: 52, height: 52, backgroundColor: p.accentSoft, borderRadius: sh.md,
            borderWidth: ts.borderW, borderColor: p.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{ width: 22, height: 22, borderRadius: sh.sm, backgroundColor: p.accent }} />
          </View>
        </View>

        {/* accent pill row */}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: sh.xl, backgroundColor: p.accent }}>
            <View style={{ width: 30, height: 5, borderRadius: 3, backgroundColor: '#fff', opacity: 0.9 }} />
          </View>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.warn }} />
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.info }} />
        </View>

        <Text style={{ color: p.textDim, fontSize: 12, lineHeight: 17 }}>
          {ru ? ts.descRu : ts.descEn}
        </Text>
      </View>
    </Pressable>
  );
}
