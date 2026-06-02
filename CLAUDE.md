# Правила проекта — NoSmokeUp (quit-smoke)

Приложение для отказа от курения. Stepped-care система с 5 ступенями (поведенческие → цитизин → бупропион → варениклин), ИИ-помощник по USPSTF 5A's, дневник лекарств, lapse recovery, локальные пуши, офлайн-first.

## 🔴 ЮРИДИЧЕСКОЕ ПРАВИЛО — ЧИТАТЬ ПЕРВЫМ

Это **wellness-приложение**, НЕ медицинское изделие. От этой грани зависит будет ли его принимать App Store / Play Store и не наступит ли юридическая ответственность.

### Что это значит конкретно

1. **Wellness-формулировки** — везде. В UI, ASO, метаданных стора, описаниях.
   - ❌ «лечение табачной зависимости», «терапия», «диагностика», «врач рекомендует»
   - ✅ «поддержка в отказе», «программа для бросающих», «инструменты и сопровождение»
2. **ИИ не ставит диагнозы, не назначает препараты, не меняет дозировку.** Только поддержка + ссылки на врача.
3. **Препараты — только через gate:**
   - Подтверждение «у меня есть рецепт врача» (не один тап)
   - Экран противопоказаний с явным «прочитал и согласен» (см. skill `medication-safety`)
   - Возрастной gate ≥18
   - Скрининг беременности/лактации в онбординге (блокирует фарму)
4. **Дисклеймер видимый, не в подвале.** На каждом экране с дозировками.
5. **Опасные комбинации** (РПП + бупропион, ССЗ + цитизин, психиатрия + варениклин) блокируют активацию ступени.

P0 задачи из плана доработки (см. Obsidian) — **блокеры релиза**, всё это.

## Стек

```
Expo SDK 54 + RN 0.81.4 + React 19.1 + TypeScript
  ↓
expo-router 6 (file-based, app/ = роуты) | reanimated 4 + worklets
  ↓
AsyncStorage (офлайн-first) | i18next (RU/EN) | react-native-svg
  ↓
expo-notifications (нужен dev-build для пушей) | expo-blur/linear-gradient/haptics
  ↓
OpenRouter API → Gemini 2.5 Flash Lite (для ИИ-чата)
```

Подробности — см. skill `expo-router-stack`.

## Где работаем

- **Локалка:** `npx expo start --clear --lan` (кириллица в пути требует `--clear` часто)
- **app/_layout.tsx** — корневой Stack
- **app/(tabs)/** — 5 табов: Главная, Здоровье, Техники, Помощник, Я
- **lib/** — вся бизнес-логика без UI
- **locales/** — `ru.json`, `en.json`

## Билды

```bash
# Превью / TestFlight
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Прод
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android

# OTA-апдейт
eas update --branch production --message "fix: ..."
```

**🔴 НЕ запускать `eas build --auto-submit` без явной просьбы.**

## 🔴 Безопасность ключей

- **OpenRouter API key** — `.env` (`EXPO_PUBLIC_OPENROUTER_KEY`), дублируется в `eas.json` production env. **Не в код, не в Bash inline.**
- `.env` и `eas.json` — в `.gitignore`, проверять перед commit.
- Hook `block_secrets.py` блокирует Bash-команды с inline ключами автоматически.

## ⚠️ Перед метриками / формулами / клиническими порогами

**Источник правды — Obsidian vault**, не код.

Vault: `/Users/romansuzdalcev/Documents/Документы — MacBook Air — Роман/Obsidian Vault/NoSmokeUp/`

Ключевые файлы перед правкой:
- `Stepped-care система.md` — алгоритм 5 ступеней, recommendStep, escalation
- `Научная база.md` — RR методов из Cochrane/USPSTF/NICE
- `Программа и треки.md` — per-method треки
- `Срыв и Lapse Recovery.md` — slip-логика (Marlatt RP + AVE)
- `Аудит пути пользователя.md` — UX-карта
- `План доработки.md` — приоритезированный TODO (P0/P1/P2/P3)
- `Косяки и TODO.md` — известные нюансы
- `Сборка и деплой.md` — TestFlight чек-лист
- `Ресёрч — Доказательность и регуляторика.md` — юридические нюансы
- `Экспертиза нарколога.md` — медицинская валидация

**Ни одной правки формул без чтения этих файлов первым.**

## ⚠️ Перед «готово» для UI

Проверка **на физическом устройстве через `expo start --clear --lan`** (не симулятор, не «должно работать по коду»). Особенно — навигация, edge-swipe, bottom sheet `craving`, чат с автоскроллом.

Для пушей и нативных API — **dev-build** через `eas build --profile development`, не Expo Go.

## Известные нюансы (накопленная боль)

1. **Кириллица в пути** `/бросить курить/` — Metro капризничает. Лечится `npx expo start --clear`. Если не помогает — `rm -rf $TMPDIR/metro-* .expo node_modules/.cache`.
2. **Expo Go ограничен** — пуши, часть нативных модулей не работают. Для них — dev-build.
3. **Старые сборки кешируются** — после правок `app.json`, новых пакетов, обновлений SDK всегда `--clear`.
4. **Зависимость багов от ступени:** при 3+ срывах и отказе от фармы wizard ведёт в L4/L5 — нужен поведенческий интенсив-трек (P1).
5. **Баг Фагерстрёма** — в `quiz.tsx` урезанная шкала 0–6 (HSI), а пороги в `recommendStep` ждут 0–10 (FTND). P0.

## Subagents

- `@code-reviewer` — ревью diff перед commit
- `@debugger` — диагностика падений / race conditions
- `@security-auditor` — проверка перед релизом, особенно фарма и ключи
- `@prompt-rewriter` — переписать голосовой / сырой ввод в чёткий промт (адаптирован под NoSmokeUp)

## Serena MCP

Подключён через `.mcp.json` — используй `find_symbol`, `get_references`, `replace_symbol_body` вместо grep по большим файлам (`lib/stepped.ts`, `app/transition.tsx`, `lib/ai.ts`).

## Подгружаемые skills (`.claude/skills/`)

Подгружаются по релевантности:
- `stepped-care` — 5 ступеней, recommendStep, escalation, transition wizard
- `medication-safety` — **P0 фарма-правила** (gate, противопоказания, дисклеймер, wellness-язык)
- `ai-coach` — OpenRouter + Gemini, 3 режима, USPSTF 5A's, deep-link маркеры `[[key]]`
- `expo-router-stack` — стек, навигация, грабли (кириллица в пути, Expo Go, кэши)

## НЕ ТРОГАТЬ без явной просьбы

- `app.json` → `version`, `ios.buildNumber`, `android.versionCode` — менять только при релизе
- `store-screens/`, `store-screens-ipad/`, `скрины эпл/` — assets для стора
- Тексты в `locales/` без проверки на wellness-формулировки (см. правило выше)
- Дозировки в `lib/medication.ts` — только сверяясь с инструкциями производителей + Obsidian `Научная база.md`
