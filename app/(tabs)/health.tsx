import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { MILESTONES, secondsClean, progressFor, Milestone } from '../../lib/health';
import { formatDuration } from '../../lib/money';
import { Icon } from '../../components/Icon';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.8, marginVertical: 8 }}>
          {tr('health.title')}
        </Text>

        {next && <Hero m={next} secs={secs} lang={lang} />}

        <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 24, marginBottom: 12, marginLeft: 6 }}>
          {lang === 'ru' ? 'Таймлайн' : 'Timeline'}
        </Text>

        <View style={{ paddingLeft: 22 }}>
          {MILESTONES.map((m, i) => {
            const reached = m.at <= secs;
            const isLast = i === MILESTONES.length - 1;
            const isNext = next?.id === m.id;
            const IconComp = Icon[m.icon];
            return (
              <Pressable key={m.id} onPress={() => { Haptics.selectionAsync(); setOpen(m); }}>
                <View style={{ flexDirection: 'row', minHeight: 72, paddingVertical: 4 }}>
                  {/* dot column */}
                  <View style={{ width: 28, alignItems: 'center', marginLeft: -22 }}>
                    {!isLast && (
                      <View style={{ position: 'absolute', top: 22, bottom: -8, width: 2, backgroundColor: reached ? m.color + '60' : t.border }} />
                    )}
                    <View style={{
                      width: isNext ? 22 : 16, height: isNext ? 22 : 16, borderRadius: 11,
                      backgroundColor: reached ? m.color : t.bg,
                      borderWidth: 2, borderColor: reached ? m.color : (isNext ? m.color : t.border),
                      marginTop: 18,
                      shadowColor: reached || isNext ? m.color : 'transparent',
                      shadowOpacity: 0.5, shadowRadius: 8,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {reached && <Icon.check size={12} color="#fff" />}
                    </View>
                  </View>
                  {/* card */}
                  <View style={{
                    flex: 1, marginLeft: 14, marginBottom: 8,
                    padding: 12, borderRadius: radius.md,
                    backgroundColor: reached ? m.color + '14' : t.bgElev,
                    borderWidth: 1, borderColor: reached ? m.color + '30' : t.border,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}>
                    <View style={{
                      width: 38, height: 38, borderRadius: 12,
                      backgroundColor: reached ? m.color + '24' : t.border,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconComp size={20} color={reached ? m.color : t.textDim} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                        {tr(m.titleKey)}
                      </Text>
                      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                        {labelFor(m, secs, lang, tr)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(null)}>
        {open && <DetailSheet m={open} secs={secs} lang={lang} onClose={() => setOpen(null)} />}
      </Modal>
    </SafeAreaView>
  );
}

function labelFor(m: Milestone, secs: number, lang: 'ru' | 'en', tr: any): string {
  if (m.at <= secs) return lang === 'ru' ? 'Готово' : 'Done';
  return tr('health.in', { time: formatDuration(m.at - secs, lang) });
}

function Hero({ m, secs, lang }: { m: Milestone; secs: number; lang: 'ru' | 'en' }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const pr = progressFor(m, secs);
  const IconComp = Icon[m.icon];
  return (
    <LinearGradient colors={[m.color + '38', m.color + '08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.lg, padding: 22, borderWidth: 1, borderColor: m.color + '40', marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{
          width: 60, height: 60, borderRadius: 18, backgroundColor: m.color + '24',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComp size={32} color={m.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            {lang === 'ru' ? 'Следующая веха' : 'Next milestone'}
          </Text>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginTop: 2, letterSpacing: -0.3 }}>
            {tr(m.titleKey)}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{Math.round(pr * 100)}%</Text>
          <Text style={{ color: t.textDim, fontSize: 13 }}>
            {tr('health.in', { time: formatDuration(m.at - secs, lang) })}
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          <LinearGradient colors={[m.color, m.color + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: `${pr * 100}%`, height: '100%' }} />
        </View>
      </View>
    </LinearGradient>
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
            {reached ? (lang === 'ru' ? 'Готово' : 'Reached') : tr('health.in', { time: formatDuration(m.at - secs, lang) })}
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
