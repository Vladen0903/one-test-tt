# TaskFlow - Project Management System

<div align="center">
  <h3>Полнофункциональный аналог Trello</h3>
  <p>Современная система управления проектами и задачами</p>
</div>

## ✨ Основные возможности

- 🔐 **Аутентификация пользователей** - JWT токены, роли (admin/user)
- 📋 **Доски проектов** - создание, редактирование, удаление
- 📝 **Списки и карточки** - организация задач в удобном формате
- 🎯 **Drag & Drop** - перемещение карточек между списками
- 📊 **Диаграмма Ганта** - визуализация задач с дедлайнами
- 👥 **Управление пользователями** - админ-панель для администраторов
- 🎨 **Современный UI** - React + Tailwind CSS + shadcn/ui
- ⚡ **Быстрый API** - FastAPI + MongoDB

## 🏗️ Технологический стек

**Backend:**
- FastAPI (Python)
- MongoDB (база данных)
- JWT аутентификация
- Pydantic для валидации

**Frontend:**
- React 19
- Tailwind CSS
- shadcn/ui компоненты
- @hello-pangea/dnd (drag-and-drop)
- Recharts (диаграмма Ганта)

## 🚀 Быстрый старт (Development)

### Запуск в текущей среде

Приложение уже запущено и доступно по адресу:
```
https://team-planner-30.preview.emergentagent.com
```

### Первый вход

1. Откройте приложение в браузере
2. Зарегистрируйте первого пользователя (он станет админом)
3. Начните создавать доски и задачи!

## 📚 Документация

Подробные инструкции по развертыванию на production сервере смотрите в файле:
**[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)**

## 🎯 Использование

### Создание доски
1. После входа нажмите "Create Board"
2. Введите название и описание
3. Доска готова к использованию!

### Работа с задачами
1. Добавьте списки (например: "To Do", "In Progress", "Done")
2. Создавайте карточки в списках
3. Перетаскивайте карточки между списками
4. Добавляйте дедлайны для отображения в диаграмме Ганта

### Диаграмма Ганта
- Нажмите "Show Gantt Chart" на странице доски
- Визуализация автоматически покажет все задачи с дедлайнами
- Цветовая индикация: 🟦 On Track | 🟨 Due Soon | 🟥 Overdue

### Админ-панель
Только для администраторов:
- Просмотр всех пользователей
- Удаление пользователей
- Управление доступом

## 🔒 Безопасность

**Для production развертывания обязательно:**

1. ✅ Измените `SECRET_KEY` в `/app/backend/server.py`
2. ✅ Настройте правильные CORS_ORIGINS
3. ✅ Используйте HTTPS (SSL сертификат)
4. ✅ Настройте MongoDB с аутентификацией
5. ✅ Регулярно делайте резервные копии

## 📁 Структура проекта

```
/app/
├── backend/
│   ├── server.py              # FastAPI приложение
│   ├── requirements.txt       # Python зависимости
│   └── .env                   # Переменные окружения
├── frontend/
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   │   ├── Auth.jsx       # Аутентификация
│   │   │   ├── Dashboard.jsx  # Главная страница
│   │   │   ├── Board.jsx      # Доска проекта
│   │   │   ├── AdminPanel.jsx # Админ-панель
│   │   │   └── GanttChart.jsx # Диаграмма Ганта
│   │   ├── App.js             # Главный компонент
│   │   └── App.css            # Стили
│   ├── package.json           # Node зависимости
│   └── .env                   # Переменные окружения
└── DEPLOYMENT_INSTRUCTIONS.md # Инструкции по развертыванию
```

## 🗄️ API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Доски
- `GET /api/boards` - Список досок
- `POST /api/boards` - Создать доску
- `GET /api/boards/{id}` - Получить доску
- `PUT /api/boards/{id}` - Обновить доску
- `DELETE /api/boards/{id}` - Удалить доску

### Списки
- `GET /api/boards/{id}/lists` - Списки доски
- `POST /api/lists` - Создать список
- `PUT /api/lists/{id}` - Обновить список
- `DELETE /api/lists/{id}` - Удалить список

### Карточки
- `GET /api/lists/{id}/cards` - Карточки списка
- `GET /api/boards/{id}/cards` - Все карточки доски
- `POST /api/cards` - Создать карточку
- `PUT /api/cards/{id}` - Обновить карточку
- `DELETE /api/cards/{id}` - Удалить карточку

### Администрирование
- `GET /api/users` - Список пользователей (admin)
- `DELETE /api/users/{id}` - Удалить пользователя (admin)

## 🛠️ Разработка

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --reload
```

### Frontend
```bash
cd /app/frontend
yarn install
yarn start
```

## 📝 Что нужно добавить для production

1. **Безопасность:**
   - Изменить SECRET_KEY в server.py
   - Настроить правильные CORS_ORIGINS
   - Добавить rate limiting
   - Настроить MongoDB аутентификацию

2. **Инфраструктура:**
   - Настроить Nginx reverse proxy
   - Добавить SSL сертификат (Let's Encrypt)
   - Настроить supervisor/systemd для автозапуска
   - Настроить логирование и мониторинг

3. **База данных:**
   - Включить MongoDB аутентификацию
   - Настроить регулярные бэкапы
   - Оптимизировать индексы

Подробнее см. [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)

---

**Сделано с ❤️ используя FastAPI, React и MongoDB**
