// Нативный запрос оценки приложения (Apple StoreReview) в позитивный момент:
// после победы над тягой в SOS или на веху без сигарет. Apple САМА показывает
// свой системный промт и лимитирует показ (~3 раза в год) — никаких фейковых
// отзывов, просто просьба оценить в правильный миг. Локально — не чаще раза в
// 90 дней, чтобы не жечь попытки Apple впустую.
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'qs:review-asked:v1';
const COOLDOWN_MS = 90 * 86400_000;

export async function maybeAskReview(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const last = raw ? Number(raw) : 0;
    if (last && Date.now() - last < COOLDOWN_MS) return;
    // hasAction() = доступно ли на этой платформе/сборке (в Expo Go / симуляторе
    // системный промт может не показаться — тогда просто выходим).
    if (!(await StoreReview.hasAction())) return;
    await AsyncStorage.setItem(KEY, String(Date.now()));
    await StoreReview.requestReview();
  } catch {}
}
