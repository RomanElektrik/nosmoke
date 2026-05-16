import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Rect, ClipPath } from 'react-native-svg';
import { useTheme, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { Icon } from './Icon';
import type { Profile } from '../lib/storage';
import { moneySaved, formatMoney } from '../lib/money';
import { secondsClean } from '../lib/health';

export function MoneyJar({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const secs = secondsClean(profile.quitDate);
  const saved = moneySaved(profile, secs);
  const goal = profile.goalAmount ?? 0;
  const hasGoal = !!goal && !!profile.goalLabel;
  const pct = hasGoal ? Math.min(1, saved / goal) : 0;

  if (!hasGoal) {
    return (
      <Pressable onPress={onPress}>
        <View style={{
          padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev,
          borderWidth: 1, borderStyle: 'dashed', borderColor: t.border,
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#30D15820', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.target size={26} color="#30D158" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
              {lang === 'ru' ? 'Поставь цель' : 'Set a goal'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {lang === 'ru' ? 'На что потратишь сэкономленное' : 'What to spend savings on'}
            </Text>
          </View>
          <Text style={{ color: t.accent, fontSize: 22, fontWeight: '700' }}>+</Text>
        </View>
      </Pressable>
    );
  }

  const reached = pct >= 1;
  return (
    <Pressable onPress={onPress}>
      <LinearGradient colors={['#30D15828', '#30D15808']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: '#30D15840', flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <Jar pct={pct} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Копилка' : 'Jar'}
          </Text>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
            {profile.goalLabel}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4 }}>
            {formatMoney(saved, profile.currency, lang === 'ru' ? 'ru-RU' : 'en-US')} / {formatMoney(goal, profile.currency, lang === 'ru' ? 'ru-RU' : 'en-US')}
          </Text>
          <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 6, marginTop: 8, overflow: 'hidden' }}>
            <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: '#30D158' }} />
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: '#30D158', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>
            {Math.round(pct * 100)}%
          </Text>
          {reached && <Icon.confetti size={20} color="#FF9500" />}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function Jar({ pct }: { pct: number }) {
  const w = 64, h = 80;
  const fillH = (h - 18) * pct;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGrad id="liquid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#30D158" />
          <Stop offset="1" stopColor="#0A84FF" />
        </SvgGrad>
        <ClipPath id="jar">
          <Path d="M16 14 H48 V18 Q56 18 56 26 V70 Q56 78 48 78 H16 Q8 78 8 70 V26 Q8 18 16 18 Z" />
        </ClipPath>
      </Defs>
      <Rect x="8" y={h - 8 - fillH} width="48" height={fillH} fill="url(#liquid)" clipPath="url(#jar)" />
      <Path d="M16 14 H48 V18 Q56 18 56 26 V70 Q56 78 48 78 H16 Q8 78 8 70 V26 Q8 18 16 18 Z"
        stroke="#30D158" strokeWidth="2" fill="none" />
      <Path d="M22 8 H42 Q44 8 44 10 V14 H20 V10 Q20 8 22 8 Z" stroke="#30D158" strokeWidth="2" fill="none" />
    </Svg>
  );
}
