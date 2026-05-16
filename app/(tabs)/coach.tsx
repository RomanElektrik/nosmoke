// AI assistant — mode picker. Picking a mode pushes /chat?mode=<x>
// (separate stack screen so iOS edge-swipe-back works).

import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { Icon, type IconKey } from '../../components/Icon';
import type { CoachMode } from '../../lib/ai';
import { SwipeToHome } from '../../components/SwipeToHome';

const MODES: { v: CoachMode; icon: IconKey; color: string; titleRu: string; titleEn: string; subRu: string; subEn: string }[] = [
  { v: 'support',      icon: 'wave2',  color: '#0A84FF', titleRu: 'Поддержи сейчас',  titleEn: 'Support now',     subRu: 'когда тянет',  subEn: 'when craving hits' },
  { v: 'analyze_slip', icon: 'feather',color: '#FF9500', titleRu: 'Разбери срыв',     titleEn: 'Analyze a slip',  subRu: 'без осуждения', subEn: 'no shame' },
  { v: 'daily_task',   icon: 'spark',  color: '#30D158', titleRu: 'Задание на день',  titleEn: 'Task for today',  subRu: '≤ 2 минуты',    subEn: '≤ 2 minutes' },
];

export default function Coach() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();

  function open(m: CoachMode) {
    Haptics.selectionAsync();
    router.push(`/chat?mode=${m}` as any);
  }

  return (
    <SwipeToHome>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 14 }}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.8, marginVertical: 8 }}>
          {tr('coach.title')}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, marginTop: 4 }}>
          {lang === 'ru' ? 'У каждого режима — свой чат и своя память.' : 'Each mode has its own chat and memory.'}
        </Text>

        <View style={{ gap: 12, marginTop: 8 }}>
          {MODES.map((m) => {
            const lastMsg = state.chatHistories?.[m.v]?.slice(-1)[0]?.content;
            const count = state.chatHistories?.[m.v]?.length ?? 0;
            return (
              <Pressable key={m.v} onPress={() => open(m.v)}>
                <LinearGradient colors={[m.color + '30', m.color + '08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: m.color + '40', flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <View style={{
                    width: 52, height: 52, borderRadius: 16, backgroundColor: m.color + '24',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {(() => { const I = Icon[m.icon]; return <I size={28} color={m.color} />; })()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 }}>
                      {lang === 'ru' ? m.titleRu : m.titleEn}
                    </Text>
                    <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                      {count > 0 && lastMsg ? lastMsg.slice(0, 60) : (lang === 'ru' ? m.subRu : m.subEn)}
                    </Text>
                    {count > 0 && (
                      <Text style={{ color: m.color, fontSize: 11, marginTop: 4, fontWeight: '700' }}>
                        {lang === 'ru' ? `${count} сообщ.` : `${count} msgs`}
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: m.color, fontSize: 20, fontWeight: '700' }}>→</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ color: t.textDim, fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 }}>
          {tr('coach.disclaimer')}
        </Text>
      </ScrollView>
    </SafeAreaView>
    </SwipeToHome>
  );
}
