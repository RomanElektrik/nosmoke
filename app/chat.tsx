// AI assistant chat — separate stack screen so iOS edge-swipe-back works.
// Per-mode persisted history. Inline deep-links from AI replies open practices.

import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { chat, ChatMessage, CoachMode } from '../lib/ai';
import { usePremium, FREE_AI_DAILY_LIMIT } from '../lib/subscription';
import { Icon, type IconKey } from '../components/Icon';

const MODE_META: Record<CoachMode, { icon: IconKey; color: string; ru: string; en: string }> = {
  support:      { icon: 'wave2',   color: '#0A84FF', ru: 'Поддержи сейчас', en: 'Support now' },
  analyze_slip: { icon: 'feather', color: '#FF9500', ru: 'Разбери срыв',    en: 'Analyze a slip' },
  daily_task:   { icon: 'spark',   color: '#30D158', ru: 'Задание на день', en: 'Task for today' },
};

const ROUTE_LABELS: Record<string, { ru: string; en: string; href: string }> = {
  cyclic_sigh:  { ru: 'Открыть дыхание (5 мин)',  en: 'Open breathing (5 min)',   href: '/practice/cyclic_sigh' },
  box_breath:   { ru: 'Открыть дыхание 4-4-4-4',   en: 'Open box breathing',       href: '/practice/box_breath' },
  urge_surf:    { ru: 'Прокатить волну тяги',      en: 'Surf the urge',            href: '/practice/urge_surf' },
  halt_check:   { ru: 'Чек 4 нужд (HALT)',         en: 'HALT check',               href: '/practice/halt_check' },
  grounding:    { ru: 'Заземление 5-4-3-2-1',      en: 'Grounding 5-4-3-2-1',      href: '/practice/grounding' },
  reframe:      { ru: 'Переписать мысль',          en: 'Reframe a thought',        href: '/practice/reframe' },
  if_then:      { ru: 'План «Если — то»',           en: 'If-then plan',             href: '/practice/if_then' },
  replace:      { ru: 'Замена ритуала',             en: 'Replace ritual',          href: '/practice/replace' },
  mindfulness:  { ru: 'Осознанность 10 мин',        en: 'Mindfulness 10 min',      href: '/practice/mindfulness' },
  pharma:       { ru: 'Открыть лекарства',          en: 'Open medications',        href: '/practice/pharma' },
  fagerstrom:   { ru: 'Тест Фагерстрёма',           en: 'Fagerström test',         href: '/practice/fagerstrom' },
  taper:        { ru: 'Постепенное снижение',        en: 'Taper plan',             href: '/practice/taper' },
  journal:      { ru: 'Открыть дневник',             en: 'Open journal',           href: '/journal' },
  goal:         { ru: 'Поставить цель',              en: 'Set a goal',             href: '/goal' },
  checkin:      { ru: 'Чек-ин дня',                  en: 'Daily check-in',         href: '/checkin' },
  method:       { ru: 'Сменить метод',                en: 'Change method',          href: '/transition' },
  meds:         { ru: 'Дневник приёма',               en: 'Med diary',              href: '/meds' },
};

function extractLinks(text: string) {
  const lang = currentLang();
  const found = new Set<string>();
  const result: { label: string; href: string }[] = [];
  const re = /\[\[([a-z_]+)\]\]|\/(practice\/[a-z_]+|journal|goal|checkin|method|transition|meds)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    let key = (m[1] || m[2] || '').toLowerCase();
    if (key.startsWith('practice/')) key = key.slice('practice/'.length);
    if (key === 'transition') key = 'method';
    if (!ROUTE_LABELS[key] || found.has(key)) continue;
    found.add(key);
    const r = ROUTE_LABELS[key];
    result.push({ label: lang === 'ru' ? r.ru : r.en, href: r.href });
  }
  return result;
}

function stripLinks(text: string): string {
  return text
    .replace(/\[\[[a-z_]+\]\]/gi, '')
    .replace(/\s*\/(practice\/[a-z_]+|journal|goal|checkin|method|transition|meds)\b/gi, '')
    .trim();
}

