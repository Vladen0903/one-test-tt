# TaskFlow - Инструкции по развертыванию

## 📋 Описание проекта

TaskFlow - это полнофункциональный аналог Trello с возможностью:
- Регистрации и авторизации пользователей
- Создания досок (Boards) с списками (Lists) и карточками (Cards)
- Drag-and-drop перемещения карточек между списками
- Диаграммы Ганта для визуализации задач с дедлайнами
- Админ-панели для управления пользователями
- Назначения участников на доски

## 🏗️ Архитектура

**Backend:** FastAPI + MongoDB  
**Frontend:** React + Tailwind CSS + shadcn/ui  
**Аутентификация:** JWT токены  
**База данных:** MongoDB

## 🚀 Развертывание на сервере

### 1. Требования к системе

- Python 3.11+
- Node.js 16+ и Yarn
- MongoDB 4.4+
- Nginx (опционально, для production)

### 2. Установка зависимостей

#### Backend:
```bash
cd /app/backend
pip install -r requirements.txt
```

#### Frontend:
```bash
cd /app/frontend
yarn install
```

### 3. Настройка окружения

#### Backend (.env):
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="taskflow_production"
CORS_ORIGINS="https://yourdomain.com"
```

⚠️ **ВАЖНО:** Измените `SECRET_KEY` в `/app/backend/server.py` (строка 21):
```python
SECRET_KEY = "your-secure-random-key-here-change-in-production"
```

Для генерации ключа используйте:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Frontend (.env):
```bash
REACT_APP_BACKEND_URL=https://yourdomain.com
```

### 4. Запуск MongoDB

Убедитесь, что MongoDB запущен:
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

Проверьте статус:
```bash
sudo systemctl status mongod
```

### 5. Production сборка Frontend

```bash
cd /app/frontend
yarn build
```

Это создаст оптимизированную сборку в папке `/app/frontend/build`

### 6. Запуск Backend в Production

Используйте процесс-менеджер, например, supervisor или systemd:

**С помощью supervisor:**
```bash
sudo apt-get install supervisor

# Создайте конфигурацию
sudo nano /etc/supervisor/conf.d/taskflow-backend.conf
```

Содержимое файла:
```ini
[program:taskflow-backend]
command=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/taskflow-backend.err.log
stdout_logfile=/var/log/taskflow-backend.out.log
```

Запустите:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start taskflow-backend
```

### 7. Настройка Nginx (для production)

```bash
sudo nano /etc/nginx/sites-available/taskflow
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /app/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL сертификат (рекомендуется)

Установите Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 👥 Использование

### Первый запуск

1. Откройте приложение в браузере
2. Зарегистрируйте первого пользователя - он автоматически получит права администратора
3. Первый пользователь сможет управлять другими пользователями через Админ-панель

### Роли пользователей

- **Admin:** Может удалять пользователей, управлять всеми досками
- **User:** Может создавать и управлять своими досками

### Основной функционал

1. **Доски (Boards):** Создавайте доски для разных проектов
2. **Списки (Lists):** Внутри досок создавайте списки (например: "To Do", "In Progress", "Done")
3. **Карточки (Cards):** Добавляйте задачи в списки
4. **Drag & Drop:** Перетаскивайте карточки между списками
5. **Диаграмма Ганта:** Визуализируйте задачи с дедлайнами

## 🔒 Безопасность

### Обязательные шаги для production:

1. ✅ Измените `SECRET_KEY` в backend
2. ✅ Настройте правильные CORS_ORIGINS
3. ✅ Используйте SSL сертификат (HTTPS)
4. ✅ Настройте firewall
5. ✅ Регулярно обновляйте зависимости
6. ✅ Настройте резервное копирование MongoDB

### Пример firewall (UFW):
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## 🗄️ Резервное копирование MongoDB

Создайте скрипт для регулярного бэкапа:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db taskflow_production --out /backups/mongodb_$DATE
```

Добавьте в crontab для ежедневного выполнения:
```bash
0 2 * * * /path/to/backup-script.sh
```

## 📊 Мониторинг

Рекомендуется настроить мониторинг для:
- Статуса backend сервиса
- Статуса MongoDB
- Использования дискового пространства
- Логов ошибок

Проверка логов:
```bash
# Backend logs
tail -f /var/log/supervisor/backend.*.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## 🔧 Обслуживание

### Обновление приложения:

1. Остановите сервисы:
```bash
sudo supervisorctl stop taskflow-backend
```

2. Обновите код
3. Обновите зависимости при необходимости
4. Пересоберите frontend:
```bash
cd /app/frontend && yarn build
```

5. Запустите сервисы:
```bash
sudo supervisorctl start taskflow-backend
sudo systemctl restart nginx
```

## 🐛 Решение проблем

### Backend не запускается
- Проверьте логи: `tail -f /var/log/supervisor/backend.err.log`
- Убедитесь, что MongoDB запущен: `sudo systemctl status mongod`
- Проверьте правильность переменных в `.env`

### Frontend не отображается
- Убедитесь, что сборка прошла успешно
- Проверьте конфигурацию Nginx
- Проверьте права доступа к `/app/frontend/build`

### Проблемы с подключением к API
- Проверьте CORS настройки в backend
- Убедитесь, что `REACT_APP_BACKEND_URL` правильно настроен
- Проверьте, что backend доступен на указанном порту

## 📝 Дополнительная информация

### Структура БД

**Коллекции:**
- `users` - пользователи системы
- `boards` - доски проектов
- `lists` - списки внутри досок
- `cards` - карточки задач

### API Endpoints

**Аутентификация:**
- POST `/api/auth/register` - регистрация
- POST `/api/auth/login` - вход
- GET `/api/auth/me` - текущий пользователь

**Доски:**
- GET `/api/boards` - список досок
- POST `/api/boards` - создать доску
- GET `/api/boards/{id}` - получить доску
- PUT `/api/boards/{id}` - обновить доску
- DELETE `/api/boards/{id}` - удалить доску

**Списки:**
- GET `/api/boards/{id}/lists` - списки доски
- POST `/api/lists` - создать список
- PUT `/api/lists/{id}` - обновить список
- DELETE `/api/lists/{id}` - удалить список

**Карточки:**
- GET `/api/lists/{id}/cards` - карточки списка
- GET `/api/boards/{id}/cards` - все карточки доски
- POST `/api/cards` - создать карточку
- PUT `/api/cards/{id}` - обновить карточку
- DELETE `/api/cards/{id}` - удалить карточку

**Админ (требуется роль admin):**
- GET `/api/users` - список пользователей
- DELETE `/api/users/{id}` - удалить пользователя

## 💡 Рекомендации

1. Регулярно делайте резервные копии базы данных
2. Настройте мониторинг и алерты
3. Используйте SSL сертификаты для безопасности
4. Ограничьте доступ к MongoDB (используйте аутентификацию)
5. Регулярно обновляйте зависимости для безопасности

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи backend и frontend
2. Убедитесь, что все сервисы запущены
3. Проверьте конфигурационные файлы

---

**Приложение готово к использованию! 🎉**
