# 宝 Takara DeFi Platform

**Takara** - это DeFi-платформа нового поколения с японским дизайном, где пользователи инвестируют USDT в высокодоходные пулы, получают NFT-майнеры и зарабатывают волатильный токен TAKARA.

## 🎨 Стилистика
- **Основной цвет**: Темно-зеленый (#0A2F23, #1A4D3A)
- **Акцентный цвет**: Золотой (#D4AF37, #FFD700)
- **Нарратив**: Японский стиль с иероглифом 宝 (takara - сокровище)

## 🏗️ Архитектура проекта

```
/home/elbek/Takara/
├── backend/          # Node.js + Express API
├── frontend/         # React Web App
├── mobile/           # React Native App
├── docs/             # Документация
└── docker-compose.yml # Docker окружение
```

## 📦 Технологический стек

### Backend
- **Node.js** + **Express.js** - REST API
- **PostgreSQL** - основная база данных
- **Prisma ORM** - работа с БД
- **JWT** - аутентификация
- **Solana Web3.js** - интеграция с блокчейном
- **Anchor Framework** - работа с Solana программами

### Frontend (Web)
- **React 18** + **TypeScript**
- **Vite** - сборщик
- **TailwindCSS** - стилизация
- **React Query** - управление состоянием и кэшированием
- **@solana/wallet-adapter** - интеграция Phantom Wallet

### Mobile
- **React Native**
- **Expo**
- **TypeScript**

### DevOps
- **Docker** + **Docker Compose**
- **Nginx** - reverse proxy
- **PM2** - process manager
- **PostgreSQL** - production database

## 🚀 Быстрый старт

### Требования
- Node.js >= 18.x
- Docker >= 20.x
- Docker Compose >= 2.x
- npm или yarn

### Установка

1. **Клонировать репозиторий**
```bash
cd /home/elbek/Takara
```

2. **Запустить Docker окружение (PostgreSQL)**
```bash
docker-compose up -d
```

3. **Установить зависимости backend**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

4. **Запустить backend**
```bash
npm run dev
# Backend будет доступен на http://localhost:5000
```

5. **Установить зависимости frontend**
```bash
cd ../frontend
npm install
```

6. **Запустить frontend**
```bash
npm run dev
# Frontend будет доступен на http://localhost:3000
```

## 📊 Основные функции

### Пулы инвестирования

#### Пул 1 (12 месяцев)
- Доходность TAKARA: 1:1
- Доходность USDT: 7% годовых
- Минимальный порог запуска: $100,000

#### Пул 2 (24 месяца)
- Доходность TAKARA: 1.5x
- Доходность USDT: 7% годовых
- Минимальный порог запуска: $100,000

#### Пул 3 (36 месяцев)
- Доходность TAKARA: 2x
- Доходность USDT: 7% годовых
- Минимальный порог запуска: $100,000

### NFT Майнеры (Wexel NFT)
При каждом вложении создается уникальный NFT токен, который:
- Дает право на получение дохода
- Может быть передан другому пользователю
- Валидирует право владения инвестицией

## 🔐 Аутентификация

Регистрация и вход через **Phantom Wallet** (Solana)

## 👨‍💼 Админ панель

### Возможности
- Статистика по привлеченным средствам
- Управление пользователями
- Запросы на вывод средств
- Управление пулами
- Статистика распределения TAKARA токенов

## 🗄️ База данных

PostgreSQL с следующими таблицами:
- `users` - пользователи
- `pools` - инвестиционные пулы
- `investments` - инвестиции пользователей
- `nft_miners` - NFT токены
- `withdrawal_requests` - запросы на вывод
- `transactions` - история транзакций
- `takara_earnings` - начисления TAKARA

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/connect` - подключение Phantom wallet
- `POST /api/auth/verify` - верификация подписи
- `GET /api/auth/profile` - получить профиль

### Pools
- `GET /api/pools` - список пулов
- `GET /api/pools/:id` - детали пула
- `POST /api/pools/:id/invest` - инвестировать в пул

### Investments
- `GET /api/investments` - мои инвестиции
- `GET /api/investments/:id` - детали инвестиции
- `POST /api/investments/:id/withdraw` - запрос на вывод

### Admin
- `GET /api/admin/stats` - статистика платформы
- `GET /api/admin/users` - список пользователей
- `GET /api/admin/withdrawals` - запросы на вывод
- `PUT /api/admin/pools/:id/activate` - активировать пул

## 🔧 Переменные окружения

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://takara:takara_password@localhost:5432/takara_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WALLET_ADDRESS=7rXW8Sjiz4u7dd1afhid1K7oQiSXghtEpop9zxLSjbha
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOLANA_NETWORK=mainnet-beta
```

## 📱 Deployment

### Production Backend
```bash
cd backend
npm run build
pm2 start ecosystem.config.js --env production
```

### Production Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to hosting (Vercel, Netlify, etc.)
```

## 📝 Лицензия

Proprietary - All rights reserved

## 👥 Команда разработки

- **Elbek** - Lead Developer

## 🔗 Полезные ссылки

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Phantom Wallet](https://phantom.app/)
- [Reference: aidav2.com](https://aidav2.com)

---

**Кошелек для приема средств**: `7rXW8Sjiz4u7dd1afhid1K7oQiSXghtEpop9zxLSjbha`
