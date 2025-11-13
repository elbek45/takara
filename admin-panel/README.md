# Takara DeFi Platform - Admin Panel

Отдельная админ-панель для управления платформой Takara DeFi с классической авторизацией по логину/паролю.

## Особенности

- **Классическая авторизация**: Логин/пароль (БЕЗ Solana Wallet)
- **Отдельный порт**: 5174 (frontend на 5173)
- **JWT токены**: Хранятся в localStorage
- **Matrix дизайн**: Такой же green + gold theme как в frontend

## Учетные данные

```
Логин: admin
Пароль: admin
```

## Установка и запуск

### 1. Установка зависимостей

```bash
cd /home/elbek/Takara/admin-panel
npm install
```

### 2. Настройка окружения

Файл `.env` уже создан с настройками:

```
VITE_API_URL=http://localhost:5000/api
```

### 3. Запуск dev сервера

```bash
npm run dev
```

Админ-панель будет доступна на: `http://localhost:5174`

### 4. Сборка для production

```bash
npm run build
```

## Структура проекта

```
admin-panel/
├── src/
│   ├── pages/              # Страницы админки
│   │   ├── Login.tsx       # Страница входа
│   │   ├── Dashboard.tsx   # Главная статистика
│   │   ├── Pools.tsx       # Управление пулами
│   │   ├── Withdrawals.tsx # Обработка выводов
│   │   └── Users.tsx       # Управление пользователями
│   ├── components/
│   │   └── layout/
│   │       └── Header.tsx  # Хедер с навигацией
│   ├── contexts/
│   │   └── AuthContext.tsx # Контекст авторизации
│   ├── services/
│   │   └── api.ts          # API сервисы
│   ├── types/
│   │   └── index.ts        # TypeScript типы
│   ├── App.tsx             # Главный компонент с роутингом
│   ├── main.tsx            # Точка входа
│   └── index.css           # Глобальные стили
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── .env
```

## Доступные страницы

- `/login` - Страница входа
- `/` - Dashboard (статистика)
- `/pools` - Управление пулами
- `/withdrawals` - Обработка выводов
- `/users` - Управление пользователями

## Backend endpoint

Для авторизации используется:

```
POST /api/admin/login
Body: { username: "admin", password: "admin" }
Response: { success: true, data: { token: "jwt_token" } }
```

## Технологии

- **React 19** + **TypeScript**
- **Vite** - сборщик
- **TailwindCSS** - стилизация
- **React Router** - роутинг
- **TanStack Query** - управление состоянием
- **Axios** - HTTP клиент

## Отличия от основного frontend

1. **НЕТ Solana Wallet Adapter** - классическая авторизация
2. **НЕТ @solana/* пакетов** - только REST API
3. **Другой порт** - 5174 вместо 5173
4. **Отдельный токен** - adminToken в localStorage
5. **Только админ-функции** - нет страниц для обычных пользователей

## Разработка

### Добавление новой страницы

1. Создайте компонент в `src/pages/`
2. Добавьте роут в `App.tsx`
3. Добавьте ссылку в `Header.tsx`

### Добавление нового API endpoint

1. Добавьте метод в `src/services/api.ts`
2. Используйте в компоненте через `useQuery` или `useMutation`

## Безопасность

- JWT токены с истечением 24 часа
- Автоматический редирект на /login при 401
- Protected routes для всех админ-страниц
- CORS настроен на localhost:5174

## Поддержка

При возникновении проблем проверьте:

1. Backend запущен на порту 5000
2. CORS включает `http://localhost:5174`
3. Endpoint `/api/admin/login` доступен
4. Токен сохраняется в localStorage как `adminToken`
