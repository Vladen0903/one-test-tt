# 🚀 Быстрая инструкция: Скачать и запустить TT-Manager

## Метод 1: Скачать готовый архив (Рекомендуется)

### На сервере создан архив проекта:

```bash
# Скачать архив (88KB)
scp user@your-server:/app/tt-manager-complete.tar.gz .

# Распаковать
tar -xzf tt-manager-complete.tar.gz

# Перейти в папку
cd frontend

# Установить и запустить
yarn install && yarn prisma:push && yarn dev
```

Откройте: `http://localhost:3000`

---

## Метод 2: Скачать папку напрямую

```bash
# Скачать весь проект
scp -r user@your-server:/app/frontend ./tt-manager

# Перейти и запустить
cd tt-manager
yarn install && yarn prisma:push && yarn dev
```

---

## Метод 3: Использовать rsync (быстрее)

```bash
# Синхронизировать с сервером
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  user@your-server:/app/frontend/ ./tt-manager/

# Запустить
cd tt-manager
yarn install && yarn prisma:push && yarn dev
```

---

## ⚡ Минимальная команда (3 строки)

```bash
scp -r user@server:/app/frontend ~/tt-manager && \
cd ~/tt-manager && \
yarn install && yarn prisma:push && yarn dev
```

---

## 📋 Что нужно на вашей машине:

- **Node.js 18+** - [скачать](https://nodejs.org)
- **Yarn** - `npm install -g yarn`

### Проверка:

```bash
node --version  # >= 18.0.0
yarn --version  # >= 1.22.0
```

---

## 🔑 Первый вход после запуска:

**Тестовый аккаунт:**
```
Email: test@example.com
Password: test123
```

**Или создайте нового:**
1. Нажмите "Register"
2. Заполните форму
3. Войдите

---

## 📚 Полная документация:

После скачивания откройте:
- **LOCAL_SETUP_GUIDE.md** - полная инструкция
- **README.md** - описание проекта
- **LOGIN_INSTRUCTIONS.md** - инструкции по входу
- **DEPLOYMENT_GUIDE.md** - развертывание на production

---

## 🐛 Проблемы?

**Порт 3000 занят:**
```bash
PORT=3001 yarn dev
```

**Ошибка Prisma:**
```bash
yarn prisma:generate
yarn install
```

**Не находит модули:**
```bash
rm -rf node_modules
yarn install
```

---

## 📦 Содержимое архива tt-manager-complete.tar.gz:

```
tt-manager-complete.tar.gz (88KB)
├── frontend/              # Весь проект Next.js
│   ├── app/              # Страницы и API
│   ├── lib/              # Утилиты
│   ├── prisma/           # База данных
│   ├── public/           # Логотипы
│   └── package.json      # Зависимости
├── README.md             # Описание проекта
├── DEPLOYMENT_GUIDE.md   # Полное руководство
├── LOGIN_INSTRUCTIONS.md # Инструкции по входу
├── PREVIEW_URL_FIX.md    # Решение проблем
└── LOCAL_SETUP_GUIDE.md  # Локальная установка
```

---

## ✅ Быстрая проверка работы:

```bash
# После yarn dev откройте:
curl http://localhost:3000

# Должен вернуть HTML страницу входа
```

---

**Готово! Проект готов к скачиванию и локальному запуску!** 🎉

**Полная инструкция:** `LOCAL_SETUP_GUIDE.md`
