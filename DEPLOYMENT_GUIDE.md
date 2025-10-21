# TT-Manager - Полная документация по развертыванию

## 📋 Обзор проекта

TT-Manager - это продвинутая система управления проектами (аналог Trello/Jira) с брендингом TechnoTraff.

### Реализованные функции (MVP):

✅ **Аутентификация и пользователи**
- Регистрация и вход с JWT токенами
- Профили пользователей с аватарами и должностями
- Безопасное хранение паролей (bcrypt)

✅ **Команды и проекты**
- Создание команд с участниками
- Роли: owner, admin, member, viewer
- Проекты с уникальными ключами (например, TT)
- Множественные доски внутри проектов

✅ **Kanban доски**
- Колонки: To Do, In Progress, Review, Done
- Drag & Drop карточек (готова инфраструктура)
- Счетчики задач

✅ **Задачи**
- Полная модель задач с эпиками, спринтами, релизами
- Подзадачи и зависимости
- Приоритеты, метки, дедлайны
- Чек-листы и вложения
- Комментарии

✅ **База данных**
- SQLite (локально) с полной схемой
- Легкая миграция на PostgreSQL
- Prisma ORM для type-safety

✅ **UI/UX**
- Брендинг TechnoTraff (#15D8F5 cyan)
- Темная тема
- Левый сайдбар с навигацией
- Адаптивный дизайн

---

## 🏗️ Архитектура

### Стек технологий:

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS 3.4
- @hello-pangea/dnd (drag-and-drop)

**Backend:**
- Next.js API Routes
- Prisma ORM
- SQLite (dev) / PostgreSQL (production)

**Аутентификация:**
- JWT tokens
- bcrypt для паролей

---

## 🚀 Локальный запуск

### Требования:

- Node.js 18+ (рекомендуется 20+)
- Yarn 1.22+
- 2GB RAM минимум

### Шаги установки:

1. **Клонирование проекта:**
```bash
cd /app/frontend
```

2. **Установка зависимостей:**
```bash
yarn install
```

3. **Генерация Prisma Client:**
```bash
yarn prisma:generate
```

4. **Создание базы данных:**
```bash
yarn prisma:push
```

5. **Запуск в development режиме:**
```bash
yarn dev
```

Приложение будет доступно на `http://localhost:3000`

---

## 📦 Production развертывание

### Вариант 1: VPS/Dedicated Server (Рекомендуется)

**Требования к серверу:**
- Ubuntu 22.04 LTS или новее
- 2 CPU cores минимум
- 4GB RAM минимум (8GB рекомендуется)
- 20GB SSD
- Nginx
- Node.js 20+
- PostgreSQL 14+
- PM2 для процесс-менеджмента

### Пошаговая установка на сервер:

#### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка Yarn
npm install -g yarn

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx
sudo apt install -y nginx

# Установка PM2
npm install -g pm2
```

#### 2. Настройка PostgreSQL

```bash
# Вход в PostgreSQL
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE ttmanager;
CREATE USER ttmanager_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE ttmanager TO ttmanager_user;
\q
```

#### 3. Загрузка приложения на сервер

```bash
# Создание директории
mkdir -p /var/www/tt-manager
cd /var/www/tt-manager

# Копирование файлов (через git, scp или rsync)
# Пример с git:
git clone <your-repo-url> .

# Или через scp с локальной машины:
# scp -r /app/frontend/* user@your-server:/var/www/tt-manager/
```

#### 4. Настройка переменных окружения

```bash
# Создание .env файла
cat > /var/www/tt-manager/.env << 'EOF'
# Database
DATABASE_URL="postgresql://ttmanager_user:your_secure_password_here@localhost:5432/ttmanager"

# JWT Secret (сгенерируйте новый!)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-change-this"

# Node Environment
NODE_ENV="production"
EOF

# Установка прав доступа
chmod 600 /var/www/tt-manager/.env
```

**ВАЖНО:** Сгенерируйте новый JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 5. Обновление Prisma схемы для PostgreSQL

Отредактируйте `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Изменить с sqlite
  url      = env("DATABASE_URL")
}
```

#### 6. Установка и сборка

```bash
cd /var/www/tt-manager

# Установка зависимостей
yarn install --production=false

# Генерация Prisma Client
yarn prisma:generate

# Применение миграций
yarn prisma:push

# Production сборка
yarn build
```

#### 7. Настройка PM2

```bash
# Создание PM2 конфигурации
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tt-manager',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/tt-manager',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
EOF

# Запуск приложения
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Автозапуск при перезагрузке
pm2 startup
# Выполните команду, которую PM2 выведет
```

#### 8. Настройка Nginx

```bash
# Создание конфигурации Nginx
sudo nano /etc/nginx/sites-available/tt-manager
```

Содержимое файла:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Перенаправление на HTTPS (после установки SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files
    location /_next/static {
        alias /var/www/tt-manager/.next/static;
        expires 365d;
        access_log off;
    }

    location /public {
        alias /var/www/tt-manager/public;
        expires 365d;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Активация конфигурации:

```bash
# Создание симлинка
sudo ln -s /etc/nginx/sites-available/tt-manager /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

#### 9. Настройка SSL с Let's Encrypt

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автообновление сертификата
sudo certbot renew --dry-run
```

#### 10. Настройка Firewall

```bash
# UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

### Вариант 2: Docker (Альтернатива)

