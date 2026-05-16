import { View, Text } from 'react-native';
import { GlassCard } from './GlassCard';
import { useTheme } from '../lib/theme';

export function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  const t = useTheme();
  return (
    <GlassCard style={{ flex: 1 }}>
      <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
      <Text style={{ color: accent ? t.accent : t.text, fontSize: 26, fontWeight: '700', marginTop: 6, letterSpacing: -0.5 }}>{value}</Text>
      {hint ? <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4 }}>{hint}</Text> : null}
    </GlassCard>
  );
}
