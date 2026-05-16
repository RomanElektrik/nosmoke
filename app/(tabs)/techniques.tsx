import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { TECHNIQUES, Technique } from '../../lib/techniques';
import { Icon } from '../../components/Icon';
import { SwipeToHome } from '../../components/SwipeToHome';

const ORDER = [
  'pharma', 'nrt', 'taper',
  'ema', 'money', 'contract',
  'reframe', 'if_then', 'cbt',
  'mindfulness',
  'replace', 'faith',
];

const HIDDEN = new Set(['cyclic_sigh', 'box_breath', 'urge_surf', 'halt', 'grounding', 'fagerstrom']);

// Group labels for visual sectioning
const GROUPS: { ids: string[]; labelRu: string; labelEn: string }[] = [
  { ids: ['pharma', 'nrt', 'taper'],          labelRu: 'Доказанная фармакология',   labelEn: 'Evidence-based pharmacology' },
  { ids: ['ema', 'money', 'contract'],         labelRu: 'Инструменты поддержки',     labelEn: 'Support tools' },
  { ids: ['reframe', 'if_then', 'cbt'],        labelRu: 'Когнитивные техники',       labelEn: 'Cognitive techniques' },
  { ids: ['mindfulness', 'replace', 'faith'],  labelRu: 'Практики и поддержка',      labelEn: 'Practice & support' },
];

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
    <SwipeToHome>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
          <Text style={{ color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8 }}>
            {tr('tech.title')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, marginTop: 4, lineHeight: 21 }}>
            {lang === 'ru'
              ? 'Все техники доказательные — наука за каждой.'
              : 'Every technique is evidence-based — science behind each.'}
          </Text>
        </View>

        {/* SOS banner */}
        <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <LinearGradient
            colors={[t.danger + '18', t.danger + '06']}
            style={{ borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: t.danger + '30', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.danger + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.flame size={18} color={t.danger} />
            </View>
            <Text style={{ color: t.text, fontSize: 13, flex: 1, lineHeight: 18 }}>
              {lang === 'ru'
                ? 'Дыхание, скольжение по тяге, заземление и Чек 4 нужд — под кнопкой «Хочу курить» на главной.'
                : 'Breathing, urge surfing, grounding & HALT live under "I want to smoke" on home.'}
            </Text>
          </LinearGradient>
        </View>

        {/* Grouped technique cards */}
        {GROUPS.map((group, gi) => {
          const items = sorted.filter((te) => group.ids.includes(te.id));
          if (!items.length) return null;
          return (
            <Animated.View key={gi} entering={FadeInDown.delay(gi * 60).duration(300)}>
              <Text style={{
                color: t.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 1.2, marginLeft: spacing.lg, marginBottom: 10, marginTop: gi > 0 ? 22 : 0,
              }}>
                {lang === 'ru' ? group.labelRu : group.labelEn}
              </Text>
              <View style={{ paddingHorizontal: spacing.lg, gap: 10 }}>
                {items.map((te) => (
                  <TechCard key={te.id} te={te} lang={lang} tr={tr}
                    onOpen={() => setOpen(te)} onGo={() => go(te)} />
                ))}
              </View>
            </Animated.View>
          );
        })}
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

function TechCard({ te, lang, tr, onOpen, onGo }: {
  te: Technique; lang: 'ru' | 'en'; tr: any; onOpen: () => void; onGo: () => void;
}) {
  const t = useTheme();
  const IconComp = Icon[te.icon];

  const evidenceLabel = lang === 'ru'
    ? (te.evidence === 'A' ? 'Высокий уровень' : te.evidence === 'B' ? 'Хороший уровень' : 'Поддерживающий')
    : (te.evidence === 'A' ? 'Strong evidence' : te.evidence === 'B' ? 'Good evidence' : 'Supportive');

  const ctaRu = te.practice === 'money' ? 'Поставить цель'
    : te.practice === 'ema' ? 'Дневник'
    : te.practice === 'pharma' || te.practice === 'nrt' ? 'Открыть'
    : te.practice ? 'Сделать' : 'Подробнее';
  const ctaEn = te.practice === 'money' ? 'Set goal'
    : te.practice === 'ema' ? 'Journal'
    : te.practice === 'pharma' || te.practice === 'nrt' ? 'Open'
    : te.practice ? 'Do it' : 'Read';

  return (
    <Pressable onPress={() => (te.practice ? onGo() : onOpen())}
      style={({ pressed }) => ({
        borderRadius: radius.lg, borderWidth: 1, borderColor: t.border,
        backgroundColor: t.bgElev, padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 14,
        opacity: pressed ? 0.85 : 1,
      })}>
      {/* Icon tile */}
      <View style={{
        width: 50, height: 50, borderRadius: 15, flexShrink: 0,
        backgroundColor: te.color + '1E', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconComp size={25} color={te.color} />
      </View>

      {/* Title + meta */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }} numberOfLines={1}>
          {tr(te.titleKey)}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2, lineHeight: 18 }} numberOfLines={1}>
          {tr(te.summaryKey)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: te.color }} />
          <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '600' }}>
            {evidenceLabel}{te.durationMin ? ` · ${te.durationMin} ${lang === 'ru' ? 'мин' : 'min'}` : ''}
          </Text>
        </View>
      </View>

      {/* Info / open detail */}
      <Pressable onPress={(e) => { e.stopPropagation(); onOpen(); }} hitSlop={10}
        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.border + '80', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.textDim, fontSize: 16, fontWeight: '700' }}>›</Text>
      </Pressable>
    </Pressable>
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
