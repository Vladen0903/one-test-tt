# 📦 Скачивание и локальный запуск TT-Manager

## 🎯 Быстрый старт (3 команды)

```bash
# 1. Скачать проект
scp -r user@server:/app/frontend ./tt-manager

# 2. Установить зависимости
cd tt-manager && yarn install && yarn prisma:push

# 3. Запустить
yarn dev
```

Откройте: `http://localhost:3000`

---

## 📋 Требования

### Необходимое ПО:

- **Node.js** 18+ (рекомендуется 20+)
- **Yarn** 1.22+
- **Git** (опционально)

### Проверка версий:

```bash
node --version    # должно быть >= 18.0.0
yarn --version    # должно быть >= 1.22.0
```

### Установка Node.js и Yarn:

**macOS:**
```bash
brew install node yarn
```

**Windows:**
```bash
# Скачайте с nodejs.org
# Затем: npm install -g yarn
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn
```

---

## 📥 Способы скачивания проекта

### Способ 1: SCP (Secure Copy)

**Скачать весь проект:**
```bash
scp -r user@your-server:/app/frontend ~/tt-manager
```

**Или через определенный порт:**
```bash
scp -P 2222 -r user@your-server:/app/frontend ~/tt-manager
```

### Способ 2: rsync (лучше для больших файлов)

```bash
rsync -avz --progress user@your-server:/app/frontend/ ~/tt-manager/
```

### Способ 3: Git (если проект в репозитории)

```bash
git clone https://github.com/your-username/tt-manager.git
cd tt-manager
```

### Способ 4: Создать архив на сервере

**На сервере:**
```bash
cd /app
tar -czf tt-manager.tar.gz frontend/
```

**На локальной машине:**
```bash
scp user@your-server:/app/tt-manager.tar.gz .
tar -xzf tt-manager.tar.gz
mv frontend tt-manager
```

---

## 🚀 Установка и запуск

### Шаг 1: Перейти в папку проекта

```bash
cd tt-manager  # или frontend
```

### Шаг 2: Установить зависимости

```bash
yarn install
```

Это установит все необходимые пакеты из `package.json`.

### Шаг 3: Настроить Prisma

```bash
# Генерация Prisma Client
yarn prisma:generate

# Создание базы данных SQLite
yarn prisma:push
```

База данных будет создана в `prisma/dev.db`.

### Шаг 4: Запустить приложение

```bash
yarn dev
```

Приложение запустится на `http://localhost:3000`.

### Шаг 5: Открыть в браузере

```
http://localhost:3000
```

---

## 🔑 Первый вход

### Вариант 1: Использовать существующую БД

Если вы скачали файл `prisma/dev.db` с сервера, используйте тестовые аккаунты:

```
Email: test@example.com
Password: test123
```

### Вариант 2: Создать нового пользователя

1. Откройте `http://localhost:3000`
2. Нажмите **"Register"**
3. Заполните форму:
   - Name: Ваше имя
   - Email: Ваш email
   - Password: Минимум 6 символов
4. Нажмите **"Create Account"**

---

## 📁 Структура скачанного проекта

```
tt-manager/
├── app/                      # Next.js приложение
│   ├── api/                 # API Routes
│   │   ├── auth/           # Аутентификация
│   │   ├── teams/          # Команды
│   │   ├── projects/       # Проекты
│   │   └── boards/         # Доски
│   ├── dashboard/          # Dashboard страница
│   ├── page.tsx            # Страница входа
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Глобальные стили
├── components/             # React компоненты (будущие)
├── lib/                    # Утилиты
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # JWT функции
│   └── utils.ts           # Общие утилиты
├── prisma/                # База данных
│   ├── schema.prisma      # Схема БД
│   └── dev.db            # SQLite база (если скачали)
├── public/                # Статические файлы
│   ├── technotraff-logo.jpg
│   └── technotraff-sign.jpg
├── node_modules/          # Зависимости (создастся после yarn install)
├── .next/                 # Build файлы (создастся после yarn dev)
├── package.json           # Зависимости проекта
├── tsconfig.json          # TypeScript конфигурация
├── tailwind.config.ts     # Tailwind конфигурация
├── next.config.js         # Next.js конфигурация
└── postcss.config.js      # PostCSS конфигурация
```

---

## 🔧 Скрипты package.json

```bash
# Development сервер
yarn dev

# Production сборка
yarn build

# Запуск production
yarn start

# Линтер
yarn lint

# Prisma команды
yarn prisma:generate  # Генерация Prisma Client
yarn prisma:push      # Применение схемы к БД
yarn prisma:studio    # Открыть GUI для БД
```

---

## 🗄️ Работа с базой данных

### Просмотр данных (Prisma Studio)

```bash
yarn prisma:studio
```

Откроется GUI на `http://localhost:5555` где вы можете:
- Просматривать все таблицы
- Редактировать данные
- Добавлять записи
- Удалять данные

