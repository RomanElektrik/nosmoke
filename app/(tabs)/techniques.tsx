import { useState, useRef } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { TECHNIQUES, Technique } from '../../lib/techniques';
import { isTechniquePremium, usePremium } from '../../lib/subscription';
import { Icon, IconKey } from '../../components/Icon';
import { SwipeToHome } from '../../components/SwipeToHome';
import { PRACTICES } from '../../lib/audioPractice';

const ORDER = [
  'box_breath', 'cyclic_sigh',
  'halt_check',
  'faith',
];

// Everything not in the ORDER list above is hidden. Cognitive/pharma/
// reference items removed — they were справка, not practices. urge_surf,
// replace and if_then removed — filler / replaced by the personal SOS toolkit.
const HIDDEN = new Set<string>([
  'pharma', 'nrt', 'taper', 'fagerstrom',
  'ema', 'money', 'contract',
  'reframe', 'cbt', 'if_then',
  'mindfulness', 'grounding',
  'urge_surf', 'replace',
]);

// Top tabs.
const TABS = [
  { id: 'audio',   ru: 'Аудиопрактики', en: 'Audio' },
  { id: 'breath',  ru: 'Дыхание',       en: 'Breathing' },
  { id: 'support', ru: 'Поддержка',     en: 'Support' },
] as const;
type TabId = (typeof TABS)[number]['id'];

// Tab membership. All voiced sessions live under «Аудиопрактики»; breathing
// under «Дыхание»; «Поддержка» = молитва/писание (+ HALT-чек).
const BREATH_TECH = ['box_breath', 'cyclic_sigh'];
const SUPPORT_TECH = ['faith', 'halt_check'];

