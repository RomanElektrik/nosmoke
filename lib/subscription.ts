// Subscription / Premium gating. Реальная оплата подключена через ЮKassa
// (lib/billing.ts + серверный рекуррент). `devPremium` — dev-only тоггл из
// профиля для теста заблокированных фич; в проде он не выставляется и не читается.

import { useAppState, cachedState } from './storage';
import { currentLang } from './i18n';

// Flat 10 messages/day on the free tier — generous and honest, no shrinking
// tricks. Enough to prove Breeze helps; premium removes the limit entirely.
export const FREE_AI_DAILY_LIMIT = 10;

/** First N items from a list are free; the rest are premium-gated. */
// ⚠️ Здесь id ТЕХНИК (lib/techniques.ts), а не practice-id. Была рассинхронизация:
// стояло 'halt_check' (это practice), а техника называется 'halt' — то есть HALT
// молча считалась платной. Держим оба написания, чтобы не переломать ещё раз.
export const FREE_TECHNIQUE_IDS = new Set([
  'cyclic_sigh', 'box_breath', 'urge_surf', 'halt', 'halt_check', 'if_then',
]);

export const FREE_ARTICLE_COUNT = 3;

// Единый список бесплатных статей для ВСЕХ экранов.
//
// 🔴 Раньше он считался в двух местах по-разному: app/articles.tsx брал первые
// три по порядку показа ПЛЮС все статьи про лекарства, а главный экран — просто
// первые три по порядку массива. Из-за этого «Лекарства: цитизин, бупропион,
// варениклин» на главной висела с замком и вела в пейвол, а в списке статей
// открывалась бесплатно. Безопасность лекарств за деньги — прямое нарушение
// wellness-правила проекта (CLAUDE.md).
const ARTICLE_ORDER: ArticleCategory[] = ['craving', 'slip', 'triggers', 'body', 'meds', 'motivation'];

export function freeArticleIds(): Set<string> {
  const displayOrder = ARTICLE_ORDER.flatMap((cat) => ARTICLES.filter((a) => a.category === cat));
  return new Set([
    ...displayOrder.slice(0, FREE_ARTICLE_COUNT).map((a) => a.id),
    ...ARTICLES.filter((a) => a.category === 'meds').map((a) => a.id),
  ]);
}

/** First N audio practices (by PRACTICES order) are free; the rest are premium. */
export const FREE_PRACTICE_COUNT = 3;

/** 🔴 Ступени (в т.ч. фарма — цитизин/бупропион/варениклин) и вся безопасность
 *  ВСЕГДА бесплатны — wellness-правило: нельзя брать деньги за доступ к
 *  информации о препаратах. Функция оставлена возвращающей false, чтобы случайное
 *  «гейтнуть по аналогии» не запёрло мед-блок за paywall. */
export function isStepPremium(_stepId: string | undefined): boolean {
  return false;
}

export function isTechniquePremium(techId: string, tags?: readonly string[]): boolean {
  return !FREE_TECHNIQUE_IDS.has(techId);
}

/** Hook: returns whether the current user has premium access — dev toggle OR a
 *  server-validated ЮKassa subscription that hasn't expired. */
export function usePremium(): boolean {
  const [state] = useAppState();
  // Платная модель действует ТОЛЬКО для российских юзеров (язык RU + регион
  // устройства RU): ЮKassa принимает лишь карты РФ, а IAP с российского
  // dev-аккаунта невозможен (Apple остановила платные функции и выплаты).
  // Всем остальным приложение полностью бесплатно — пейвол для них недостижим.
  if (!isRuMarket()) return true;
  // devPremium — только в dev-сборке. На чтении тоже гейтим __DEV__, чтобы
  // случайно persist'нутый флаг не дал вечный премиум в проде (один bundleId).
  if (__DEV__ && state.profile?.devPremium) return true;
  return !!state.premiumUntil && state.premiumUntil > Date.now();
}

/** Российский рынок = РУССКИЙ ЯЗЫК интерфейса. Только здесь есть оплата и
 *  премиум-замки (ЮKassa принимает лишь карты РФ).
 *
 *  🔴 Регион устройства НЕ проверяем намеренно: масса россиян держит регион
 *  App Store не «RU» (США/Казахстан — иначе часть приложений не поставить).
 *  Требование region === 'RU' отрезало таким людям оплату: пейвол открывался
 *  и тут же закрывался, а приложение считало их «бесплатным рынком». */
export function isRuMarket(): boolean {
  try {
    const latched = cachedState()?.market;
    if (latched) return latched === 'ru';
    // Миграция: у тех, кто ставил приложение до появления поля, рынок ещё не
    // залатчен — выводим из выбранного языка (и он залатчится на старте).
    return marketForLang(cachedState()?.lang ?? cachedState()?.profile?.language ?? currentLang()) === 'ru';
  } catch { return false; }
}

/** Язык → рынок. Единственное место, где делается это сопоставление. */
export function marketForLang(lang: string | undefined | null): 'ru' | 'intl' {
  return lang === 'ru' ? 'ru' : 'intl';
}

/** AI usage helpers — count messages sent today (free tier). */
import { localDateKey } from './dates';
import { ARTICLES, type ArticleCategory } from './articles';
export function todayKey(d = new Date()): string {
  return localDateKey(d);
}

export function aiUsedToday(state: { aiUsage?: { date: string; count: number } }): number {
  const u = state.aiUsage;
  if (!u || u.date !== todayKey()) return 0;
  return u.count;
}

export function aiRemainingToday(state: { aiUsage?: { date: string; count: number } }, premium: boolean): number | null {
  if (premium) return null; // unlimited
  return Math.max(0, FREE_AI_DAILY_LIMIT - aiUsedToday(state));
}
