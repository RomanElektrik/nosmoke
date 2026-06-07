// Day detail — «что тебя ждёт сегодня». Composes the rich (но прежде скрытые)
// per-day fields from lib/tracks.ts (science / why / task / med) into a readable,
// reassuring page. Reached by tapping a day on the Path tab.

import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius, type Theme } from '../../lib/theme';
import { currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { trackDay, getTrack } from '../../lib/tracks';
import { getStep } from '../../lib/stepped';
import { programToday } from '../../lib/program';
import { Icon, type IconKey } from '../../components/Icon';

export default function DayDetail() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';
  const [state] = useAppState();
  const { day: dayParam } = useLocalSearchParams<{ day: string }>();
  const day = Math.max(1, parseInt(String(dayParam || '1'), 10) || 1);

  const stepId = state.profile?.currentStep;
  const step = getStep(stepId);
  const track = getTrack(stepId);
  const d: any = trackDay(stepId, day);
  const todayN = programToday(state).day;
  const c = step.color;

  const isToday = day === todayN;
  const isPast = day < todayN;
  const peak = day === 3;

  const focus = ru ? d.focusRu : d.focusEn;
  const science = ru ? d.scienceRu : d.scienceEn;
  const why = ru ? (d.whyRu ?? '') : (d.whyEn ?? '');
  const task = ru ? d.taskRu : d.taskEn;
  const med = state.profile?.medication ? (ru ? (d.medRu ?? '') : (d.medEn ?? '')) : '';

  // Reassurance line, varies by phase of withdrawal.
  const reassure = peak
    ? (ru ? 'Сегодня тяга может быть самой резкой — это пик. После него становится заметно легче. Так у большинства.'
          : 'Today the urge can be the sharpest — this is the peak. After it, it gets noticeably easier. That’s how it goes for most.')
    : day <= 3
    ? (ru ? 'Первые дни — самые телесные. Накроет несколько раз, каждая волна пройдёт за пару минут. Это нормально и это проходит.'
          : 'The first days are the most physical. It’ll hit a few times; each wave passes in minutes. It’s normal, and it passes.')
    : day <= 14
    ? (ru ? 'Острое позади. Сейчас работаем с привычками и триггерами — тяга реже и слабее. Ты на верном пути.'
          : 'The acute part is behind you. Now we work with habits and triggers — urges come less and weaker. You’re on track.')
    : (ru ? 'Это уже про поддержание. Внимательно к триггерам — и держись своей новой версии себя.'
          : 'This is maintenance now. Mind your triggers — and stay your new self.');

  function startPractice() {
    if (!d.practice) return;
    Haptics.selectionAsync();
    if (d.practice === 'money') router.push('/goal');
    else if (d.practice === 'ema') router.push('/journal');
    else router.push(`/practice/${d.practice}` as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48, gap: 16 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ transform: [{ rotate: '180deg' }] }}><Icon.arrowRight size={18} color={t.text} /></View>
          </Pressable>
          <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '600' }}>
            {ru ? `${step.titleRu} · день ${day} из ${track.totalDays}` : `${step.titleEn} · day ${day} of ${track.totalDays}`}
          </Text>
        </View>

        {/* Hero */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 2 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c + '24', alignItems: 'center', justifyContent: 'center' }}>
            {isPast ? <Icon.check size={30} color={c} /> : <Text style={{ color: c, fontSize: 26, fontWeight: '800' }}>{day}</Text>}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>{ru ? `День ${day}` : `Day ${day}`}</Text>
            <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 19 }}>{focus}</Text>
          </View>
          {isToday && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: c + '24' }}>
              <Text style={{ color: c, fontSize: 11, fontWeight: '800' }}>{ru ? 'СЕГОДНЯ' : 'TODAY'}</Text>
            </View>
          )}
        </View>

        {/* Reassurance */}
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: c + '12', borderWidth: 1, borderColor: c + '30', flexDirection: 'row', gap: 12 }}>
          <Icon.heart size={20} color={c} />
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 21, flex: 1 }}>{reassure}</Text>
        </View>

        {!!science && <Section t={t} icon="compass" color={c} label={ru ? 'Что сегодня' : 'What today holds'} body={science} />}
        {!!why && <Section t={t} icon="brain" color={t.info} label={ru ? 'Почему это работает' : 'Why it works'} body={why} />}
        {!!task && <Section t={t} icon="target" color={t.accent} label={ru ? 'Задача дня' : "Today's task"} body={task} />}
        {!!med && <Section t={t} icon="pill" color={t.warn} label={ru ? 'Препарат сегодня' : 'Medication today'} body={med} />}

        {!!d.practice && (
          <Pressable onPress={startPractice}
            style={({ pressed }) => ({ marginTop: 6, padding: 18, borderRadius: radius.xl, backgroundColor: c, alignItems: 'center', opacity: pressed ? 0.9 : 1, flexDirection: 'row', justifyContent: 'center', gap: 8 })}>
            <Icon.play size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{ru ? 'Сделать практику дня' : "Do today's practice"}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ t, icon, color, label, body }: { t: Theme; icon: IconKey; color: string; label: string; body: string }) {
  const I = Icon[icon];
  return (
    <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: color + '1E', alignItems: 'center', justifyContent: 'center' }}>
          <I size={15} color={color} />
        </View>
        <Text style={{ color: t.text, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
      </View>
      <Text style={{ color: t.text, fontSize: 15, lineHeight: 23 }}>{body}</Text>
    </View>
  );
}
