import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { TECHNIQUES, Technique } from '../../lib/techniques';
import { Icon } from '../../components/Icon';

// Core techniques in the techniques tab.
// SOS-kit items (cyclic_sigh, box_breath, urge_surf, halt, grounding) live ONLY
// under the SOS button — too noisy as separate cards (Cochrane: no standalone effect).
// Fagerström is a one-off onboarding step, not a daily card.
const ORDER = [
  'pharma', 'nrt', 'taper',     // pharmacology — strongest evidence (RR 1.6–2.3)
  'ema', 'money', 'contract',   // tools you actually use daily
  'reframe', 'if_then', 'cbt',  // CBT core
  'mindfulness',                // 10-min daily practice
  'replace', 'faith',           // optional supportive
];

const HIDDEN = new Set(['cyclic_sigh', 'box_breath', 'urge_surf', 'halt', 'grounding', 'fagerstrom']);

export default function Techniques() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const lang = currentLang();
  const [open, setOpen] = useState<Technique | null>(null);

  const sorted = TECHNIQUES
    .filter((te) => !HIDDEN.has(te.id))
    .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  function go(te: Technique) {
    if (!te.practice) return;
    Haptics.selectionAsync();
    if (te.practice === 'money') router.push('/goal');
    else if (te.practice === 'ema') router.push('/journal');
    else router.push(`/practice/${te.practice}` as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.8, marginBottom: 4 }}>
          {tr('tech.title')}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, marginBottom: 14 }}>
          {lang === 'ru'
            ? 'Все техники доказательные. Кнопка справа — пройти прямо сейчас.'
            : 'Every technique is evidence-based. Button on the right runs it now.'}
        </Text>

        <View style={{
          padding: 12, borderRadius: radius.md,
          backgroundColor: t.danger + '14', borderWidth: 1, borderColor: t.danger + '30',
          flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
        }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.danger + '24', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.flame size={16} color={t.danger} />
          </View>
          <Text style={{ color: t.text, fontSize: 13, flex: 1, lineHeight: 18 }}>
            {lang === 'ru'
              ? 'Дыхание, скольжение по тяге, заземление и Чек 4 нужд — под кнопкой «Хочу курить» на главной.'
              : 'Breathing, urge surfing, grounding & HALT live under "I want to smoke" on home.'}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {sorted.map((te) => <Row key={te.id} te={te} onOpen={() => setOpen(te)} onGo={() => go(te)} />)}
        </View>
      </ScrollView>

      <Modal visible={!!open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
          {open && <Detail te={open} onClose={() => setOpen(null)} onStart={() => { const tt = open; setOpen(null); go(tt); }} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ te, onOpen, onGo }: { te: Technique; onOpen: () => void; onGo: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const IconComp = Icon[te.icon];

  // CTA label by practice kind
  const ctaRu = te.practice === 'money' ? 'Поставить цель'
    : te.practice === 'ema' ? 'Открыть дневник'
    : te.practice === 'pharma' || te.practice === 'fagerstrom' || te.practice === 'nrt' ? 'Открыть'
    : te.practice ? 'Сделать' : 'Подробнее';
  const ctaEn = te.practice === 'money' ? 'Set goal'
    : te.practice === 'ema' ? 'Open journal'
    : te.practice === 'pharma' || te.practice === 'fagerstrom' || te.practice === 'nrt' ? 'Open'
    : te.practice ? 'Do it' : 'Read';

  return (
    <Pressable onPress={onOpen}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: radius.lg,
        backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
      }}>
        <View style={{
          width: 44, height: 44, borderRadius: 12, backgroundColor: te.color + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComp size={22} color={te.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
            {tr(te.titleKey)}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
            {tr(te.summaryKey)}
          </Text>
        </View>
        <Pressable onPress={(e) => { e.stopPropagation(); te.practice ? onGo() : onOpen(); }}
          style={{
            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
            backgroundColor: te.practice ? te.color : t.border,
          }}>
          <Text style={{ color: te.practice ? '#fff' : t.text, fontSize: 12, fontWeight: '700' }}>
            {lang === 'ru' ? ctaRu : ctaEn}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function Detail({ te, onClose, onStart }: { te: Technique; onClose: () => void; onStart: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const IconComp = Icon[te.icon];

  const ctaRu = te.practice === 'money' ? 'Поставить цель'
    : te.practice === 'ema' ? 'Открыть дневник'
    : te.practice ? 'Начать' : null;
  const ctaEn = te.practice === 'money' ? 'Set goal'
    : te.practice === 'ema' ? 'Open journal'
    : te.practice ? 'Start' : null;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16, paddingBottom: 60 }}>
      <LinearGradient colors={[te.color + '40', te.color + '10']}
        style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
        <IconComp size={52} color={te.color} />
      </LinearGradient>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>{tr(te.titleKey)}</Text>
      <Text style={{ color: t.textDim, fontSize: 16, lineHeight: 22 }}>{tr(te.summaryKey)}</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip color={te.color}>{tr(`tech.evidence_${te.evidence}`)}</Chip>
        {!!te.durationMin && <Chip color={t.textDim}>{te.durationMin} {lang === 'ru' ? 'мин' : 'min'}</Chip>}
      </View>
      <Text style={{ color: t.text, fontSize: 15, lineHeight: 23, marginTop: 8 }}>{tr(te.bodyKey)}</Text>
      {ctaRu && (
        <Pressable onPress={onStart}
          style={{ marginTop: 12, padding: 18, borderRadius: radius.xl, backgroundColor: te.color, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{lang === 'ru' ? ctaRu : ctaEn}</Text>
        </Pressable>
      )}
      <Pressable onPress={onClose} style={{ marginTop: 4, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: t.textDim, fontWeight: '600' }}>{tr('common.done')}</Text>
      </Pressable>
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
