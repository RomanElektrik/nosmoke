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
import { chat, chatStream, ChatMessage, CoachMode } from '../lib/ai';
import { Icon, type IconKey } from '../components/Icon';
import { FREE_AI_DAILY_LIMIT, aiRemainingToday, todayKey, usePremium } from '../lib/subscription';
import { extractLinks, stripLinks } from '../lib/aiLinks';

const MODE_META: Record<CoachMode, { icon: IconKey; color: string; ru: string; en: string }> = {
  support:      { icon: 'wave2',   color: '#0A84FF', ru: 'Поддержи сейчас', en: 'Support now' },
  analyze_slip: { icon: 'feather', color: '#FF9500', ru: 'Разбери срыв',    en: 'Analyze a slip' },
  daily_task:   { icon: 'spark',   color: '#30D158', ru: 'Задание на день', en: 'Task for today' },
};

export default function ChatScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = (params.mode as CoachMode) || 'support';
  const meta = MODE_META[mode];

  const [state] = useAppState();
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

  const premium = usePremium();
  const remaining = aiRemainingToday(state, premium);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    if (!premium && (remaining ?? 0) <= 0) {
      router.push('/paywall' as any);
      return;
    }
    const next: ChatMessage[] = [...history, { role: 'user', content: text }];
    setHistory(next);
    setInput('');
    setLoading(true);
    try {
      // Stream tokens in for a faster, alive feel; fall back to one-shot on error.
      let reply = '';
      try {
        reply = await chatStream(state, lang, mode, next, (partial) => {
          if (partial) setHistory([...next, { role: 'assistant', content: partial }]);
        });
      } catch {
        reply = await chat(state, lang, mode, next);
      }
      const final = [...next, { role: 'assistant' as const, content: reply || '…' }];
      setHistory(final);
      await persist(final);
      if (!premium) {
        await update((s) => {
          const day = todayKey();
          const cur = s.aiUsage && s.aiUsage.date === day ? s.aiUsage.count : 0;
          return { ...s, aiUsage: { date: day, count: cur + 1 } };
        });
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

        {!premium && remaining !== null && (
          <Pressable onPress={() => router.push('/paywall' as any)}>
            <View style={{
              marginHorizontal: spacing.md, marginBottom: 8, paddingVertical: 8, paddingHorizontal: 12,
              borderRadius: 12, backgroundColor: remaining <= 2 ? t.warn + '18' : t.bgElev,
              borderWidth: 1, borderColor: remaining <= 2 ? t.warn + '50' : t.border,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Icon.star size={14} color={remaining <= 2 ? t.warn : t.textDim} />
              <Text style={{ color: remaining <= 2 ? t.warn : t.textDim, fontSize: 12, fontWeight: '600', flex: 1 }}>
                {lang === 'ru'
                  ? (remaining > 0 ? `Осталось ${remaining} из ${FREE_AI_DAILY_LIMIT} бесплатных сообщений` : 'Лимит на сегодня исчерпан — открой Премиум')
                  : (remaining > 0 ? `${remaining} of ${FREE_AI_DAILY_LIMIT} free messages left today` : 'Daily limit reached — unlock Premium')}
              </Text>
              <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>
                {lang === 'ru' ? 'Премиум →' : 'Premium →'}
              </Text>
            </View>
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