export default function Techniques() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const lang = currentLang();
  const [open, setOpen] = useState<Technique | null>(null);
  const [tab, setTab] = useState<TabId>('audio');
  const premium = usePremium();
  const navLock = useRef(false);

  // Guard against double-taps stacking multiple player screens (overlapping audio).
  function openAudio(pid: string) {
    if (navLock.current) return;
    navLock.current = true;
    setTimeout(() => { navLock.current = false; }, 700);
    Haptics.selectionAsync();
    router.push(`/audio/${pid}` as any);
  }

  const sorted = TECHNIQUES
    .filter((te) => !HIDDEN.has(te.id))
    .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  const audioItems = PRACTICES;
  const breathTech = sorted.filter((te) => BREATH_TECH.includes(te.id));
  const supportTech = sorted.filter((te) => SUPPORT_TECH.includes(te.id));

  function go(te: Technique) {
    Haptics.selectionAsync();
    // Faith has no /practice screen — it's its own full-screen route.
    if (te.id === 'faith') { router.push('/faith'); return; }
    if (!te.practice) return;
    if (!premium && isTechniquePremium(te.id, te.tags)) {
      router.push('/paywall' as any);
      return;
    }
    if (te.practice === 'money') router.push('/goal');
    else if (te.practice === 'ema') router.push('/journal');
    else router.push(`/practice/${te.practice}` as any);
  }

  return (
    <SwipeToHome>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 14 }}>
          <Text style={{ color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8 }}>
            {tr('tech.title')}
          </Text>
        </View>

        {/* Segmented tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: 18 }}>
          {TABS.map((tb) => {
            const on = tab === tb.id;
            return (
              <Pressable key={tb.id} onPress={() => { Haptics.selectionAsync(); setTab(tb.id); }}
                style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 4, borderRadius: 14, alignItems: 'center',
                  backgroundColor: on ? t.accent : t.bgElev, borderWidth: 1, borderColor: on ? t.accent : t.border }}>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
                  style={{ color: on ? '#fff' : t.textDim, fontWeight: on ? '800' : '600', fontSize: 13 }}>{lang === 'ru' ? tb.ru : tb.en}</Text>
              </Pressable>
            );
          })}
        </View>

        <Animated.View key={tab} entering={FadeInDown.duration(280)} style={{ paddingHorizontal: spacing.lg, gap: 12 }}>
          {tab === 'audio' && audioItems.map((p) => (
            <AudioCard key={p.id} p={p} openAudio={openAudio} lang={lang} />
          ))}

          {tab === 'breath' && breathTech.map((te) => (
            <TechCard key={te.id} te={te} lang={lang} tr={tr}
              locked={!premium && isTechniquePremium(te.id, te.tags)}
              onOpen={() => setOpen(te)} onGo={() => go(te)} />
          ))}

          {tab === 'support' && supportTech.map((te) => (
            <TechCard key={te.id} te={te} lang={lang} tr={tr}
              locked={!premium && isTechniquePremium(te.id, te.tags)}
              onOpen={() => setOpen(te)} onGo={() => go(te)} />
          ))}
        </Animated.View>
      </ScrollView>

      <Modal visible={!!open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
          {open && (
            <Detail te={open} lang={lang} tr={tr}
              onClose={() => setOpen(null)}
              onStart={() => { const te = open; setOpen(null); go(te); }} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </SwipeToHome>
  );
}

// Full-width voiced-session card — gradient per practice colour, name + short
// description, play affordance. No "voice" badge (it's obviously audio here).
function AudioCard({ p, openAudio, lang }: {
  p: (typeof PRACTICES)[number]; openAudio: (id: string) => void; lang: 'ru' | 'en';
}) {
  const I = Icon[p.icon];
  return (
    <Pressable onPress={() => openAudio(p.id)}
      style={({ pressed }) => ({ minHeight: 188, borderRadius: radius.xl, overflow: 'hidden', opacity: pressed ? 0.93 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      {/* muted: soft colour wash fading into dark, not a bright slab */}
      <LinearGradient colors={[p.color + '4D', '#161C24', '#0F141A']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1.1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: p.color + '1A' }} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, gap: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: p.color + '2E', borderWidth: 1, borderColor: p.color + '4D', alignItems: 'center', justifyContent: 'center' }}>
          <I size={32} color={p.color} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ color: '#F2F6FA', fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 27 }} numberOfLines={2}>{lang === 'ru' ? p.titleRu : p.titleEn}</Text>
          <Text style={{ color: '#A8B2BE', fontSize: 13.5, lineHeight: 18 }} numberOfLines={2}>{lang === 'ru' ? p.subRu : p.subEn}</Text>
          <Text style={{ color: p.color, fontSize: 11.5, fontWeight: '800', marginTop: 2 }}>{p.minutes} {lang === 'ru' ? 'мин' : 'min'}</Text>
        </View>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 0, height: 0, borderTopWidth: 9, borderBottomWidth: 9, borderLeftWidth: 15, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 4 }} />
        </View>
      </View>
    </Pressable>
  );
}

