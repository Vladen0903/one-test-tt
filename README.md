# TT-Manager - Project Management System

<div align="center">
  <img src="./frontend/public/technotraff-sign.jpg" alt="TechnoTraff" width="300">
  <h3>Продвинутая система управления проектами</h3>
  <p>По стилю Trello/Jira с брендингом TechnoTraff</p>
</div>

## ✨ Реализованные возможности (MVP)

- 🔐 **Аутентификация** - JWT токены, безопасное хранение паролей
- 👥 **Команды и проекты** - Роли (owner/admin/member/viewer)
- 📋 **Kanban доски** - Колонки с карточками, drag & drop (готово к интеграции)
- 📊 **Полная схема БД** - Эпики, спринты, релизы, зависимости, чек-листы
- 🎨 **Брендинг TechnoTraff** - Cyan (#15D8F5), темная тема, левый сайдбар
- 📝 **Задачи** - Приоритеты, метки, дедлайны, подзадачи
- 💬 **Комментарии и вложения** - Полная модель
- 📈 **Диаграмма Ганта** - Готова модель данных с зависимостями
- 🗓️ **Спринты и релизы** - Полная инфраструктура

## 🏗️ Технологический стек

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS 3.4
- @hello-pangea/dnd (drag-and-drop)
- Lucide React (иконки)

**Backend:**
- Next.js API Routes
- Prisma ORM
- SQLite (dev) / PostgreSQL (production)
- JWT аутентификация
- bcrypt для паролей

## 🚀 Быстрый старт

### Локальный запуск:

```bash
cd /app/frontend

# Установка зависимостей
yarn install

# Генерация Prisma Client
yarn prisma:generate

# Создание базы данных
yarn prisma:push

# Запуск в dev режиме
yarn dev
```

Приложение будет доступно на `http://localhost:3000`

### Первый вход:

**Вариант 1: Используйте готовый тестовый аккаунт**

```
Email: test@example.com
Password: test123
```

**Вариант 2: Зарегистрируйтесь**

1. Откройте `http://localhost:3000`
2. Нажмите кнопку "Register"
3. Заполните форму (минимум 6 символов в пароле)
4. Нажмите "Create Account"

**📖 Полная инструкция:** см. [LOGIN_INSTRUCTIONS.md](./LOGIN_INSTRUCTIONS.md)

## 📚 Полная документация

**[📖 DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Полное руководство по развертыванию:
- Локальная разработка
- Production на VPS
- Docker развертывание
- Настройка PostgreSQL, Nginx, SSL
- Безопасность и мониторинг
- Резервное копирование

## 🎯 Структура проекта

```
/app/frontend/
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # Аутентификация
│   │   ├── teams/        # Команды
│   │   ├── projects/     # Проекты
│   │   ├── boards/       # Доски
│   │   └── tasks/        # Задачи
│   ├── dashboard/        # Dashboard страница
│   ├── page.tsx          # Страница входа
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Глобальные стили
├── components/
│   ├── ui/               # UI компоненты (будущие)
│   ├── layout/           # Layout компоненты
│   ├── boards/           # Компоненты досок
│   └── tasks/            # Компоненты задач
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # JWT утилиты
│   └── utils.ts          # Общие утилиты
├── prisma/
│   ├── schema.prisma     # Схема базы данных
│   └── dev.db            # SQLite база (dev)
├── public/               # Статика (логотипы)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🗄️ API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Команды
- `GET /api/teams` - Список команд
- `POST /api/teams` - Создать команду

### Проекты
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создать проект

### Доски
- `GET /api/boards?projectId=...` - Доски проекта
- `POST /api/boards` - Создать доску

### Задачи (TODO)
- API endpoints для задач готовы к имплементации

## 📊 Схема базы данных

Полная схема в `prisma/schema.prisma`:

**Основные таблицы:**
- `users` - Пользователи
- `teams` - Команды
- `team_members` - Участники команд с ролями
- `projects` - Проекты с ключами
- `project_members` - Участники проектов
- `boards` - Канбан доски
- `columns` - Колонки досок
- `tasks` - Задачи (полная модель)
- `epics` - Эпики
- `sprints` - Спринты
- `releases` - Релизы
- `labels` - Метки
- `task_labels` - Связь задач и меток
- `checklists` - Чек-листы
- `checklist_items` - Элементы чек-листов
- `attachments` - Вложения
- `comments` - Комментарии
- `dependencies` - Зависимости задач (FS/SS/FF/SF)
- `activities` - Лог активности

## 🎨 UI/UX Брендинг

### Цветовая палитра TechnoTraff:

- **Primary (Cyan):** #15D8F5
- **Primary Hover:** #10BFD8
- **Background:** #111315
- **Surface/Card:** #16191C
- **Borders:** #24282C
- **Text Primary:** #FFFFFF
- **Text Secondary:** #9CA3AF

### Компоненты:

- Левый сайдбар (280px) с навигацией
- Темная тема по умолчанию
- Современные карточки и кнопки
- Логотипы TechnoTraff интегрированы

## 🔐 Безопасность

### Для production обязательно:

1. ✅ Изменить `JWT_SECRET` в `.env` или `lib/auth.ts`
2. ✅ Мигрировать на PostgreSQL
3. ✅ Настроить HTTPS с SSL
4. ✅ Ограничить CORS
5. ✅ Настроить rate limiting
6. ✅ Регулярные бэкапы БД

**Генерация нового JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚧 TODO (Следующие шаги)

### Высокий приоритет:
- [ ] Drag & Drop досок (@hello-pangea/dnd интеграция)
- [ ] API endpoints для задач (CRUD)
- [ ] Backlog и sprint view
- [ ] Task detail drawer/modal
- [ ] Диаграмма Ганта компонент

### Средний приоритет:
- [ ] Календарь релизов
- [ ] Поиск и фильтры
- [ ] Notifications
- [ ] Activity feed
- [ ] Webhooks

### Низкий приоритет:
- [ ] Экспорт (PDF/CSV)
- [ ] Mobile app
- [ ] Интеграции (Slack, etc)
- [ ] Advanced analytics

## 🛠️ Разработка

### Команды Prisma:

```bash
# Генерация клиента
yarn prisma:generate

# Применение изменений схемы
yarn prisma:push

# Открытие Prisma Studio
yarn prisma:studio

# Миграции (для production)
npx prisma migrate dev --name migration_name
```

### Build и Production:

```bash
# Production сборка
yarn build

# Запуск production
yarn start
```

## 📦 Развертывание на сервер

### Требования к серверу:

- Ubuntu 22.04 LTS
- 2+ CPU cores
- 4GB+ RAM
- Node.js 20+
- PostgreSQL 14+
- Nginx
- PM2

### Быстрый деплой:

См. полное руководство в **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

Краткая версия:

```bash
# 1. Клонировать проект
git clone <repo> /var/www/tt-manager
cd /var/www/tt-manager

# 2. Установить зависимости
yarn install

# 3. Настроить .env с DATABASE_URL и JWT_SECRET

# 4. Обновить prisma/schema.prisma на postgresql

# 5. Применить миграции
yarn prisma:push

# 6. Собрать
yarn build

# 7. Запустить с PM2
pm2 start npm --name tt-manager -- start
pm2 save
pm2 startup

# 8. Настроить Nginx reverse proxy на localhost:3000

# 9. Настроить SSL с certbot
```

## 📈 Масштабирование

- **PM2 Cluster Mode:** `pm2 start -i max`
- **PostgreSQL:** Connection pooling, репликация
- **Redis:** Для сессий и кэша
- **CDN:** Для статики
- **Load Balancer:** Nginx/HAProxy

## 🐛 Решение проблем

### База данных не создается:
```bash
yarn prisma:generate
yarn prisma:push --force-reset
```

### Ошибки TypeScript:
```bash
rm -rf node_modules .next
yarn install
yarn dev
```

### Проблемы с портами:
```bash
# Убить процесс на порту 3000
fuser -k 3000/tcp
```

## 📝 Лицензия

Проект создан для TechnoTraff.

## 🤝 Контакты

- Website: https://technotraff.com
- Email: support@technotraff.com

---

**Made with ❤️ by TechnoTraff team**

**Tech Stack:** Next.js 14, React 18, TypeScript, Prisma, PostgreSQL, Tailwind CSS
