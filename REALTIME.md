# Real-time голос Бриза — как доделать (отдельная веха)

Сейчас звонок — turn-based (сценарий/реплики) + ускоренный стриминг в чате. Настоящий
**живой дуплекс** (перебиваешь голосом, мгновенный ответ) в Expo Go невозможен — нужен
**dev-build** и **бэкенд**. Каркас уже заложен в `lib/realtime.ts`.

## Что нужно
1. **Dev build** (нативные модули недоступны в Expo Go):
   ```bash
   eas build --profile development --platform ios
   ```
   Добавить зависимость транспорта:
   - **OpenAI Realtime (WebRTC):** `react-native-webrtc` + config plugin.
   - **Gemini Live (WebSocket + PCM):** нативный аудио-стрим с микрофона.

2. **Бэкенд для эфемерных ключей** (НЕЛЬЗЯ светить настоящий ключ в приложении):
   - Маленький эндпоинт (Cloudflare Worker / Vercel function), который по запросу
     создаёт временную realtime-сессию у провайдера и отдаёт `client_secret`.
   - URL положить в `EXPO_PUBLIC_REALTIME_TOKEN_URL`, включить `EXPO_PUBLIC_REALTIME_ENABLED=1`.

3. **Реализовать транспорт** в `createRealtimeSession()` (`lib/realtime.ts`):
   - `start()`: получить ephemeral token → открыть WebRTC/WS → стримить микрофон,
     играть аудио-ответ, дёргать `onTranscript`/`onStatus`.
   - `stop()`: закрыть соединение, освободить микрофон.

4. **Включить в звонке** (`app/call.tsx`): если `REALTIME_ENABLED` — режим «Live» поверх
   текущего сценарного; иначе нынешний turn-based.

## Стоимость (ориентир)
- OpenAI Realtime: аудио вход/выход тарифицируется поминутно — заметно дороже текста.
  → Держать как **премиум-фичу** и/или с лимитом минут.

## Пока сделано (turn-based ускорение)
- `lib/ai.ts` → `chatStream()` (XHR SSE): ответ ИИ стримится по токенам.
- `app/chat.tsx` → помощник показывает ответ по мере генерации (быстрее «оживает»).
- Звонок: озвучка кэшируется (`lib/voice.ts`), один аудио-движок без наложений (`lib/audio.ts`).
