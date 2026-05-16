# Без сигарет / Smoke-Free

Кросс-платформенное (iOS + Android) приложение помощи в отказе от курения. Стек: Expo + expo-router + TypeScript.

## Что внутри

- **Онбординг**: 9 шагов (стаж, сигарет/день, цена, тип, утренняя сигарета, триггеры, мотивация, метод, духовная поддержка) → персональный план + расчёт балла Фагерстрёма.
- **Дашборд**: streak-кольцо, сэкономлено, не выкурено, возвращено жизни (CDC: 11 мин/сигарету), микро-задача дня, sticky SOS.
- **Восстановление**: 12 научных вех от 20 минут до 15 лет (CDC, NHS, AHA) с прогресс-барами.
- **Каталог техник**: 14 методов с маркером доказательности (A/B/C) — CBT, urge surfing, дыхание 4-4-4-4, HALT, if-then planning, NRT, mindfulness, taper, EMA-дневник, money jar, social contract, ritual replacement, faith.
- **SOS**: дыхание 60 секунд → варианты (urge surfing / коуч / друг / молитва) → лог тяги (1–10, триггер, исход).
- **Срыв**: без обнуления, 3 «жизни» в месяц, ИИ-коуч генерит план на 48 часов.
- **ИИ-коуч**: чат через прокси к OpenRouter, 3 режима (поддержка / разбор срыва / задание дня).
- **Локальные пуши**: каждые 2ч в день 1, утро/вечер дни 2–7, на каждую веху здоровья.
- **Духовный блок**: молитва Оптинских старцев, отрывок 1 Кор 6:12, шаг исповеди — опционально, флагом из онбординга.
- **i18n**: RU + EN с первого дня, переключается в профиле.
- **Apple-like UI**: BlurView-карточки, реанимированный «дышащий» круг, haptics, dark mode из коробки.

## Установка

```bash
cd "/Users/romansuzdalcev/бросить курить"
npm install
npx expo start
```

> **⚠️ Cyrillic path:** Metro иногда плохо работает с не-ASCII путями. Если столкнёшься с ошибками сборки, скопируй проект в `~/dev/quit-smoke` и продолжай оттуда.

## ИИ-коуч (OpenRouter через сервер svechaapp)

В `/Users/romansuzdalcev/svechaapp/server/quit-coach.js` лежит готовый эндпоинт `/api/quit-coach`. Для активации:

1. В `svechaapp/server/server.js` сразу после `const app = express();` добавь:
   ```js
   require('./quit-coach')(app);
   ```
2. В `.env` сервера добавь shared secret (любая случайная строка):
   ```
   QUITCOACH_APP_KEY=somelongrandomsecret
   QUITCOACH_MODEL=anthropic/claude-sonnet-4.5
   QUITCOACH_DAILY_LIMIT=50
   ```
3. Перезапусти svechaapp сервер. Проверь:
   ```bash
   curl -X POST https://<твой-домен>/api/quit-coach \
     -H 'content-type: application/json' \
     -H 'x-app-key: somelongrandomsecret' \
     -d '{"messages":[{"role":"user","content":"hi"}],"locale":"ru"}'
   ```
4. В корне quit-smoke создай `.env`:
   ```
   EXPO_PUBLIC_AI_PROXY_URL=https://<твой-домен>/api/quit-coach
   EXPO_PUBLIC_AI_PROXY_KEY=somelongrandomsecret
   ```

Эндпоинт переиспользует `OPENROUTER_KEY_1..8` из `svechaapp/server/.env` и ротирует их при 429/5xx, лимит 50 запросов/день/устройство.

## Сборка билдов

```bash
npx eas build -p ios --profile preview
npx eas build -p android --profile preview
```

(Понадобится `eas.json` и Apple/Google аккаунты — добавишь, когда будешь готов выкладывать в магазины.)

## Дальше (v1.1)

- Apple Health / Health Connect: пульс/сон → корреляция с тягой.
- Виджеты iOS/Android (streak + сэкономлено).
- Соц.-контракт через deep link.
- Аудио-медитации (3-5 файлов в `assets/`) — Brewer "Craving to Quit".
- Иконка приложения и splash (нужен дизайнер или Figma).
