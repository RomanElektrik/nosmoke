import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { MILESTONES, secondsClean, progressFor, Milestone } from '../../lib/health';
import { formatDuration } from '../../lib/money';
import { Icon } from '../../components/Icon';
import { SwipeToHome } from '../../components/SwipeToHome';

export default function Health() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const lang = currentLang();
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState<Milestone | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!state.profile) return null;
  const secs = secondsClean(state.profile.quitDate, now);
  const upcoming = MILESTONES.filter((m) => m.at > secs);
  const next = upcoming[0];
  const reached = MILESTONES.filter((m) => m.at <= secs);
  const future = MILESTONES.filter((m) => m.at > secs);

  return (
    <SwipeToHome>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Text style={{ color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8 }}>
            {tr('health.title')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, marginTop: 4, lineHeight: 21 }}>
            {lang === 'ru'
              ? 'Твой организм уже восстанавливается. Вот что происходит.'
              : 'Your body is already healing. Here is what is happening.'}
          </Text>
        </View>

        {/* Next milestone hero */}
        {next && (
          <Animated.View entering={FadeInDown.duration(300)} style={{ marginHorizontal: spacing.lg, marginTop: 18 }}>
            <Hero m={next} secs={secs} lang={lang} tr={tr} />
          </Animated.View>
        )}

        {/* Reached milestones */}
        {reached.length > 0 && (
          <Animated.View entering={FadeInDown.delay(60).duration(300)}>
            <SectionLabel label={lang === 'ru' ? 'Уже достигнуто' : 'Already reached'} />
            <View style={{ paddingHorizontal: spacing.lg, gap: 10 }}>
              {reached.map((m) => (
                <ReachedCard key={m.id} m={m} tr={tr}
                  onPress={() => { Haptics.selectionAsync(); setOpen(m); }} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Future milestones */}
        {future.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(300)}>
            <SectionLabel label={lang === 'ru' ? 'Впереди' : 'Coming up'} />
            <View style={{ paddingHorizontal: spacing.lg, gap: 10 }}>
              {future.map((m) => (
                <FutureCard key={m.id} m={m} secs={secs} lang={lang} tr={tr}
                  onPress={() => { Haptics.selectionAsync(); setOpen(m); }} />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Modal visible={!!open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(null)}>
        {open && <DetailSheet m={open} secs={secs} lang={lang} onClose={() => setOpen(null)} />}
      </Modal>
    </SafeAreaView>
    </SwipeToHome>
  );
}

function SectionLabel({ label }: { label: string }) {
  const t = useTheme();
  return (
    <Text style={{
      color: t.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: 1.2, marginLeft: spacing.lg, marginTop: 26, marginBottom: 10,
    }}>
      {label}
    </Text>
  );
}

function Hero({ m, secs, lang, tr }: { m: Milestone; secs: number; lang: 'ru' | 'en'; tr: any }) {
  const t = useTheme();
  const pr = progressFor(m, secs);
  const IconComp = Icon[m.icon];
  return (
    <LinearGradient colors={[m.color + '38', m.color + '08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: m.color + '40' }}>
      <Text style={{ color: m.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>
        {lang === 'ru' ? 'Следующая веха' : 'Next milestone'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <LinearGradient
          colors={[m.color + '40', m.color + '15']}
          style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <IconComp size={34} color={m.color} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3, lineHeight: 24 }}>
            {tr(m.titleKey)}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 13, marginTop: 4 }}>
            {tr('health.in', { time: formatDuration(m.at - secs, lang) })}
          </Text>
        </View>
      </View>
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{Math.round(pr * 100)}%</Text>
          <Text style={{ color: t.textDim, fontSize: 12 }}>
            {formatDuration(m.at - secs, lang)} {lang === 'ru' ? 'осталось' : 'left'}
          </Text>
        </View>
        <View style={{ height: 10, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 999, overflow: 'hidden' }}>
          <LinearGradient colors={[m.color, m.color + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: `${pr * 100}%`, height: '100%', borderRadius: 999 }} />
        </View>
      </View>
    </LinearGradient>
  );
}

function ReachedCard({ m, tr, onPress }: { m: Milestone; tr: any; onPress: () => void }) {
  const t = useTheme();
  const IconComp = Icon[m.icon];
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[m.color + '22', m.color + '08']}
        style={{ borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: m.color + '40', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <LinearGradient
          colors={[m.color + '50', m.color + '20']}
          style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconComp size={26} color={m.color} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }} numberOfLines={1}>
            {tr(m.titleKey)}
          </Text>
          <Text style={{ color: m.color, fontSize: 12, fontWeight: '700', marginTop: 3 }}>
            {'✓ '}{m.at < 3600 ? `${Math.round(m.at / 60)} мин` :
              m.at < 86400 ? `${Math.round(m.at / 3600)} ч` :
              m.at < 86400 * 30 ? `${Math.round(m.at / 86400)} дн` :
              `${Math.round(m.at / 86400 / 30)} мес`}
          </Text>
        </View>
        <Icon.arrowRight size={16} color={t.textDim} />
      </LinearGradient>
    </Pressable>
  );
}

function FutureCard({ m, secs, lang, tr, onPress }: {
  m: Milestone; secs: number; lang: 'ru' | 'en'; tr: any; onPress: () => void;
}) {
  const t = useTheme();
  const pr = progressFor(m, secs);
  const IconComp = Icon[m.icon];
  return (
    <Pressable onPress={onPress}>
      <View style={{ borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: t.border, backgroundColor: t.bgElev, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: m.color + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconComp size={24} color={m.color + 'AA'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
              {tr(m.titleKey)}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {tr('health.in', { time: formatDuration(m.at - secs, lang) })}
            </Text>
          </View>
          <Icon.arrowRight size={16} color={t.textDim} />
        </View>
        {pr > 0 && (
          <View style={{ height: 4, backgroundColor: t.border, borderRadius: 999, overflow: 'hidden' }}>
            <View style={{ width: `${pr * 100}%`, height: '100%', backgroundColor: m.color + '80', borderRadius: 999 }} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function DetailSheet({ m, secs, lang, onClose }: { m: Milestone; secs: number; lang: 'ru' | 'en'; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reached = m.at <= secs;
  const IconComp = Icon[m.icon];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16 }}>
        <LinearGradient colors={[m.color + '40', m.color + '10']}
          style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <IconComp size={52} color={m.color} />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>{tr(m.titleKey)}</Text>
        <View style={{
          alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
          backgroundColor: reached ? m.color + '24' : t.border,
        }}>
          <Text style={{ color: reached ? m.color : t.textDim, fontSize: 12, fontWeight: '700' }}>
            {reached ? (lang === 'ru' ? 'Достигнуто' : 'Reached') : tr('health.in', { time: formatDuration(m.at - secs, lang) })}
          </Text>
        </View>
        <Text style={{ color: t.text, fontSize: 16, lineHeight: 24, marginTop: 4 }}>{tr(m.bodyKey)}</Text>
        <Text style={{ color: t.textDim, fontSize: 12, marginTop: 12 }}>{tr('health.source', { src: m.source })}</Text>
        <Pressable onPress={onClose}
          style={{ marginTop: 24, padding: 16, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{tr('common.done')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