export default function ChatScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = (params.mode as CoachMode) || 'support';
  const meta = MODE_META[mode];

  const [state] = useAppState();
  const premium = usePremium();
  const today = new Date().toISOString().slice(0, 10);
  const usedToday = state.aiUsage?.date === today ? state.aiUsage.count : 0;
  const freeLeft = Math.max(0, FREE_AI_DAILY_LIMIT - usedToday);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const persisted = state.chatHistories?.[mode] ?? [];
    if (persisted.length > 0) {
      setHistory(persisted.map((m) => ({ role: m.role, content: m.content })));
    } else {
      setHistory([{ role: 'assistant', content: tr('coach.first_msg') }]);
    }
  }, [mode]);

  // Scroll to last message on mount and when history changes.
  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearTimeout(id);
  }, [history.length]);

  async function persist(next: ChatMessage[]) {
    await update((s) => ({
      ...s,
      chatHistories: {
        ...(s.chatHistories ?? {}),
        [mode]: next.slice(-30).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, ts: Date.now() })),
      },
    }));
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    // Free tier: limited AI messages per day. Premium = unlimited.
    if (!premium && usedToday >= FREE_AI_DAILY_LIMIT) {
      router.push("/paywall" as any);
      return;
    }
    const next: ChatMessage[] = [...history, { role: 'user', content: text }];
    setHistory(next);
    setInput('');
    setLoading(true);
    try {
      const reply = await chat(state, lang, mode, next);
      const final = [...next, { role: 'assistant' as const, content: reply || '…' }];
      setHistory(final);
      await persist(final);
      if (!premium) {
        await update((s) => ({
          ...s,
          aiUsage: s.aiUsage?.date === today
            ? { date: today, count: s.aiUsage.count + 1 }
            : { date: today, count: 1 },
        }));
      }
    } catch (e: any) {
      const errMsg = e?.message ?? (lang === 'ru' ? 'Ошибка соединения' : 'Connection error');
      setHistory([...next, { role: 'assistant' as const, content: errMsg }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  async function clearChat() {
    setHistory([{ role: 'assistant', content: tr('coach.first_msg') }]);
    await update((s) => ({ ...s, chatHistories: { ...(s.chatHistories ?? {}), [mode]: [] } }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={20}>
            <Text style={{ color: t.accent, fontSize: 17 }}>←</Text>
          </Pressable>
          <View style={{
            width: 36, height: 36, borderRadius: 12, backgroundColor: meta.color + '24',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {(() => { const I = Icon[meta.icon]; return <I size={20} color={meta.color} />; })()}
          </View>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {lang === 'ru' ? meta.ru : meta.en}
          </Text>
          <Pressable onPress={clearChat} hitSlop={12}>
            <Text style={{ color: t.textDim, fontSize: 13 }}>{lang === 'ru' ? 'Очистить' : 'Clear'}</Text>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.md, gap: 10, paddingTop: 0 }}
          keyboardShouldPersistTaps="handled">
          {history.map((msg, i) => {
            const links = msg.role === 'assistant' ? extractLinks(msg.content) : [];
            return (
              <View key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: msg.role === 'user' ? meta.color : t.bgElev,
                padding: 12, borderRadius: 16,
                borderWidth: msg.role === 'user' ? 0 : 1, borderColor: t.border,
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
              }}>
                <Text style={{ color: msg.role === 'user' ? '#fff' : t.text, fontSize: 15, lineHeight: 22 }}>
                  {stripLinks(msg.content)}
                </Text>
                {links.length > 0 && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    {links.map((lk) => (
                      <Pressable key={lk.href} onPress={() => router.push(lk.href as any)}
                        style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: t.accent + '24', alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: t.accent, fontSize: 13, fontWeight: '700' }}>{lk.label}</Text>
                        <Text style={{ color: t.accent, fontSize: 13 }}>→</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          {loading && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', padding: 6 }}>
              <ActivityIndicator size="small" color={t.textDim} />
              <Text style={{ color: t.textDim }}>{tr('coach.thinking')}</Text>
            </View>
          )}
        </ScrollView>

        {!premium && (
          <Pressable onPress={() => router.push("/paywall" as any)}
            style={{ marginHorizontal: spacing.md, marginBottom: 8, padding: 10, borderRadius: 12, backgroundColor: t.accent + '14', borderWidth: 1, borderColor: t.accent + '40', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon.crown size={15} color={t.accent} />
            <Text style={{ color: t.text, fontSize: 12, flex: 1 }}>
              {freeLeft > 0
                ? (lang === 'ru' ? `Осталось бесплатных сообщений сегодня: ${freeLeft}` : `Free messages left today: ${freeLeft}`)
                : (lang === 'ru' ? 'Лимит на сегодня исчерпан. Premium — безлимитный ИИ.' : 'Daily limit reached. Premium — unlimited AI.')}
            </Text>
            <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>Premium →</Text>
          </Pressable>
        )}

        <View style={{ flexDirection: 'row', gap: 8, padding: spacing.md, paddingTop: 0 }}>
          <TextInput
            value={input} onChangeText={setInput}
            placeholder={tr('coach.placeholder')} placeholderTextColor={t.textDim}
            multiline
            style={{
              flex: 1, color: t.text, padding: 14, borderRadius: 18,
              backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, maxHeight: 120, fontSize: 15,
            }} />
          <Pressable onPress={send} disabled={!input.trim() || loading}
            style={{ backgroundColor: input.trim() ? meta.color : t.border, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 18 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
