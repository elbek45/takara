# Frontend Troubleshooting Guide

## Белый экран (White Screen)

Если вы видите белый экран при открытии http://localhost:5173, выполните следующие шаги:

### 1. Проверьте консоль браузера

1. Откройте браузер (Chrome/Firefox)
2. Нажмите **F12** чтобы открыть DevTools
3. Перейдите во вкладку **Console**
4. Посмотрите на ошибки (красный текст)

Наиболее частые ошибки:

#### Ошибка: Phantom wallet not found
```
Error: Phantom wallet adapter not found
```
**Решение**: Установите Phantom Wallet расширение для браузера
- Chrome: https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/phantom-app/

#### Ошибка: Module not found
```
Failed to resolve module
```
**Решение**: Переустановите зависимости
```bash
cd /home/elbek/Takara/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 2. Проверьте backend API

Убедитесь что backend работает:

```bash
curl http://localhost:5000/health
```

Должен вернуть:
```json
{"status":"ok","timestamp":"..."}
```

Если не работает:
```bash
cd /home/elbek/Takara/backend
npm run dev
```

### 3. Проверьте database

```bash
cd /home/elbek/Takara/backend
npx prisma studio
```

Откроется http://localhost:5555 с GUI для базы данных.

### 4. Пересоздайте базу данных

```bash
cd /home/elbek/Takara/backend
npx prisma migrate reset
npx prisma migrate dev
```

## Admin доступ

### Создание администратора

1. Убедитесь что база данных создана:
```bash
cd /home/elbek/Takara/backend
npx prisma migrate dev
```

2. Создайте администратора:
```bash
node create-admin.js
```

3. Откройте `create-admin.js` и замените `ADMIN_WALLET_ADDRESS_HERE` на ваш Phantom wallet адрес

4. Запустите снова:
```bash
node create-admin.js
```

### Вход для администратора

1. Откройте http://localhost:5173
2. Нажмите "Connect Wallet" в правом верхнем углу
3. Подключите Phantom wallet с адресом администратора
4. Перейдите на http://localhost:5173/admin или http://localhost:5173/admin/dashboard

### Проверка роли пользователя

```bash
cd /home/elbek/Takara/backend
npx prisma studio
```

Откройте таблицу `User` и проверьте что поле `role` = `admin`

## Полный перезапуск

Если ничего не помогает:

```bash
# 1. Остановите все процессы
pkill -f "npm run dev"
pkill -f "node"

# 2. Backend
cd /home/elbek/Takara/backend
rm -rf node_modules
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# 3. Frontend (в новом терминале)
cd /home/elbek/Takara/frontend
rm -rf node_modules .vite
npm install
npm run dev
```

## Порты

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Prisma Studio: http://localhost:5555

## Логи

### Backend logs
```bash
cd /home/elbek/Takara/backend
npm run dev
```

### Frontend logs
```bash
cd /home/elbek/Takara/frontend
npm run dev
```

### Browser console
F12 → Console tab

## Тестовые данные

### Создать тестовые пулы

Откройте Prisma Studio:
```bash
cd /home/elbek/Takara/backend
npx prisma studio
```

Перейдите в таблицу `Pool` и создайте 3 пула:

**Pool 1**: Basic DeFi Pool
- name: "Basic DeFi Pool"
- minInvestment: 50
- maxInvestment: 500
- durationMonths: 3
- usdtApy: 7.00
- takaraMultiplier: 1.0
- status: "active"
- startDate: (текущая дата)
- endDate: (через 3 месяца)

**Pool 2**: Professional DeFi Pool
- name: "Professional DeFi Pool"
- minInvestment: 500
- maxInvestment: 5000
- durationMonths: 6
- usdtApy: 7.00
- takaraMultiplier: 1.5
- status: "active"
- startDate: (текущая дата)
- endDate: (через 6 месяцев)

**Pool 3**: Enterprise DeFi Pool
- name: "Enterprise DeFi Pool"
- minInvestment: 5000
- maxInvestment: 50000
- durationMonths: 12
- usdtApy: 7.00
- takaraMultiplier: 2.0
- status: "active"
- startDate: (текущая дата)
- endDate: (через 12 месяцев)

## Контакты

Если проблема не решается, проверьте:
- Node.js версия: `node --version` (должна быть v18+)
- npm версия: `npm --version`
- PostgreSQL статус: `sudo systemctl status postgresql`
