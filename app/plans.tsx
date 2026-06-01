// If-then personal plans — «Если [триггер] → то [действие]».
// Evidence: implementation intentions OR 1.70 (Cochrane/meta). Competitors
// don't do this as a real engine. Full CRUD + archetype-suggested starters.

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { useAppState, update, type IfThenPlan, type Trigger, type Archetype } from '../lib/storage';
import { triggerLabel, ALL_TRIGGERS } from '../lib/identity';
import { Icon } from '../components/Icon';

type Starter = { category: Trigger; ru: { t: string; a: string }; en: { t: string; a: string } };

const STARTERS: Record<Archetype, Starter[]> = {
  habitual: [
    { category: 'coffee',     ru: { t: 'утренний кофе', a: 'стакан воды + 5 медленных вдохов' }, en: { t: 'morning coffee', a: 'a glass of water + 5 slow breaths' } },
    { category: 'after_meal', ru: { t: 'встал из-за стола', a: 'сразу почистить зубы или выйти пройтись' }, en: { t: 'I leave the table', a: 'brush teeth or step out for a short walk' } },
  ],
  social: [
    { category: 'social',  ru: { t: 'зовут на перекур', a: '«нет, спасибо» и выйти на воздух одному' }, en: { t: "I'm invited for a smoke", a: '"no thanks" and step outside on my own' } },
    { category: 'alcohol', ru: { t: 'выпиваю в компании', a: 'держать в руке стакан воды или сок' }, en: { t: "I'm drinking with people", a: 'keep a glass of water or juice in hand' } },
  ],
  anxious: [
    { category: 'stress', ru: { t: 'накрывает тревога', a: '4 минуты дыхания 4-4-4-4' }, en: { t: 'anxiety hits', a: '4 minutes of 4-4-4-4 breathing' } },
    { category: 'stress', ru: { t: 'сильный стресс', a: 'написать ИИ-помощнику, что чувствую' }, en: { t: 'strong stress', a: 'message the AI coach what I feel' } },
  ],
  reward: [
    { category: 'boredom', ru: { t: 'хочется наградить себя', a: 'отложить деньги в копилку и посмотреть цель' }, en: { t: 'I want to reward myself', a: 'add to the savings jar and check my goal' } },
    { category: 'after_meal', ru: { t: 'кофе после еды', a: 'квадратик тёмного шоколада вместо сигареты' }, en: { t: 'coffee after a meal', a: 'a square of dark chocolate instead' } },
  ],
  identity: [
    { category: 'boredom', ru: { t: 'ловлю мысль «я курильщик»', a: 'сказать себе: «я тот, кто бросил»' }, en: { t: 'I catch "I\'m a smoker"', a: 'tell myself: "I\'m someone who quit"' } },
    { category: 'stress', ru: { t: 'рука тянется к пачке', a: 'вспомнить, кем я становлюсь' }, en: { t: 'my hand reaches for the pack', a: 'remember who I\'m becoming' } },
  ],
};

const GENERIC: Starter[] = [
  { category: 'stress', ru: { t: 'стресс', a: '4 минуты дыхания, потом решаю' }, en: { t: 'stress', a: '4 minutes of breathing, then decide' } },
  { category: 'coffee', ru: { t: 'утренний кофе', a: 'стакан воды + короткая прогулка' }, en: { t: 'morning coffee', a: 'a glass of water + short walk' } },
];

