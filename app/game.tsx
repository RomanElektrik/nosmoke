// Distraction mini-game for craving moments — "2048".
// A craving is a 3–5 min wave; a calm, absorbing puzzle helps ride it out.
// No timer, no losing pressure — when the board fills, a gentle restart.
import { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { Icon } from '../components/Icon';

type Grid = number[]; // length 16, 0 = empty
type Dir = 'left' | 'right' | 'up' | 'down';

function emptyGrid(): Grid { return Array(16).fill(0); }

function spawn(g: Grid): Grid {
  const empty: number[] = [];
  g.forEach((v, i) => { if (v === 0) empty.push(i); });
  if (empty.length === 0) return g;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  const next = g.slice();
  next[idx] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function newGame(): Grid { return spawn(spawn(emptyGrid())); }

// Slide+merge a single row to the LEFT. Returns the new row and points gained.
function slideRow(row: number[]): { row: number[]; gained: number } {
  const nums = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      out.push(nums[i] * 2);
      gained += nums[i] * 2;
      i++;
    } else {
      out.push(nums[i]);
    }
  }
  while (out.length < 4) out.push(0);
  return { row: out, gained };
}

function getRow(g: Grid, r: number): number[] { return [g[r * 4], g[r * 4 + 1], g[r * 4 + 2], g[r * 4 + 3]]; }
function getCol(g: Grid, c: number): number[] { return [g[c], g[c + 4], g[c + 8], g[c + 12]]; }

function move(g: Grid, dir: Dir): { grid: Grid; gained: number; moved: boolean } {
  const next = g.slice();
  let gained = 0;
  for (let i = 0; i < 4; i++) {
    let line = dir === 'left' || dir === 'right' ? getRow(g, i) : getCol(g, i);
    const reversed = dir === 'right' || dir === 'down';
    if (reversed) line = line.slice().reverse();
    const res = slideRow(line);
    gained += res.gained;
    let outLine = res.row;
    if (reversed) outLine = outLine.slice().reverse();
    for (let j = 0; j < 4; j++) {
      if (dir === 'left' || dir === 'right') next[i * 4 + j] = outLine[j];
      else next[j * 4 + i] = outLine[j];
    }
  }
  const moved = next.some((v, i) => v !== g[i]);
  return { grid: next, gained, moved };
}

function hasMoves(g: Grid): boolean {
  if (g.some((v) => v === 0)) return true;
  return (['left', 'up'] as Dir[]).some((d) => move(g, d).moved);
}

const TILE: Record<number, { bg: string; fg: string }> = {
  2:    { bg: '#DCEFE3', fg: '#3B5446' },
  4:    { bg: '#C6E7D3', fg: '#33513F' },
  8:    { bg: '#9BD9B6', fg: '#1F3A2A' },
  16:   { bg: '#6FCB9A', fg: '#11261A' },
  32:   { bg: '#43BE80', fg: '#FFFFFF' },
  64:   { bg: '#2BB36C', fg: '#FFFFFF' },
  128:  { bg: '#1FA0B8', fg: '#FFFFFF' },
  256:  { bg: '#1E8FD6', fg: '#FFFFFF' },
  512:  { bg: '#6A6FE0', fg: '#FFFFFF' },
  1024: { bg: '#9B5CE0', fg: '#FFFFFF' },
  2048: { bg: '#FFB23D', fg: '#FFFFFF' },
};

export default function Game() {
  const t = useTheme();
  const router = useRouter();
  const ru = currentLang() === 'ru';

  const [grid, setGrid] = useState<Grid>(() => newGame());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const won = useRef(false);

  const doMove = useCallback((dir: Dir) => {
    setGrid((g) => {
      const res = move(g, dir);
      if (!res.moved) return g;
      if (res.gained > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else Haptics.selectionAsync();
      setScore((s) => {
        const ns = s + res.gained;
        setBest((b) => Math.max(b, ns));
        return ns;
      });
      const withSpawn = spawn(res.grid);
      if (!won.current && withSpawn.includes(2048)) {
        won.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (!hasMoves(withSpawn)) setOver(true);
      return withSpawn;
    });
  }, []);

  function restart() {
    Haptics.selectionAsync();
    setGrid(newGame());
    setScore(0);
    setOver(false);
    won.current = false;
  }

  const pan = Gesture.Pan()
    .minDistance(24)
    .onEnd((e) => {
      'worklet';
      const dx = e.translationX;
      const dy = e.translationY;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      const dir: Dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      runOnJS(doMove)(dir);
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {ru ? 'Закрыть' : 'Close'}</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center', gap: 18 }}>
        <View>
          <Text style={{ color: t.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>
            {ru ? 'Собери 2048' : 'Make 2048'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
            {ru
              ? 'Свайпай — одинаковые плитки сливаются. Залипни на пару минут, пока тяга проходит.'
              : 'Swipe — equal tiles merge. Sink into it for a few minutes while the craving passes.'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ScoreBox label={ru ? 'Очки' : 'Score'} value={score} t={t} />
          <ScoreBox label={ru ? 'Рекорд' : 'Best'} value={best} t={t} />
        </View>

        <GestureDetector gesture={pan}>
          <View style={{
            aspectRatio: 1, backgroundColor: t.bgElev, borderRadius: radius.lg,
            borderWidth: 1, borderColor: t.border, padding: 8,
            flexDirection: 'row', flexWrap: 'wrap',
          }}>
            {grid.map((v, i) => {
              const tile = TILE[v] ?? { bg: '#FFB23D', fg: '#fff' };
              return (
                <View key={i} style={{ width: '25%', height: '25%', padding: 4 }}>
                  <View style={{
                    flex: 1, borderRadius: radius.md,
                    backgroundColor: v === 0 ? t.border + '60' : tile.bg,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {v > 0 && (
                      <Text style={{
                        color: tile.fg, fontWeight: '800',
                        fontSize: v >= 1024 ? 20 : v >= 128 ? 24 : 28,
                        letterSpacing: -0.5,
                      }}>{v}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </GestureDetector>

        <Pressable onPress={restart}
          style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: t.border }}>
          <Icon.spark size={16} color={t.textDim} />
          <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{ru ? 'Новая игра' : 'New game'}</Text>
        </Pressable>
      </View>

      {over && (
        <View style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: t.bg + 'F2', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 14,
        }}>
          <View style={{ width: 88, height: 88, borderRadius: 26, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.leaf size={48} color={t.accent} />
          </View>
          <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' }}>
            {ru ? 'Раунд окончен' : 'Round over'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
            {ru
              ? `Поле заполнено. Очки: ${score}. А тяга за это время наверняка уже отступила — это и было целью.`
              : `Board is full. Score: ${score}. The craving has likely faded by now — that was the point.`}
          </Text>
          <Pressable onPress={restart}
            style={{ marginTop: 6, paddingVertical: 15, paddingHorizontal: 40, borderRadius: radius.xl, backgroundColor: t.accent }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{ru ? 'Ещё раз' : 'Play again'}</Text>
          </Pressable>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={{ padding: 12 }}>
            <Text style={{ color: t.textDim, fontWeight: '600' }}>{ru ? 'Вернуться' : 'Back'}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function ScoreBox({ label, value, t }: { label: string; value: number; t: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: t.bgElev, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, paddingVertical: 10, alignItems: 'center' }}>
      <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 }}>{value}</Text>
    </View>
  );
}
