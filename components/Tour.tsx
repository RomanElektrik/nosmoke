// First-run guided tour — a spotlight coach-mark walkthrough shown once after
// onboarding. It dims the screen and highlights real elements (live counter,
// tools, the SOS button, the bottom bar) with a card explaining "what's where".
//
// How it wires together:
//   <TourProvider> sits at the root and holds the measured rect of every
//   registered anchor + the running step. Screens wrap elements they want
//   highlighted in <TourAnchor anchorKey="…">. The overlay reads the rect for
//   the current step and punches a spotlight hole over it. Missing rect →
//   centered card (graceful fallback). Finishing/skipping persists tourV1Done.

import React, { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, BackHandler, useWindowDimensions, type ViewStyle } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { update } from '../lib/storage';

type Box = { x: number; y: number; width: number; height: number };

type Step = {
  key: string;
  anchor: string | null;
  titleRu: string; bodyRu: string;
  titleEn: string; bodyEn: string;
};

// The tour. Anchors point at elements registered via <TourAnchor>. `null`
// anchor = centered card (welcome / outro).
const STEPS: Step[] = [
  { key: 'welcome', anchor: null,
    titleRu: 'Это «Бриз»', bodyRu: 'Покажу за 20 секунд, что где — и отпущу. Дальше всё своё.',
    titleEn: 'This is Breeze', bodyEn: 'A 20-second tour of what’s where, then you’re on your own.' },
  { key: 'hero', anchor: 'home.hero',
    titleRu: 'Твой прогресс — вживую', bodyRu: 'Дни без сигарет, сэкономленные деньги и восстановление тела идут в реальном времени.',
    titleEn: 'Your progress, live', bodyEn: 'Days smoke-free, money saved and body recovery tick in real time.' },
  { key: 'tools', anchor: 'home.tools',
    titleRu: 'Главные инструменты', bodyRu: 'Помощник-ИИ всегда на связи, техники на любой момент и письмо себе на трудный день.',
    titleEn: 'Your main tools', bodyEn: 'The AI coach is always there, techniques for any moment, and a letter to yourself.' },
  { key: 'sos', anchor: 'tab.sos',
    titleRu: 'Накрыла тяга — жми SOS', bodyRu: 'Красная кнопка снизу всегда рядом. Переждём волну вместе за 3 минуты.',
    titleEn: 'A craving? Hit SOS', bodyEn: 'The red button is always there. We ride the wave out together in 3 minutes.' },
  { key: 'tabs', anchor: 'tab.bar',
    titleRu: 'Всё под рукой', bodyRu: 'Снизу: Главная, Прогресс с графиками, Награды и твой профиль.',
    titleEn: 'Everything at hand', bodyEn: 'Bottom bar: Home, Progress with charts, Awards and your profile.' },
  { key: 'done', anchor: null,
    titleRu: 'Готово — ты справишься', bodyRu: 'Станет тяжело — помни про SOS внизу. Бриз рядом.',
    titleEn: 'Done — you’ve got this', bodyEn: 'When it gets hard, remember SOS at the bottom. Breeze is here.' },
];

type TourCtx = {
  register: (key: string, rect: Box) => void;
  start: () => void;
};
const Ctx = createContext<TourCtx | null>(null);
export const useTour = () => useContext(Ctx);
// Separate channel for "re-measure now" so bumping it doesn't churn the main
// context identity (which would re-fire Home's start effect). Anchors re-measure
// whenever this changes — on tour start and on every step — so the spotlight
// always matches the element's CURRENT on-screen position (the home list shifts
// as async cards mount, making mount-time rects stale).
const MeasureCtx = createContext(0);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<Record<string, Box>>({});
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [measureTick, setMeasureTick] = useState(0);
  const pathname = usePathname();

  const register = useCallback((key: string, rect: Box) => {
    setTargets((prev) => {
      const cur = prev[key];
      if (cur && Math.abs(cur.x - rect.x) < 1 && Math.abs(cur.y - rect.y) < 1
        && Math.abs(cur.width - rect.width) < 1 && Math.abs(cur.height - rect.height) < 1) return prev;
      return { ...prev, [key]: rect };
    });
  }, []);

  const start = useCallback(() => { setIdx(0); setRunning(true); setMeasureTick((n) => n + 1); }, []);

  const finish = useCallback(() => {
    setRunning(false);
    update((s) => ({ ...s, tourV1Done: true }));
  }, []);

  const next = useCallback(() => {
    setMeasureTick((n) => n + 1); // re-measure the next step's anchor
    setIdx((i) => {
      if (i >= STEPS.length - 1) { finish(); return i; }
      return i + 1;
    });
  }, [finish]);

  // Auto-dismiss the moment the user leaves the screen the tour opened on
  // (it only ever starts on Home). Prevents a root-level overlay from dimming
  // and blocking input over a pushed route — e.g. a tapped craving-nudge → SOS.
  const runPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!running) { runPathRef.current = null; return; }
    if (runPathRef.current === null) runPathRef.current = pathname;
    else if (pathname !== runPathRef.current) finish();
  }, [running, pathname, finish]);

  // `running` is deliberately NOT in the context value — consumers (Home) only
  // need `start`. Including it would churn the context identity on start() and
  // re-fire Home's start effect, snapping the tour back to step 1.
  const ctx = useMemo(() => ({ register, start }), [register, start]);

  const step = STEPS[idx];
  const rect = step.anchor ? targets[step.anchor] : undefined;

  return (
    <Ctx.Provider value={ctx}>
      <MeasureCtx.Provider value={measureTick}>
        {children}
        {running && (
          <Overlay step={step} idx={idx} total={STEPS.length} rect={rect} onNext={next} onSkip={finish} />
        )}
      </MeasureCtx.Provider>
    </Ctx.Provider>
  );
}

