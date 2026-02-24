# liar

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Запуск проекта с помощью Docker

### Требования

- Docker
- Docker Compose

### Настройка переменных окружения

Перед запуском создайте файл `.env` в корне проекта со следующим содержимым:

```env
# MongoDB Configuration (для инициализации контейнера)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password
DB_NAME=liar

# Database Connection String
# Для Docker: используйте имя сервиса 'mongodb' вместо 'localhost'
DB_CONN_STRING=mongodb://admin:password@mongodb:27017/?authSource=admin

# JWT Secret Key
SECRET=secret

# Ngrok
# Получите токен на https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_AUTHTOKEN=
```

### Режим разработки (Dev)

Запуск с hot-reload (изменения применяются автоматически):

```bash
# Запуск всех сервисов
docker compose up --build

# Или в фоновом режиме
docker compose up -d

# Просмотр логов
docker compose logs -f

# Остановка
docker compose down
```

**Доступ:**

- **Frontend (веб-интерфейс)**: http://localhost:5173 — откройте в браузере (Vite dev server с hot-reload)
- **Backend API**: http://localhost:3000 — REST API для разработки
- **MongoDB**: localhost:27017 — подключение к базе данных
- **Ngrok Web UI**: http://localhost:4040 — веб-интерфейс для управления туннелями (если настроен NGROK_AUTHTOKEN)

**Ngrok для Telegram Mini Apps:**

Если вы настроили `NGROK_AUTHTOKEN` в `.env`, ngrok автоматически создаст HTTPS туннель к frontend.

1. После запуска `docker compose up`, откройте http://localhost:4040
2. Скопируйте HTTPS URL (например, `https://abc123.ngrok-free.app`)
3. Используйте этот URL для настройки Telegram Mini App

**ВАЖНО:** Без `NGROK_AUTHTOKEN` ngrok будет работать в ограниченном режиме (сессии по 2 часа).

### Production режим

```bash
# Сборка production образов
docker compose -f docker-compose.prod.yml build

# Запуск в фоновом режиме
docker compose -f docker-compose.prod.yml up -d

# Остановка
docker compose -f docker-compose.prod.yml down
```

**Доступ:**

- **Frontend (веб-интерфейс)**: http://localhost или http://localhost:80 — откройте в браузере для доступа к приложению
- **Backend API**: http://localhost:3000 — REST API для разработки
- **MongoDB**: localhost:27017 — подключение к базе данных

### Полезные команды

```bash
# Пересборка с очисткой кэша
docker compose build --no-cache

# Запуск конкретного сервиса
docker compose up mongodb
docker compose up backend
docker compose up frontend

# Просмотр логов конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# Перезапуск сервиса
docker compose restart backend

# Полная очистка (удалит все контейнеры, volumes и образы)
docker compose down -v --rmi all
```

### Может быть будет полезным :)

1. **Сеть Docker**: Контейнеры работают в сети `tma-liar-network-dev` (dev) или `tma-liar-network` (prod). Для обращения между сервисами используйте имена сервисов:
   - `backend:3000` вместо `localhost:3000`
   - `mongodb:27017` вместо `localhost:27017`

2. **Volumes**: Данные MongoDB сохраняются в Docker volumes и не удаляются при перезапуске контейнеров.

3. **Hot-reload**: В dev режиме изменения в коде применяются автоматически благодаря volume mounts.