### Сброс базы данных

```bash
rm prisma/dev.db
yarn prisma:push
```

Создастся новая пустая база данных.

### Экспорт данных

```bash
# Создать резервную копию
cp prisma/dev.db prisma/backup.db

# Или экспорт в SQL
sqlite3 prisma/dev.db .dump > backup.sql
```

### Импорт данных

```bash
# Восстановить из резервной копии
cp prisma/backup.db prisma/dev.db

# Или импорт из SQL
sqlite3 prisma/dev.db < backup.sql
```

---

## 🔐 Настройка (опционально)

### Изменить JWT Secret

Откройте `lib/auth.ts` и измените:

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-new-secret-key'
```

Или создайте `.env.local`:

```env
JWT_SECRET=your-super-secret-key-here
```

### Изменить порт

```bash
# В командной строке
PORT=3001 yarn dev

# Или в package.json
"dev": "next dev -p 3001"
```

### Добавить переменные окружения

Создайте `.env.local`:

```env
# Database (для PostgreSQL в будущем)
DATABASE_URL="postgresql://user:password@localhost:5432/ttmanager"

# JWT Secret
JWT_SECRET="your-secret-key-min-32-chars"

# Node Environment
NODE_ENV="development"
```

---

## 🐛 Решение проблем

### Ошибка: "Cannot find module '@prisma/client'"

```bash
yarn prisma:generate
yarn install
```

### Ошибка: "Port 3000 already in use"

```bash
# Убить процесс на порту 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Или запустить на другом порту:
PORT=3001 yarn dev
```

### Ошибка: "ENOENT: no such file or directory"

```bash
# Убедитесь что вы в правильной директории
ls -la  # должны видеть package.json

# Переустановите зависимости
rm -rf node_modules
yarn install
```

### Ошибка: "prisma command not found"

```bash
# Установите prisma глобально (опционально)
npm install -g prisma

# Или используйте через npx
npx prisma generate
npx prisma studio
```

### Проблемы с TypeScript

```bash
# Очистите кеш
rm -rf .next
yarn dev
```

### База данных не создается

```bash
# Удалите старую БД и создайте новую
rm -f prisma/dev.db
yarn prisma:push --force-reset
```

---

## 📦 Альтернатива: Docker

Если хотите запустить в Docker:

**Создайте Dockerfile:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn prisma:generate

EXPOSE 3000

CMD ["yarn", "dev"]
```

**Запуск:**

```bash
docker build -t tt-manager .
docker run -p 3000:3000 tt-manager
```

---

## 🚀 Production сборка

Для production используйте:

```bash
# Сборка
yarn build

# Запуск
yarn start
```

Production сервер будет более оптимизированным и быстрым.

---

## 📊 Статистика проекта

```bash
# Посчитать строки кода
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Размер проекта (без node_modules)
du -sh --exclude=node_modules .

# Количество зависимостей
cat package.json | grep "dependencies" -A 100 | grep ":" | wc -l
```

---

## 🔄 Обновление проекта

Если проект обновился на сервере:

```bash
# Скачать только измененные файлы
rsync -avz --progress user@server:/app/frontend/ ~/tt-manager/

# Обновить зависимости
yarn install

# Применить изменения БД
yarn prisma:generate
yarn prisma:push
```

---

## 📱 Доступ с других устройств

Чтобы открыть приложение на телефоне/планшете в той же сети:

```bash
# Запустить с доступом из сети
yarn dev --hostname 0.0.0.0

# Узнать свой IP
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# Открыть на другом устройстве:
# http://your-ip:3000
```

---

## ✅ Проверка установки

После установки выполните:

```bash
# 1. Проверить Node.js
node --version

# 2. Проверить Yarn
yarn --version

# 3. Проверить зависимости
yarn list --depth=0

# 4. Проверить Prisma
yarn prisma --version

# 5. Запустить приложение
yarn dev
```

Откройте `http://localhost:3000` - должна появиться страница входа с логотипом TechnoTraff.

---

## 🎓 Дополнительные команды

```bash
# Открыть VS Code
code .

# Найти TODO в коде
grep -r "TODO" --include="*.ts" --include="*.tsx"

# Проверить размер сборки
yarn build
du -sh .next

# Анализ зависимостей
yarn list --pattern "react"

# Очистка всего
rm -rf node_modules .next prisma/dev.db
yarn install
yarn prisma:push
```

---

## 📚 Полезные ссылки

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

---

## 🆘 Нужна помощь?

1. Проверьте логи в консоли
2. Откройте браузер Console (F12)
3. Проверьте файлы документации:
   - `README.md`
   - `LOGIN_INSTRUCTIONS.md`
   - `DEPLOYMENT_GUIDE.md`

---

**Готово! Проект должен работать локально на вашей машине! 🎉**