export default function Plans() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const plans = state.ifThens ?? [];

  const [editId, setEditId] = useState<string | null>(null);
  const [category, setCategory] = useState<Trigger>('stress');
  const [trig, setTrig] = useState('');
  const [act, setAct] = useState('');

  const starters = state.profile?.archetype ? STARTERS[state.profile.archetype] : GENERIC;

  function reset() {
    setEditId(null); setCategory('stress'); setTrig(''); setAct('');
  }

  async function save() {
    if (!trig.trim() || !act.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => {
      const list = s.ifThens ?? [];
      if (editId) {
        return { ...s, ifThens: list.map((p) => p.id === editId
          ? { ...p, trigger: trig.trim(), action: act.trim(), category }
          : p) };
      }
      const plan: IfThenPlan = { id: String(Date.now()), ts: Date.now(), trigger: trig.trim(), action: act.trim(), category };
      return { ...s, ifThens: [...list, plan] };
    });
    reset();
  }

  async function remove(id: string) {
    Haptics.selectionAsync();
    await update((s) => ({ ...s, ifThens: (s.ifThens ?? []).filter((p) => p.id !== id) }));
    if (editId === id) reset();
  }

  function startEdit(p: IfThenPlan) {
    Haptics.selectionAsync();
    setEditId(p.id); setCategory(p.category ?? 'stress'); setTrig(p.trigger); setAct(p.action);
  }

  function applyStarter(s: Starter) {
    Haptics.selectionAsync();
    setEditId(null); setCategory(s.category);
    setTrig(lang === 'ru' ? s.ru.t : s.en.t);
    setAct(lang === 'ru' ? s.ru.a : s.en.a);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {lang === 'ru' ? 'Назад' : 'Back'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60, gap: 18 }}
        keyboardShouldPersistTaps="handled">
        <View>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 }}>
            {lang === 'ru' ? 'Мои планы' : 'My plans'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
            {lang === 'ru'
              ? 'Заранее реши: «Если [триггер] → то [действие]». В момент тяги план уже готов — думать не надо.'
              : 'Decide ahead: "If [trigger] → then [action]". In the craving moment the plan is ready — no thinking needed.'}
          </Text>
        </View>

        {/* Builder */}
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 12 }}>
          <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {editId ? (lang === 'ru' ? 'Изменить план' : 'Edit plan') : (lang === 'ru' ? 'Новый план' : 'New plan')}
          </Text>
          {/* Category chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ALL_TRIGGERS.map((tg) => {
              const sel = category === tg;
              return (
                <TouchableOpacity key={tg} activeOpacity={0.7}
                  onPress={() => { Haptics.selectionAsync(); setCategory(tg); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                    backgroundColor: sel ? t.accent : t.bgElev,
                    borderWidth: 1, borderColor: sel ? t.accent : t.border,
                  }}>
                  <Text pointerEvents="none" style={{ color: sel ? '#fff' : t.text, fontWeight: '600', fontSize: 13 }}>
                    {triggerLabel(tg, lang)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* If */}
          <View>
            <Text style={{ color: t.accent, fontSize: 12, fontWeight: '800', marginBottom: 4 }}>{lang === 'ru' ? 'ЕСЛИ' : 'IF'}</Text>
            <TextInput value={trig} onChangeText={setTrig} multiline
              placeholder={lang === 'ru' ? 'утренний кофе…' : 'morning coffee…'} placeholderTextColor={t.textDim}
              style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, fontSize: 15, minHeight: 44 }} />
          </View>
          {/* Then */}
          <View>
            <Text style={{ color: t.warn, fontSize: 12, fontWeight: '800', marginBottom: 4 }}>{lang === 'ru' ? 'ТО' : 'THEN'}</Text>
            <TextInput value={act} onChangeText={setAct} multiline
              placeholder={lang === 'ru' ? 'стакан воды + 5 вдохов…' : 'a glass of water + 5 breaths…'} placeholderTextColor={t.textDim}
              style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, fontSize: 15, minHeight: 44 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {editId && (
              <Pressable onPress={reset} style={{ paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.textDim, fontWeight: '600' }}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
            )}
            <Pressable onPress={save} disabled={!trig.trim() || !act.trim()}
              style={{ flex: 1, paddingVertical: 15, borderRadius: radius.md, backgroundColor: trig.trim() && act.trim() ? t.accent : t.border, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {editId ? (lang === 'ru' ? 'Сохранить' : 'Save') : (lang === 'ru' ? 'Добавить план' : 'Add plan')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Starters (only when nothing yet) */}
        {plans.length === 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? 'Готовые под тебя' : 'Ready for you'}
            </Text>
            {starters.map((s, i) => (
              <Pressable key={i} onPress={() => applyStarter(s)}
                style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderStyle: 'dashed', borderColor: t.accent + '60' }}>
                <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>
                  <Text style={{ color: t.accent, fontWeight: '700' }}>{lang === 'ru' ? 'Если ' : 'If '}</Text>
                  {lang === 'ru' ? s.ru.t : s.en.t}
                  <Text style={{ color: t.warn, fontWeight: '700' }}>{lang === 'ru' ? ' → то ' : ' → then '}</Text>
                  {lang === 'ru' ? s.ru.a : s.en.a}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 11, marginTop: 4 }}>{lang === 'ru' ? 'Нажми, чтобы взять' : 'Tap to use'}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Existing plans */}
        {plans.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? `Твои планы · ${plans.length}` : `Your plans · ${plans.length}`}
            </Text>
            {[...plans].reverse().map((p) => (
              <View key={p.id} style={{ padding: 14, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 8 }}>
                {p.category && (
                  <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: t.accentSoft }}>
                    <Text style={{ color: t.accent, fontSize: 11, fontWeight: '700' }}>{triggerLabel(p.category, lang)}</Text>
                  </View>
                )}
                <Text style={{ color: t.text, fontSize: 15, lineHeight: 21 }}>
                  <Text style={{ color: t.accent, fontWeight: '700' }}>{lang === 'ru' ? 'Если ' : 'If '}</Text>
                  {p.trigger}
                  <Text style={{ color: t.warn, fontWeight: '700' }}>{lang === 'ru' ? ' → то ' : ' → then '}</Text>
                  {p.action}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
                  <Pressable onPress={() => startEdit(p)} hitSlop={8}>
                    <Text style={{ color: t.info, fontSize: 13, fontWeight: '600' }}>{lang === 'ru' ? 'Изменить' : 'Edit'}</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(p.id)} hitSlop={8}>
                    <Text style={{ color: t.danger, fontSize: 13, fontWeight: '600' }}>{lang === 'ru' ? 'Удалить' : 'Delete'}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