#### Создание Dockerfile:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn prisma:generate
RUN yarn build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["yarn", "start"]
```

#### docker-compose.yml:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ttmanager
      POSTGRES_USER: ttmanager_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://ttmanager_user:your_secure_password@postgres:5432/ttmanager
      JWT_SECRET: your-super-secret-jwt-key
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Запуск:

```bash
docker-compose up -d
```

---

### Вариант 3: Vercel (Для прототипа)

1. Установите Vercel CLI:
```bash
npm install -g vercel
```

2. Войдите в Vercel:
```bash
vercel login
```

3. Настройте PostgreSQL на Vercel Postgres или Supabase

4. Деплой:
```bash
vercel --prod
```

5. Настройте переменные окружения в Vercel Dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`

---

## 🔧 Настройка и конфигурация

### Изменение JWT Secret

**КРИТИЧЕСКИ ВАЖНО для production!**

```bash
# Генерация нового секрета
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Обновите JWT_SECRET в .env или lib/auth.ts
```

### Настройка логов

Для production логирования используйте PM2:

```bash
# Просмотр логов
pm2 logs tt-manager

# Ротация логов
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Резервное копирование базы данных

```bash
# Создание бэкапа PostgreSQL
pg_dump -U ttmanager_user -h localhost ttmanager > backup_$(date +%Y%m%d_%H%M%S).sql

# Автоматизация через cron
crontab -e
# Добавить:
0 2 * * * pg_dump -U ttmanager_user -h localhost ttmanager > /backups/ttmanager_$(date +\%Y\%m\%d).sql
```

### Мониторинг

```bash
# PM2 мониторинг
pm2 monit

# Установка PM2 Web Dashboard
pm2 install pm2-server-monit
```

---

## 📊 База данных

### Схема базы данных

Полная схема находится в `prisma/schema.prisma`. Основные таблицы:

- **users** - пользователи
- **teams** - команды
- **team_members** - участники команд
- **projects** - проекты
- **project_members** - участники проектов
- **boards** - канбан доски
- **columns** - колонки досок
- **tasks** - задачи
- **epics** - эпики
- **sprints** - спринты
- **releases** - релизы
- **labels** - метки
- **checklists** - чек-листы
- **comments** - комментарии
- **dependencies** - зависимости задач
- **activities** - активность

### Команды Prisma:

```bash
# Генерация клиента
yarn prisma:generate

# Применение изменений схемы
yarn prisma:push

# Открытие Prisma Studio (GUI для БД)
yarn prisma:studio

# Создание миграций (для production)
npx prisma migrate dev --name init
```

---

## 🔐 Безопасность

### Checklist для production:

- [ ] Изменен JWT_SECRET на случайный
- [ ] Настроен HTTPS с валидным SSL сертификатом
- [ ] Настроен firewall (только порты 22, 80, 443)
- [ ] PostgreSQL доступен только локально
- [ ] Используются сильные пароли для БД
- [ ] Настроено резервное копирование
- [ ] Настроен мониторинг и алерты
- [ ] Логи ротируются и архивируются
- [ ] Установлены обновления безопасности

### Рекомендации:

1. **Rate limiting:** Добавьте rate limiting на уровне Nginx или в API
2. **CORS:** Ограничьте CORS только для вашего домена
3. **CSP Headers:** Настройте Content Security Policy
4. **Регулярные обновления:** Обновляйте зависимости
5. **Мониторинг:** Используйте Sentry или LogRocket

---

## 🎨 Кастомизация

### Изменение брендинга:

1. Замените логотипы в `public/`:
   - `technotraff-logo.jpg`
   - `technotraff-sign.jpg`

2. Измените цвета в `tailwind.config.ts`:
```typescript
primary: {
  DEFAULT: '#15D8F5',  // Ваш основной цвет
  hover: '#10BFD8',
}
```

3. Измените название в `app/layout.tsx`

---

## 📈 Масштабирование

### Горизонтальное масштабирование:

1. **PM2 Cluster Mode:**
```bash
pm2 start ecosystem.config.js -i max
```

2. **Load Balancer:** Используйте Nginx или HAProxy

3. **Database:** 
   - PostgreSQL репликация
   - Connection pooling (PgBouncer)

4. **Redis:** Для сессий и кеширования

---

## 🐛 Решение проблем

### Приложение не запускается

```bash
# Проверка логов
pm2 logs tt-manager --lines 100

# Проверка порта
sudo netstat -tulpn | grep 3000

# Перезапуск
pm2 restart tt-manager
```

### Ошибки базы данных

```bash
# Проверка подключения к PostgreSQL
psql -U ttmanager_user -h localhost -d ttmanager

# Пересоздание схемы
yarn prisma:push --force-reset
```

### Проблемы с производительностью

```bash
# Мониторинг CPU/RAM
htop

# Мониторинг PostgreSQL
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Увеличение instances PM2
pm2 scale tt-manager +2
```

---

## 📚 Дополнительные ресурсы

- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- PM2 Documentation: https://pm2.keymetrics.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs

---

## 📝 Лицензия и поддержка

Проект создан для TechnoTraff.

**Контакты для поддержки:**
- Email: support@example.com
- Документация: /docs
- Issues: GitHub Issues

---

## 🚀 Следующие шаги (будущие обновления)

Приоритетные функции для добавления:

1. **Drag & Drop досок** - Завершить интеграцию @hello-pangea/dnd
2. **Диаграмма Ганта** - Визуализация задач и зависимостей
3. **Спринты и бэклог** - Полноценный backlog view
4. **Календарь релизов** - Timeline view для релизов
5. **Уведомления** - Real-time notifications
6. **Поиск** - Полнотекстовый поиск
7. **Экспорт** - PDF/CSV экспорт
8. **Webhooks** - Интеграции с другими сервисами
9. **API документация** - Swagger/OpenAPI
10. **Мобильное приложение** - React Native версия

---

**Готово к использованию! 🎉**
