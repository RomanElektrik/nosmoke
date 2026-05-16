import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update, type Trigger } from '../lib/storage';
import { Icon } from '../components/Icon';

const TRIGGERS: Trigger[] = ['stress','coffee','alcohol','after_meal','driving','social','boredom'];

export default function Journal() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [state] = useAppState();
  const params = useLocalSearchParams<{ open?: string }>();
  const [showAdd, setShowAdd] = useState(params.open === 'add');

  const last7days = useMemo(() => {
    const buckets = Array.from({ length: 7 }, () => ({ count: 0, sumIntensity: 0, resisted: 0 }));
    const now = Date.now();
    state.cravings.forEach((c) => {
      const dayDiff = Math.floor((now - c.ts) / 86400_000);
      if (dayDiff < 7) {
        const b = buckets[6 - dayDiff];
        b.count++; b.sumIntensity += c.intensity;
        if (c.outcome === 'resisted') b.resisted++;
      }
    });
    return buckets;
  }, [state.cravings]);

  const triggerCounts = useMemo(() => {
    const map: Record<string, number> = {};
    state.cravings.forEach((c) => { if (c.trigger) map[c.trigger] = (map[c.trigger] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [state.cravings]);

  const recent = state.cravings.slice(-30).reverse();
  const total = state.cravings.length;
  const resisted = state.cravings.filter((c) => c.outcome === 'resisted').length;
  const winRate = total > 0 ? Math.round((resisted / total) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
        </Pressable>
        <Pressable onPress={() => { Haptics.selectionAsync(); setShowAdd(true); }}
          style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: t.accent, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: -2 }}>+</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{lang === 'ru' ? 'Запись' : 'Entry'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 60 }}>
        <LinearGradient colors={['#FF9F0A38', '#FF9F0A08']}
          style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.brush size={52} color="#FF9F0A" />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
          {lang === 'ru' ? 'Дневник тяги' : 'Craving journal'}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14 }}>
          {lang === 'ru'
            ? 'Записывай каждый позыв — даже если удержался. Через 2 недели увидишь свои паттерны.'
            : 'Log every urge — even when you held. In 2 weeks you’ll see your patterns.'}
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat color="#0A84FF" value={String(total)} label={lang === 'ru' ? 'эпизодов' : 'episodes'} />
          <Stat color="#30D158" value={`${winRate}%`} label={lang === 'ru' ? 'удержался' : 'win rate'} />
          <Stat color="#FF9F0A" value={String(last7days.reduce((a, b) => a + b.count, 0))} label={lang === 'ru' ? 'за 7 дней' : 'last 7d'} />
        </View>

        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {lang === 'ru' ? 'Тяга за неделю' : 'Cravings this week'}
          </Text>
          <Chart data={last7days} />
        </View>

        {triggerCounts.length > 0 && (
          <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {lang === 'ru' ? 'Топ триггеров' : 'Top triggers'}
            </Text>
            {triggerCounts.map(([trig, count]) => {
              const max = triggerCounts[0][1];
              const pct = (count / max) * 100;
              return (
                <View key={trig}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{tr(`onb.trig_${trig}`)}</Text>
                    <Text style={{ color: t.textDim, fontSize: 13 }}>{count}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: t.border, borderRadius: 6, overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#FF9F0A' }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {recent.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? 'Последние записи' : 'Recent entries'}
            </Text>
            {recent.map((c) => {
              const dt = new Date(c.ts);
              const date = dt.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
              const time = dt.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
              const win = c.outcome === 'resisted';
              return (
                <View key={c.ts} style={{
                  padding: 12, borderRadius: radius.md, backgroundColor: t.bgElev,
                  borderWidth: 1, borderColor: t.border,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                }}>
                  <View style={{ width: 8, alignSelf: 'stretch', borderRadius: 4, backgroundColor: win ? '#30D158' : '#FF453A' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>
                      {win ? (lang === 'ru' ? 'Удержался' : 'Held on') : (lang === 'ru' ? 'Закурил' : 'Smoked')}
                      {c.trigger ? ` · ${tr(`onb.trig_${c.trigger}`)}` : ''}
                    </Text>
                    <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                      {date} · {time} · {c.intensity}/10
                    </Text>
                    {c.note ? <Text style={{ color: t.textDim, fontSize: 13, marginTop: 6, lineHeight: 18 }}>{c.note}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ padding: 24, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
            <Text style={{ color: t.textDim, textAlign: 'center', lineHeight: 22 }}>
              {lang === 'ru' ? 'Пока нет записей. Нажми «+ Запись» чтобы добавить.' : 'No entries yet. Tap "+ Entry" to add.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <AddEntryModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </SafeAreaView>
  );
}

function AddEntryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const { t: tr } = useTranslation();
  const [intensity, setIntensity] = useState(5);
  const [outcome, setOutcome] = useState<'resisted' | 'smoked' | null>(null);
  const [trigger, setTrigger] = useState<Trigger | undefined>();
  const [note, setNote] = useState('');

  function reset() {
    setIntensity(5); setOutcome(null); setTrigger(undefined); setNote('');
  }

  async function save() {
    if (!outcome) return;
    Haptics.notificationAsync(outcome === 'resisted' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    await update((s) => ({
      ...s,
      cravings: [...s.cravings, { ts: Date.now(), intensity, outcome, trigger, note: note.trim() || undefined }],
      slips: outcome === 'smoked' ? [...s.slips, Date.now()] : s.slips,
    }));
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md }}>
            <Pressable onPress={onClose}><Text style={{ color: t.accent, fontSize: 17 }}>{tr('common.cancel')}</Text></Pressable>
            <Pressable onPress={save} disabled={!outcome}>
              <Text style={{ color: outcome ? t.accent : t.textDim, fontSize: 17, fontWeight: '700' }}>{tr('common.save')}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>
              {lang === 'ru' ? 'Новая запись' : 'New entry'}
            </Text>

            <View>
              <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {lang === 'ru' ? 'Чем закончилось' : 'Outcome'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['resisted','smoked'] as const).map((o) => {
                  const sel = outcome === o;
                  const c = o === 'resisted' ? '#30D158' : '#FF453A';
                  return (
                    <Pressable key={o} onPress={() => { Haptics.selectionAsync(); setOutcome(o); }}
                      style={{
                        flex: 1, padding: 16, borderRadius: radius.md, alignItems: 'center',
                        backgroundColor: sel ? c + '22' : t.bgElev,
                        borderWidth: 1, borderColor: sel ? c : t.border,
                      }}>
                      <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
                        {o === 'resisted' ? (lang === 'ru' ? 'Удержался' : 'Held on') : (lang === 'ru' ? 'Закурил' : 'Smoked')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {lang === 'ru' ? 'Сила тяги' : 'Intensity'}
                </Text>
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{intensity} / 10</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 10 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <Pressable key={i} onPress={() => { Haptics.selectionAsync(); setIntensity(i + 1); }}
                    style={{ flex: 1, height: 32, borderRadius: 8, backgroundColor: i < intensity ? t.accent : t.border }} />
                ))}
              </View>
            </View>

            <View>
              <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {lang === 'ru' ? 'Триггер' : 'Trigger'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TRIGGERS.map((tg) => {
                  const sel = trigger === tg;
                  return (
                    <Pressable key={tg} onPress={() => { Haptics.selectionAsync(); setTrigger(sel ? undefined : tg); }}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                        backgroundColor: sel ? t.accentSoft : t.bgElev,
                        borderWidth: 1, borderColor: sel ? t.accent : t.border,
                      }}>
                      <Text style={{ color: t.text, fontSize: 14 }}>{tr(`onb.trig_${tg}`)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {lang === 'ru' ? 'Заметка (по желанию)' : 'Note (optional)'}
              </Text>
              <TextInput value={note} onChangeText={setNote}
                placeholder={lang === 'ru' ? 'Что происходило, что помогло, что нет…' : 'What happened, what helped, what didn\'t…'}
                placeholderTextColor={t.textDim} multiline
                style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 80, fontSize: 16 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: color + '14', borderWidth: 1, borderColor: color + '30' }}>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>{value}</Text>
      <Text style={{ color: t.textDim, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Chart({ data }: { data: { count: number; sumIntensity: number }[] }) {
  const t = useTheme();
  const W = 280, H = 110, PAD = 8;
  const max = Math.max(1, ...data.map((d) => d.count));
  const points = data.map((d, i) => {
    const x = PAD + (i * (W - PAD * 2)) / (data.length - 1);
    const y = H - PAD - ((d.count / max) * (H - PAD * 2));
    return [x, y] as const;
  });
  const lang = currentLang();
  const dayLabels = lang === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['M','T','W','T','F','S','S'];
  const today = new Date().getDay();
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = (today - 6 + i + 7) % 7;
    return dayLabels[(d + 6) % 7];
  });
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={W} height={H}>
        <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={t.border} strokeWidth="1" />
        <Polyline fill="none" stroke="#FF9F0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          points={points.map((p) => p.join(',')).join(' ')} />
        {points.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={4} fill={data[i].count > 0 ? '#FF9F0A' : t.border} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', width: W - PAD * 2, justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map((l, i) => <Text key={i} style={{ color: t.textDim, fontSize: 11 }}>{l}</Text>)}
      </View>
    </View>
  );
}
