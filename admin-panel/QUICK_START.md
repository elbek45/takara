# Быстрый старт Admin Panel

## Запуск админ-панели

```bash
cd /home/elbek/Takara/admin-panel
npm run dev
```

Админ-панель будет доступна на: **http://localhost:5174**

## Учетные данные для входа

```
Логин: admin
Пароль: admin
```

## Убедитесь что backend запущен

Backend должен работать на порту 5000:

```bash
cd /home/elbek/Takara/backend
npm run dev
```

## Структура файлов

Все файлы созданы в `/home/elbek/Takara/admin-panel/`:

### Конфигурация
- ✅ `package.json` - зависимости
- ✅ `vite.config.ts` - конфиг Vite (порт 5174)
- ✅ `tsconfig.json` - TypeScript
- ✅ `tailwind.config.js` - TailwindCSS (Matrix theme)
- ✅ `.env` - переменные окружения

### Исходный код (src/)
- ✅ `main.tsx` - точка входа
- ✅ `App.tsx` - роутинг + protected routes
- ✅ `index.css` - глобальные стили

#### Страницы (src/pages/)
- ✅ `Login.tsx` - форма входа
- ✅ `Dashboard.tsx` - главная статистика
- ✅ `Pools.tsx` - управление пулами
- ✅ `Withdrawals.tsx` - обработка выводов
- ✅ `Users.tsx` - управление пользователями

#### Компоненты (src/components/layout/)
- ✅ `Header.tsx` - навигация + кнопка Logout

#### Сервисы (src/)
- ✅ `contexts/AuthContext.tsx` - авторизация
- ✅ `services/api.ts` - API клиент
- ✅ `types/index.ts` - TypeScript типы

### Backend изменения
- ✅ `/home/elbek/Takara/backend/src/routes/admin.routes.js` - добавлен `POST /api/admin/login`
- ✅ `/home/elbek/Takara/backend/src/middleware/auth.middleware.js` - поддержка админ-токенов
- ✅ `/home/elbek/Takara/backend/.env` - CORS обновлен для порта 5174

## Проверка работы

1. **Backend**: http://localhost:5000/health - должен вернуть `{"status":"ok"}`
2. **Admin Panel**: http://localhost:5174 - должна открыться страница логина
3. **Login endpoint**: `POST http://localhost:5000/api/admin/login` с `{username:"admin", password:"admin"}`

## Зависимости установлены

```bash
npm install
```

Уже выполнено! Все 293 пакета установлены.

## Готово к запуску!

Просто выполните:

```bash
npm run dev
```
