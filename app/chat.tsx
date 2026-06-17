// AI assistant chat — separate stack screen so iOS edge-swipe-back works.
// Per-mode persisted history. Inline deep-links from AI replies open practices.

import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update, newThreadId, MAX_CHAT_THREADS, MAX_THREAD_MESSAGES, type ChatThread, type PersonaId } from '../lib/storage';
import { chat, chatStream, proactiveOpener, ChatMessage, CoachMode, type Opener } from '../lib/ai';
import { getPersona } from '../lib/personas';
import { Icon, type IconKey } from '../components/Icon';
import { FREE_AI_DAILY_LIMIT, aiRemainingToday, todayKey, usePremium } from '../lib/subscription';
import { extractLinks, stripLinks } from '../lib/aiLinks';
import { extractFacts, EXTRACT_EVERY_N_USER_MSGS, summarizeOlderMessages, SUMMARIZE_OVER, KEEP_TAIL } from '../lib/aiMemory';

const MODE_META: Record<CoachMode, { icon: IconKey; color: string; ru: string; en: string }> = {
  support:      { icon: 'chat',    color: '#0A84FF', ru: 'Поддержи сейчас', en: 'Support now' },
  analyze_slip: { icon: 'feather', color: '#FF9500', ru: 'Разбери срыв',    en: 'Analyze a slip' },
  daily_task:   { icon: 'spark',   color: '#30D158', ru: 'Задание на день', en: 'Task for today' },
};

