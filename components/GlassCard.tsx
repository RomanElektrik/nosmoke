import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme, radius } from '../lib/theme';
import { useColorScheme } from 'react-native';

export function GlassCard({ style, children, ...rest }: ViewProps) {
  const t = useTheme();
  const scheme = useColorScheme();
  return (
    <BlurView
      intensity={40}
      tint={scheme === 'dark' ? 'dark' : 'light'}
      style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}
      {...(rest as any)}
    >
      <View style={{ padding: 16 }}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
});
