# 🔑 Инструкция по входу в TT-Manager

## ✅ API работает корректно!

Тестирование показало, что все API endpoints работают идеально:
- ✅ Регистрация работает
- ✅ Вход работает  
- ✅ Создание пользователей работает

## 📝 Готовые тестовые аккаунты

Используйте любой из этих аккаунтов для входа:

### Аккаунт 1:
```
Email: test@example.com
Password: test123
```

### Аккаунт 2:
```
Email: newuser@test.com
Password: password123
```

### Аккаунт 3:
```
Email: user7552@test.com
Password: password123
```

### Аккаунт 4:
```
Email: finaltest@example.com
Password: password123
```

### Аккаунт 5:
```
Email: manual@test.com  
Password: password123
```

## 🚀 Пошаговая инструкция для ВХОДА:

1. Откройте приложение в браузере
2. Убедитесь, что выбрана вкладка **"Login"** (слева, должна быть подсвечена cyan цветом)
3. Введите email из списка выше
4. Введите пароль **password123** (для всех аккаунтов кроме первого)
5. Нажмите кнопку **"Sign In"**
6. Вы должны попасть на Dashboard

## 🆕 Пошаговая инструкция для РЕГИСТРАЦИИ:

1. Откройте приложение
2. Нажмите кнопку **"Register"** (справа вверху формы)
3. Заполните форму:
   - **Name**: Любое имя (например: Ivan Petrov)
   - **Email**: Уникальный email (например: ivan@mycompany.com)
   - **Password**: Минимум 6 символов (например: mypassword123)
4. Нажмите кнопку **"Create Account"**
5. Вы автоматически попадете на Dashboard

## ⚠️ Частые ошибки:

### "Authentication failed" при входе:
- **Причина 1**: Неправильный пароль
  - Решение: Используйте `password123` для всех тестовых аккаунтов
  
- **Причина 2**: Email не зарегистрирован  
  - Решение: Сначала зарегистрируйтесь или используйте готовый аккаунт

- **Причина 3**: Вы на вкладке Register, а не Login
  - Решение: Переключитесь на вкладку "Login"

### "Authentication failed" при регистрации:
- **Причина 1**: Email уже используется
  - Решение: Используйте другой email

- **Причина 2**: Пароль короче 6 символов
  - Решение: Введите минимум 6 символов

## 🔍 Отладка (если не работает):

### Шаг 1: Откройте консоль браузера
- Chrome/Edge: F12 или Ctrl+Shift+I
- Firefox: F12
- Safari: Cmd+Option+I (Mac)

### Шаг 2: Перейдите на вкладку "Console"

### Шаг 3: Попробуйте войти/зарегистрироваться

### Шаг 4: Посмотрите логи в консоли
Вы должны увидеть:
```
Submitting to: /api/auth/login {...}
Response status: 200
Response data: {user: {...}, token: "..."}
```

Если видите:
- `Response status: 401` - неправильный пароль
- `Response status: 400` - email уже используется  
- `Response status: 500` - серверная ошибка

### Шаг 5: Проверьте вкладку "Network"
- Найдите запрос к `/api/auth/login` или `/api/auth/register`
- Проверьте статус ответа (должен быть 200)
- Проверьте Response - должен содержать `token` и `user`

## 📱 URL для доступа:

**Локально:**
```
http://localhost:3000
```

**Preview URL** (если настроен):
```
https://project-tracker-163.preview.emergentagent.com
```

## ✅ Проверка что API работает:

Выполните в терминале:

```bash
# Тест регистрации
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test123@test.com","password":"password123","name":"Test User"}'

# Тест входа  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Оба запроса должны вернуть JSON с `token` и `user`.

## 🆘 Если ничего не помогает:

1. Очистите кэш браузера (Ctrl+Shift+Del)
2. Откройте в режиме инкогнито
3. Попробуйте другой браузер
4. Проверьте что JavaScript включен
5. Проверьте что cookies разрешены

## 📞 Техническая информация:

- **Backend**: Next.js API Routes
- **Database**: SQLite (локально в `/app/frontend/prisma/dev.db`)
- **Port**: 3000
- **JWT Token**: Expires in 7 days
- **Password Hashing**: bcrypt

---

**Всё работает! Если проблема сохраняется - пришлите скриншот консоли браузера (F12 → Console)**