export default function ChatScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const params = useLocalSearchParams<{ mode?: string; threadId?: string; persona?: string; opener?: string }>();
  const mode = (params.mode as CoachMode) || 'support';

  const [state] = useAppState();
  // Resolve the thread: explicit threadId wins; a bare mode deep-link (SOS,
  // pushes) reuses the freshest thread with that mode or creates one.
  const [threadId, setThreadId] = useState<string | null>(params.threadId ?? null);
  const thread: ChatThread | undefined = (state.chats ?? []).find((c) => c.id === threadId);
  const persona = getPersona(thread?.persona ?? (params.persona as PersonaId | undefined));
  const meta = mode !== 'support'
    ? MODE_META[mode]
    : { icon: persona.icon, color: persona.color, ru: persona.nameRu, en: persona.nameEn };

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const summarizingRef = useRef(false); // re-entrancy guard for thread summary

  const premium = usePremium();
  const remaining = aiRemainingToday(state, premium);

  useEffect(() => {
    if (params.threadId) {
      const found = (state.chats ?? []).find((c) => c.id === params.threadId);
      setThreadId(params.threadId);
      setHistory(found?.messages.length
        ? found.messages.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: 'assistant', content: tr('coach.first_msg') }]);
      return;
    }
    // mode deep-link: reuse the freshest thread with this mode, else create one
    const existing = [...(state.chats ?? [])]
      .filter((c) => c.mode === mode)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (existing) {
      setThreadId(existing.id);
      setHistory(existing.messages.length
        ? existing.messages.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: 'assistant', content: tr('coach.first_msg') }]);
    } else {
      const id = newThreadId();
      const now = Date.now();
      const fresh: ChatThread = {
        id, persona: (params.persona as PersonaId) || 'breeze', mode,
        createdAt: now, updatedAt: now, messages: [],
      };
      update((s) => ({ ...s, chats: [fresh, ...(s.chats ?? [])].slice(0, MAX_CHAT_THREADS) }));
      setThreadId(id);
      setHistory([{ role: 'assistant', content: tr('coach.first_msg') }]);
    }
  }, [params.threadId, mode]);

  // Proactive opener: when the chat is opened with intent (from a push or SOS,
  // i.e. an `opener` param) and the thread has no conversation yet, Breeze
  // speaks FIRST with a context-aware line instead of a static greeting. Runs
  // once per thread; does not count against the free message limit.
  const openerRanRef = useRef<string | null>(null);
  useEffect(() => {
    if (!threadId || !params.opener || loading) return;
    if (openerRanRef.current === threadId) return;
    // Don't spend a paid opener call when the user is out of free messages.
    if (!premium && (remaining ?? 0) <= 0) return;
    const existing = (state.chats ?? []).find((c) => c.id === threadId);
    if (existing && existing.messages.length > 0) return; // already a conversation
    openerRanRef.current = threadId;
    (async () => {
      setHistory([]);
      setLoading(true);
      try {
        const line = await proactiveOpener(state, lang, params.opener as Opener, persona.id);
        if (line) {
          const final: ChatMessage[] = [{ role: 'assistant', content: line }];
          setHistory(final);
          await persist(final);
        } else {
          setHistory([{ role: 'assistant', content: tr('coach.first_msg') }]);
        }
      } catch {
        setHistory([{ role: 'assistant', content: tr('coach.first_msg') }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId, params.opener]);

  // Scroll to last message on mount and when history changes.
  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearTimeout(id);
  }, [history.length]);

  async function persist(next: ChatMessage[]) {
    const id = threadId;
    if (!id) return;
    await update((s) => ({
      ...s,
      chats: (s.chats ?? []).map((c) => c.id !== id ? c : {
        ...c,
        updatedAt: Date.now(),
        title: c.title ?? next.find((m) => m.role === 'user')?.content.slice(0, 40),
        messages: next.slice(-MAX_THREAD_MESSAGES)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, ts: Date.now() })),
      }),
    }));
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    if (!premium && (remaining ?? 0) <= 0) {
      router.push('/paywall' as any);
      return;
    }
    const prev = history;
    const next: ChatMessage[] = [...history, { role: 'user', content: text }];
    setHistory(next);
    setInput('');
    setSendError(null);
    setLoading(true);
    // Long conversation: when a rolling summary exists, send only the recent
    // tail (the summary covers everything before it). We do NOT track an
    // absolute index — persist() truncates to MAX_THREAD_MESSAGES, so any saved
    // index desyncs after the first truncation. Instead always take the last
    // KEEP_TAIL, snapped back to start on an assistant turn so the model sees
    // clean assistant→user pairs.
    const curThread = (state.chats ?? []).find((c) => c.id === threadId);
    const priorSummary = curThread?.summary;
    let outHistory = next;
    if (priorSummary && next.length > KEEP_TAIL + 2) {
      let start = Math.max(0, next.length - KEEP_TAIL);
      while (start > 0 && next[start].role !== 'assistant') start--;
      outHistory = next.slice(start);
    }
    try {
      // Stream tokens in for a faster, alive feel; fall back to one-shot on error.
      let reply = '';
      try {
        reply = await chatStream(state, lang, mode, outHistory, (partial) => {
          if (partial) setHistory([...next, { role: 'assistant', content: partial }]);
        }, persona.id, priorSummary);
      } catch {
        reply = await chat(state, lang, mode, outHistory, persona.id, priorSummary);
      }
      const final = [...next, { role: 'assistant' as const, content: reply || '…' }];
      setHistory(final);
      await persist(final);
      // Long-term memory: every Nth user message, quietly distill durable
      // facts (names, what helps…) so Breeze remembers across sessions.
      const userMsgCount = final.filter((m) => m.role === 'user').length;
      if (userMsgCount % EXTRACT_EVERY_N_USER_MSGS === 0) {
        extractFacts(state, final); // fire-and-forget
      }
      // Roll older messages into a rolling summary once the thread gets long,
      // so the next turns send a short tail instead of the whole history.
      // Re-entrancy guard: skip if a summary is already in flight for this thread
      // (otherwise concurrent runs race last-writer-wins on the summary text).
      if (final.length > SUMMARIZE_OVER && !summarizingRef.current) {
        summarizingRef.current = true;
        summarizeOlderMessages(state, final, priorSummary)
          .then((sum) => {
            if (sum) {
              update((s) => ({
                ...s,
                chats: (s.chats ?? []).map((c) => c.id !== threadId ? c : { ...c, summary: sum }),
              }));
            }
          })
          .finally(() => { summarizingRef.current = false; });
      }
      if (!premium) {
        await update((s) => {
          const day = todayKey();
          const cur = s.aiUsage && s.aiUsage.date === day ? s.aiUsage.count : 0;
          return { ...s, aiUsage: { date: day, count: cur + 1 } };
        });
      }
    } catch {
      // Never show raw error text ("proxy 502") as a coach message — roll the
      // bubble back, return the draft to the input and offer a retry.
      setHistory(prev);
      setInput(text);
      setSendError(lang === 'ru'
        ? 'Не получилось отправить. Проверь интернет и попробуй ещё раз.'
        : 'Could not send. Check your connection and try again.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  async function clearChat() {
    const id = threadId;
    setHistory([{ role: 'assistant', content: tr('coach.first_msg') }]);
    if (!id) return;
    await update((s) => ({
      ...s,
      chats: (s.chats ?? []).map((c) => c.id !== id ? c : { ...c, messages: [], title: undefined, updatedAt: Date.now() }),
    }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={20}
            accessibilityRole="button" accessibilityLabel={lang === 'ru' ? 'Назад' : 'Back'}>
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

        {/* Видимый мед-дисклеймер (wellness-правило: на каждом экране, не в подвале) */}
        <Text style={{ color: t.textDim, fontSize: 11, lineHeight: 15, paddingHorizontal: spacing.md, paddingBottom: 8, textAlign: 'center' }}>
          {lang === 'ru'
            ? 'Не медицинская консультация. При тяжёлом состоянии — к врачу или 112.'
            : 'Not medical advice. In severe distress, call your local emergency line.'}
        </Text>

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
          {/* Starter chips: a blank input in front of a "coach" stalls people —
              one tap gives them an opening line. Only while the chat is fresh. */}
          {!loading && history.length <= 1 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {(lang === 'ru'
                ? ['Тянет курить прямо сейчас', 'Я сорвался', 'Просто поговорить']
                : ['Craving right now', 'I slipped', 'Just talk']
              ).map((c) => (
                <Pressable key={c} onPress={() => { Haptics.selectionAsync(); setInput(c); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: meta.color + '16', borderWidth: 1, borderColor: meta.color + '44' }}>
                  <Text style={{ color: meta.color, fontSize: 14, fontWeight: '600' }}>{c}</Text>
                </Pressable>
              ))}
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

        {sendError && (
          <Pressable onPress={send} style={{
            marginHorizontal: spacing.md, marginBottom: 8, padding: 12, borderRadius: 12,
            backgroundColor: t.danger + '14', borderWidth: 1, borderColor: t.danger + '44',
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Text style={{ color: t.danger, fontSize: 13, flex: 1, lineHeight: 18 }}>{sendError}</Text>
            <Text style={{ color: t.danger, fontSize: 13, fontWeight: '800' }}>
              {lang === 'ru' ? 'Повторить' : 'Retry'}
            </Text>
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
            accessibilityRole="button" accessibilityLabel={lang === 'ru' ? 'Отправить' : 'Send'}
            style={{ backgroundColor: input.trim() ? meta.color : t.border, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 18 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
