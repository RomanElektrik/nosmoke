import { Tabs } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../lib/theme';
import { useTranslation } from '../../lib/i18n';
import { Icon } from '../../components/Icon';

// Tabs shown in the floating pill, in order. The SOS button is injected in
// the centre between index 1 (path) and index 2 (awards).
const PILL_TABS = [
  { name: 'index', labelKey: 'tabs.home', icon: 'home' as const },
  { name: 'path', labelKey: 'tabs.path', icon: 'leaf' as const },
  { name: 'awards', labelKey: 'tabs.awards', icon: 'star' as const },
  { name: 'profile', labelKey: 'tabs.profile', icon: 'user' as const },
];

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderTab = (cfg: (typeof PILL_TABS)[number]) => {
    const route = state.routes.find((r) => r.name === cfg.name);
    if (!route) return null;
    const routeIndex = state.routes.indexOf(route);
    const focused = state.index === routeIndex;
    const color = focused ? t.accent : t.textDim;
    const I = Icon[cfg.icon];
    return (
      <Pressable
        key={cfg.name}
        onPress={() => {
          Haptics.selectionAsync();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 6 }}
      >
        <I size={23} color={color} />
        <Text style={{ color, fontSize: 9, fontWeight: focused ? '700' : '500' }} numberOfLines={1}>
          {tr(cfg.labelKey)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 64,
          marginBottom: Math.max(insets.bottom, 14),
          marginHorizontal: 18,
          alignSelf: 'stretch',
          borderRadius: 32,
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 12,
          paddingHorizontal: 6,
        }}
      >
        {renderTab(PILL_TABS[0])}
        {renderTab(PILL_TABS[1])}

        {/* SOS button — inline with the other tabs */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/craving');
          }}
          style={({ pressed }) => ({
            flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3,
            paddingVertical: 6, opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{
            width: 30, height: 30, borderRadius: 15, backgroundColor: t.danger,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.flame size={18} color="#fff" />
          </View>
          <Text style={{ color: t.danger, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
            SOS
          </Text>
        </Pressable>

        {renderTab(PILL_TABS[2])}
        {renderTab(PILL_TABS[3])}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="path" />
      <Tabs.Screen name="awards" />
      <Tabs.Screen name="profile" />
      {/* Reachable via router.push but hidden from the pill */}
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="techniques" options={{ href: null }} />
      <Tabs.Screen name="coach" options={{ href: null }} />
    </Tabs>
  );
}
