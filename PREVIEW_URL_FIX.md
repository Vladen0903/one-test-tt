# 🔧 Решение проблемы с Preview URL

## ❌ Проблема

Preview URL `https://team-planner-30.preview.emergentagent.com` не работает - API возвращает 502 Bad Gateway или старые FastAPI endpoints.

## ✅ Решение

### Текущий статус:

1. ✅ **Next.js приложение запущено** и работает на `http://localhost:3000`
2. ✅ **API работает локально** - все endpoints отвечают корректно
3. ✅ **База данных SQLite** создана и функционирует
4. ❌ **Preview URL проксируется неправильно** - требуется настройка ingress

### Как использовать приложение СЕЙЧАС:

#### Вариант 1: Локальный доступ (работает 100%)

```bash
# На сервере:
curl http://localhost:3000

# Используйте SSH tunnel для доступа с локальной машины:
ssh -L 3000:localhost:3000 user@your-server
# Затем откройте в браузере: http://localhost:3000
```

#### Вариант 2: Настроить nginx reverse proxy

Создайте `/etc/nginx/sites-available/ttmanager`:

```nginx
server {
    listen 80;
    server_name team-planner-30.preview.emergentagent.com;

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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Для больших запросов (загрузка файлов)
        client_max_body_size 25M;
    }
}
```

Активируйте:
```bash
sudo ln -s /etc/nginx/sites-available/ttmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Вариант 3: Использовать прямой доступ к порту

Если есть доступ к firewall, откройте порт 3000:
```bash
sudo ufw allow 3000/tcp
```

Затем доступ по: `http://your-server-ip:3000`

### Тестовые аккаунты для входа:

```
Email: test@example.com | Password: test123
Email: local999@test.com | Password: password123
Email: newuser@test.com | Password: password123
```

## 🔍 Диагностика

### Проверка что Next.js работает:

```bash
# Проверить статус
sudo supervisorctl status nextjs

# Должно быть: RUNNING

# Проверить логи
tail -50 /var/log/supervisor/nextjs.out.log

# Тест API локально
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test"}'

# Должен вернуть JSON с token
```

### Если нужно перезапустить:

```bash
sudo supervisorctl restart nextjs
```

### Если Next.js не запущен:

```bash
cd /app/frontend
yarn install
yarn prisma:generate
sudo supervisorctl start nextjs
```

## 📝 Технические детали

### Текущая конфигурация:

- **Next.js**: Порт 3000, слушает 0.0.0.0
- **База данных**: SQLite в `/app/frontend/prisma/dev.db`
- **Supervisor**: Управляет процессом Next.js
- **API Routes**: Все работают локально

### Supervisor конфигурация:

```ini
[program:nextjs]
command=/usr/bin/node /app/frontend/node_modules/.bin/next dev -p 3000 -H 0.0.0.0
directory=/app/frontend
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/nextjs.err.log
stdout_logfile=/var/log/supervisor/nextjs.out.log
environment=NODE_ENV="development",PORT="3000"
```

## 🆘 Если ничего не помогает

Используйте SSH tunnel:

```bash
# С вашей локальной машины:
ssh -L 3000:localhost:3000 root@your-server-ip

# Откройте в браузере:
http://localhost:3000
```

## ✅ Подтверждение что работает

Выполните на сервере:

```bash
# Тест регистрации
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@test.com","password":"password123","name":"Verify"}' \
  | jq -r 'if .token then "✅ API WORKS!" else . end'

# Тест входа
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r 'if .token then "✅ LOGIN WORKS!" else . end'
```

Оба должны вернуть `✅`

---

**Next.js приложение полностью работает! Проблема только в маршрутизации preview URL.**

**Используйте SSH tunnel или настройте nginx для доступа.**