// Wrap any element to make it spotlight-able. Measures its on-screen rect and
// registers it under `anchorKey`.
export function TourAnchor({ anchorKey, children, style, pointerEvents }:
  { anchorKey: string; children: React.ReactNode; style?: ViewStyle; pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only' }) {
  const tour = useTour();
  const tick = useContext(MeasureCtx);
  const ref = useRef<View>(null);
  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, w, h) => {
      if (w > 0 && h > 0 && tour) tour.register(anchorKey, { x, y, width: w, height: h });
    });
  }, [anchorKey, tour]);
  // Re-measure when the tour starts/advances (tick) — captures the element's
  // current position after async cards have shifted the layout. rAF lets the
  // frame settle first.
  useEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [tick, measure]);
  return (
    <View ref={ref} collapsable={false} onLayout={measure} style={style} pointerEvents={pointerEvents}>
      {children}
    </View>
  );
}

function Overlay({ step, idx, total, rect, onNext, onSkip }:
  { step: Step; idx: number; total: number; rect?: Box; onNext: () => void; onSkip: () => void }) {
  const t = useTheme();
  const ru = currentLang() === 'ru';
  const { width: W, height: H } = useWindowDimensions();
  const title = ru ? step.titleRu : step.titleEn;
  const body = ru ? step.bodyRu : step.bodyEn;
  const last = idx === total - 1;

  // Hardware back (Android) dismisses the tour instead of popping the stack
  // out from under the still-running overlay.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onSkip(); return true; });
    return () => sub.remove();
  }, [onSkip]);

  // Spotlight only when the target is actually on-screen; otherwise centre the card.
  const PAD = 8;
  const onScreen = !!rect && rect.y + rect.height > 40 && rect.y < H - 40;
  const hole = rect && onScreen
    ? { x: Math.max(6, rect.x - PAD), y: Math.max(6, rect.y - PAD), w: rect.width + PAD * 2, h: rect.height + PAD * 2 }
    : null;
  // Round targets (e.g. the SOS circle) get a circular cutout; others a rounded rect.
  const holeR = hole ? (Math.abs(hole.w - hole.h) <= 14 ? Math.min(hole.w, hole.h) / 2 : 16) : 16;

  // Card sits opposite the hole's half of the screen; centred if no hole.
  let cardStyle: ViewStyle;
  if (hole) {
    const below = hole.y + hole.h / 2 < H / 2;
    cardStyle = below ? { top: hole.y + hole.h + 16 } : { bottom: H - hole.y + 16 };
  } else {
    cardStyle = { top: H / 2 - 110 };
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="tourHole">
            <Rect x={0} y={0} width={W} height={H} fill="#fff" />
            {hole && <Rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={holeR} ry={holeR} fill="#000" />}
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} fill="rgba(5,8,12,0.84)" mask="url(#tourHole)" />
        {hole && (
          <Rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={holeR} ry={holeR}
            fill="none" stroke={t.accent} strokeWidth={2} />
        )}
      </Svg>

      <View style={[{ position: 'absolute', left: 18, right: 18 }, cardStyle]}>
        <Animated.View entering={FadeIn.duration(220)}
          style={{
            backgroundColor: t.bgElev, borderRadius: 20, borderWidth: 1, borderColor: t.border,
            padding: 18, gap: 7,
            shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12,
          }}>
          <Text style={{ color: t.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
            {idx + 1} / {total}
          </Text>
          <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
          <Text style={{ color: t.textDim, fontSize: 14.5, lineHeight: 20 }}>{body}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Pressable onPress={onSkip} hitSlop={10}>
              <Text style={{ color: t.textDim, fontSize: 14, fontWeight: '600' }}>{ru ? 'Пропустить' : 'Skip'}</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.selectionAsync(); onNext(); }}
              style={({ pressed }) => ({
                backgroundColor: t.accent, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 14,
                opacity: pressed ? 0.9 : 1,
              })}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                {last ? (ru ? 'Понятно' : 'Got it') : (ru ? 'Далее' : 'Next')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
