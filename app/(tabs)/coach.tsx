// «Помощник» tab — a real hub instead of a bare redirect: pick a coach persona,
// start a new chat, return to past conversations (messenger-style thread list).

import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { useAppState, update, newThreadId, MAX_CHAT_THREADS, type ChatThread, type PersonaId } from '../../lib/storage';
import { PERSONAS, getPersona } from '../../lib/personas';
import { Icon } from '../../components/Icon';
import { SwipeToHome } from '../../components/SwipeToHome';

export default function CoachHub() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const ru = lang === 'ru';
  const [state] = useAppState();

  const threads = [...(state.chats ?? [])]
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  async function startChat(persona: PersonaId, mode: ChatThread['mode'] = 'support') {
    Haptics.selectionAsync();
    const id = newThreadId();
    const now = Date.now();
    const fresh: ChatThread = { id, persona, mode, createdAt: now, updatedAt: now, messages: [] };
    await update((s) => ({ ...s, chats: [fresh, ...(s.chats ?? [])].slice(0, MAX_CHAT_THREADS) }));
    router.push(`/chat?threadId=${id}` as any);
  }

  function openThread(c: ChatThread) {
    Haptics.selectionAsync();
    router.push(`/chat?threadId=${c.id}` as any);
  }

  function removeThread(c: ChatThread) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      ru ? 'Удалить разговор?' : 'Delete conversation?',
      ru ? 'История этого чата будет стёрта.' : 'This chat history will be erased.',
      [
        { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
        {
          text: ru ? 'Удалить' : 'Delete', style: 'destructive',
          onPress: () => update((s) => ({ ...s, chats: (s.chats ?? []).filter((x) => x.id !== c.id) })),
        },
      ],
    );
  }

  function relTime(ts: number): string {
    const d = Math.floor((Date.now() - ts) / 86400_000);
    if (d === 0) {
      return new Date(ts).toLocaleTimeString(ru ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (d === 1) return ru ? 'вчера' : 'yesterday';
    return new Date(ts).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
  }

  return (
    <SwipeToHome>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 130, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8, marginLeft: 4, marginTop: 8 }}>
          {ru ? 'Помощник' : 'Coach'}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, marginLeft: 4, marginTop: -6 }}>
          {ru ? 'Выбери, с кем поговорить' : 'Pick who to talk to'}
        </Text>

        {/* Persona picker — 2×2 grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {Object.values(PERSONAS).map((p) => {
            const I = Icon[p.icon];
            return (
              <Pressable key={p.id} onPress={() => startChat(p.id)}
                style={({ pressed }) => ({ width: '48%', flexGrow: 1, borderRadius: radius.xl, overflow: 'hidden', opacity: pressed ? 0.9 : 1 })}>
                <LinearGradient colors={[p.color + '26', '#12161D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 14, gap: 8, minHeight: 124, borderWidth: 1, borderColor: p.color + '33', borderRadius: radius.xl }}>
                  <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: p.color + '26', alignItems: 'center', justifyContent: 'center' }}>
                    <I size={22} color={p.color} />
                  </View>
                  <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>{ru ? p.nameRu : p.nameEn}</Text>
                  <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
                    {ru ? p.taglineRu : p.taglineEn}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {/* Quick legacy modes */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <QuickBtn t={t} color="#FF9500" label={ru ? 'Разбери срыв' : 'Analyze a slip'}
            onPress={() => startChat('breeze', 'analyze_slip')} />
          <QuickBtn t={t} color="#30D158" label={ru ? 'Задание на день' : 'Task for today'}
            onPress={() => startChat('breeze', 'daily_task')} />
        </View>

        {/* Thread list */}
        {threads.length > 0 && (
          <>
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginLeft: 6, marginTop: 8 }}>
              {ru ? 'История' : 'History'}
            </Text>
            <View style={{ gap: 8 }}>
              {threads.map((c) => {
                const p = getPersona(c.persona);
                const I = Icon[p.icon];
                const lastMsg = c.messages[c.messages.length - 1];
                return (
                  <Pressable key={c.id} onPress={() => openThread(c)} onLongPress={() => removeThread(c)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                      borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
                      opacity: pressed ? 0.8 : 1,
                    })}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <I size={22} color={p.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                          {c.title || (ru ? p.nameRu : p.nameEn)}
                        </Text>
                        <Text style={{ color: t.textDim, fontSize: 11 }}>{relTime(c.updatedAt)}</Text>
                      </View>
                      {!!lastMsg && (
                        <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                          {lastMsg.content}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: t.textDim, fontSize: 11.5, textAlign: 'center', marginTop: 2 }}>
              {ru ? 'Долгое нажатие — удалить разговор' : 'Long-press a conversation to delete it'}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    </SwipeToHome>
  );
}

function QuickBtn({ t, color, label, onPress }: any) {
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, paddingVertical: 13, borderRadius: radius.lg, alignItems: 'center',
        backgroundColor: color + '14', borderWidth: 1, borderColor: color + '44', opacity: pressed ? 0.85 : 1,
      })}>
      <Text style={{ color, fontWeight: '700', fontSize: 13.5 }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
