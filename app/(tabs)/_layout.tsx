import { Tabs } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useTranslation } from '../../lib/i18n';
import { Icon } from '../../components/Icon';

export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.bgElev,
          borderTopColor: t.border,
          height: 84,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textDim,
      }}
    >
      <Tabs.Screen name="index"      options={{ title: tr('tabs.home'),       tabBarIcon: ({ color }) => <Icon.home    size={24} color={color} /> }} />
      <Tabs.Screen name="health"     options={{ title: tr('tabs.health'),     tabBarIcon: ({ color }) => <Icon.pulse   size={24} color={color} /> }} />
      <Tabs.Screen name="techniques" options={{ title: tr('tabs.techniques'), tabBarIcon: ({ color }) => <Icon.toolbox size={24} color={color} /> }} />
      <Tabs.Screen name="coach"      options={{ title: tr('tabs.coach'),      tabBarIcon: ({ color }) => <Icon.chat    size={24} color={color} /> }} />
      <Tabs.Screen name="profile"    options={{ title: tr('tabs.profile'),    tabBarIcon: ({ color }) => <Icon.user    size={24} color={color} /> }} />
    </Tabs>
  );
}