function TechCard({ te, lang, tr, onOpen, onGo, locked }: {
  te: Technique; lang: 'ru' | 'en'; tr: any; onOpen: () => void; onGo: () => void; locked?: boolean;
}) {
  const t = useTheme();
  const IconComp = Icon[te.icon];

  const evidenceLabel = lang === 'ru'
    ? (te.evidence === 'A' ? 'Доказано' : te.evidence === 'B' ? 'Подтверждено' : 'Поддержка')
    : (te.evidence === 'A' ? 'Proven' : te.evidence === 'B' ? 'Confirmed' : 'Supportive');

  return (
    <Pressable onPress={() => (te.practice || te.id === 'faith' ? onGo() : onOpen())}
      style={({ pressed }) => ({ borderRadius: radius.xl, overflow: 'hidden', opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      {/* Tall, colorful card — each technique gets its own gradient atmosphere */}
      <View style={{ height: 168, position: 'relative' }}>
        <LinearGradient colors={[te.color, te.color + '99', '#0A0E13']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1.2 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {/* Soft halo behind the icon — feels alive */}
        <View style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFFFF14' }} />
        <View style={{ position: 'absolute', top: 14, right: 14, width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFFFFF1A', alignItems: 'center', justifyContent: 'center' }}>
          <IconComp size={44} color="#fff" />
        </View>

        {/* Bottom info layer */}
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#0008' }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>{evidenceLabel}</Text>
            </View>
            {!!te.durationMin && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#0008' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{te.durationMin} {lang === 'ru' ? 'мин' : 'min'}</Text>
              </View>
            )}
            {locked && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#FFD60A', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon.star size={10} color="#000" />
                <Text style={{ color: '#000', fontSize: 10, fontWeight: '800' }}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }} numberOfLines={1}>
            {tr(te.titleKey)}
          </Text>
          <Text style={{ color: '#FFFFFFC8', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
            {tr(te.summaryKey)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Renders a body text that may contain \n\n paragraph breaks as spaced paragraphs.
function Paragraphs({ text, color }: { text: string; color: string }) {
  const parts = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  return (
    <View style={{ gap: 10 }}>
      {parts.map((p, i) => (
        <Text key={i} style={{ color, fontSize: 15, lineHeight: 23 }}>{p}</Text>
      ))}
    </View>
  );
}

function Section({ icon, color, label, body }: {
  icon: IconKey; color: string; label: string; body: string;
}) {
  const t = useTheme();
  const IconComp = Icon[icon];
  return (
    <View style={{
      borderRadius: radius.lg, borderWidth: 1, borderColor: t.border,
      backgroundColor: t.bgElev, padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{
          width: 28, height: 28, borderRadius: 9,
          backgroundColor: color + '1E', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComp size={15} color={color} />
        </View>
        <Text style={{
          color: t.text, fontSize: 12, fontWeight: '800',
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {label}
        </Text>
      </View>
      <Paragraphs text={body} color={t.text} />
    </View>
  );
}

function Detail({ te, lang, tr, onClose, onStart }: {
  te: Technique; lang: 'ru' | 'en'; tr: any; onClose: () => void; onStart: () => void;
}) {
  const t = useTheme();
  const IconComp = Icon[te.icon];

  const ctaRu = te.practice === 'money' ? 'Поставить цель'
    : te.practice === 'ema' ? 'Открыть дневник'
    : te.practice ? 'Начать' : null;
  const ctaEn = te.practice === 'money' ? 'Set goal'
    : te.practice === 'ema' ? 'Open journal'
    : te.practice ? 'Start' : null;

  // Structured sections live under tech.<id>.{what,why,how}. i18next returns the
  // key itself when missing — treat that as absent and fall back to the plain body.
  const base = te.bodyKey.replace(/\.b$/, '');
  const resolve = (suffix: string): string | null => {
    const key = `${base}.${suffix}`;
    const val = tr(key);
    return val && val !== key ? val : null;
  };
  const what = resolve('what');
  const why = resolve('why');
  const how = resolve('how');
  const hasSections = !!(what || why || how);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <LinearGradient colors={[te.color + '40', te.color + '12']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', width: 64, height: 64 }} />
          <IconComp size={34} color={te.color} />
        </View>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, flex: 1 }}>{tr(te.titleKey)}</Text>
        <Pressable onPress={onClose} hitSlop={12} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.close size={16} color={t.textDim} />
        </Pressable>
      </View>
      <Text style={{ color: t.textDim, fontSize: 16, lineHeight: 22 }}>{tr(te.summaryKey)}</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip color={te.color}>{tr(`tech.evidence_${te.evidence}`)}</Chip>
        {!!te.durationMin && <Chip color={t.textDim}>{te.durationMin} {lang === 'ru' ? 'мин' : 'min'}</Chip>}
      </View>

      {hasSections ? (
        <View style={{ gap: 12, marginTop: 4 }}>
          {what && <Section icon="sparkle" color={te.color} label={tr('tech.sec_what')} body={what} />}
          {why && <Section icon="brain" color={t.info} label={tr('tech.sec_why')} body={why} />}
          {how && <Section icon="toolbox" color={t.accent} label={tr('tech.sec_how')} body={how} />}
        </View>
      ) : (
        <Paragraphs text={tr(te.bodyKey)} color={t.text} />
      )}

      {ctaRu && (
        <Pressable onPress={onStart}
          style={{ marginTop: 12, padding: 18, borderRadius: radius.xl, backgroundColor: te.color, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{lang === 'ru' ? ctaRu : ctaEn}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Chip({ color, children }: { color: string; children: any }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: color + '24' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>{children}</Text>
    </View>
  );
}
