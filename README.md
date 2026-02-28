# Лжец

## Установка зависимостей

> Выполнить из корня проекта:

```bash
bun install
```

## Запуск без Docker

> 1. Поднять MongoDB:

```bash
docker compose up mongodb
```

> 2. Запустить приложение:

```bash
bun dev
```

Или запускать сервисы раздельно:

```bash
# backend
bun dev:backend

# frontend
bun dev:frontend
```

## Запуск в Docker (dev)

> Собрать сервисы:

```bash
docker compose build
```

> Запустить проект:

```bash
docker compose up
```

> Запустить в фоне:

```bash
docker compose up -d
```

> Остановить:

```bash
docker compose down
```

## При добавлении новой библиотеки

> Пересобрать образы без кэша:

```bash
docker compose build --no-cache
```

## Тесты

> Запуск тестов из корня проекта:

```bash
bun run test
```

Запускается `docker-compose.test.yml`, поднимаются только тестовые сервисы, после прохождения всё останавливается.

## Переменные окружения

Используемые env-файлы:

- `.env` - переменные среды разработки
- `.env.test` - переменные тестовой среды
- `.env.prod` - переменные production-среды

Чтобы получить `.env`, скопируй `.env.example` и подставь свои значения.

### Обязательные переменные

Строка подключения к БД:

`DB_CONN_STRING`

Название базы данных:

`DB_NAME`

Секрет для JWT:

`SECRET`

Токен Telegram-бота Mini App:

`TELEGRAM_BOT_TOKEN`

Время жизни JWT:

`JWT_EXPIRES_IN`

## Пример `.env`

```env
# MongoDB Configuration (для инициализации контейнера)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password
DB_NAME=liar

# Database Connection String
# Для Docker: используйте имя сервиса 'mongodb' вместо 'localhost'
DB_CONN_STRING=mongodb://admin:password@mongodb:27017/?authSource=admin

# JWT
SECRET=secret
JWT_EXPIRES_IN=1d

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_INITDATA_EXPIRES_IN=3600

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,*.trycloudflare.com

# Auth rate limit
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_RATE_LIMIT_MAX=30

# Game settings
SCORE_NOT_STATED=50
SCORE_TRICKED=100
GAME_STAGE_TIMER_MS=1000
HIDDEN_DURING_GAME_FIELDS=doLie,questionHistory,liarId,timerId
GAME_RESULTS_FIELDS=doLie,loserTask,winnerId,loserId

# Lobby code settings
LOBBY_CODE_ALPHABET=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
LOBBY_CODE_LENGTH=6

# Cloudflare Tunnel
# Используется для named tunnel (опционально, вручную)
CF_TUNNEL_TOKEN=
```

## Доступы в dev-режиме

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- MongoDB: `localhost:27017`
- Cloudflare Tunnel URL: смотри в логах сервиса `cloudflared`

## Cloudflare Tunnel для Telegram Mini App

Cloudflare Tunnel запускается автоматически вместе с `docker compose up`.

По умолчанию используется quick tunnel:
- сервис `cloudflared` выдаёт временный `https://...trycloudflare.com`
- этого достаточно для локальной разработки и Telegram Mini App тестов

Как получить URL в quick режиме:

```bash
docker compose logs -f cloudflared
```

В логах будет строка с публичным HTTPS URL. Используй его для Telegram Mini App.

Если нужен named tunnel (постоянный домен), запусти cloudflared отдельно с token:

```bash
cloudflared tunnel run --token <CF_TUNNEL_TOKEN>
```

## Production

```bash
# Сборка production образов
docker compose -f docker-compose.prod.yml build

# Запуск в фоне
docker compose -f docker-compose.prod.yml up -d

# Остановка
docker compose -f docker-compose.prod.yml down
```

Доступы:

- Frontend: `http://localhost` (или `http://localhost:80`)
- Backend API: `http://localhost:3000`
- MongoDB: `localhost:27017`

## Полезные команды

```bash
# Запуск конкретного сервиса
docker compose up mongodb
docker compose up backend
docker compose up frontend
docker compose up cloudflared

# Логи по сервисам
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
docker compose logs -f cloudflared

# Перезапуск сервиса
docker compose restart backend

# Полная очистка (контейнеры, volumes, образы)
docker compose down -v --rmi all
```

## Важно

1. Контейнеры общаются по именам сервисов внутри Docker-сети:
   - `backend:3000` вместо `localhost:3000`
   - `mongodb:27017` вместо `localhost:27017`
2. Данные MongoDB сохраняются в Docker volumes и переживают перезапуск контейнеров.
3. В dev-режиме hot-reload работает через volume mounts.
