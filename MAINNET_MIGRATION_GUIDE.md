# 🚀 Takara DeFi Platform - Mainnet Migration Guide
## Пошаговое Руководство по Переходу с Devnet на Mainnet

**Дата создания:** 12 ноября 2025
**Статус:** КРИТИЧНО - Необходимо для Production запуска
**Время выполнения:** 2-4 часа
**Риск:** ВЫСОКИЙ - Требует тщательной проверки

---

## ⚠️ ВАЖНО: Прочитайте Перед Началом

**Этот процесс включает:**
- Работу с реальными SOL и USDT на mainnet
- Создание production токена TAKARA
- Необратимые операции с блокчейном
- Финансовые риски при ошибках

**Требования:**
- Доступ к production Solana wallet с достаточным балансом SOL (минимум 5-10 SOL)
- Доступ к USDT для начального liquidity (опционально)
- Административные права на сервере
- Backup всех данных

---

## 📋 Pre-Migration Checklist

### 1. Тестирование на Devnet ✅
- [ ] Все endpoints проверены и работают
- [ ] Transaction verification работает корректно
- [ ] NFT minting работает
- [ ] TAKARA token transfers работают
- [ ] Admin panel полностью функционален
- [ ] Cron jobs работают корректно

### 2. Backup
- [ ] Database backup создан
- [ ] `.env` файл сохранен
- [ ] Private keys сохранены в безопасном месте
- [ ] Git commit всех изменений

### 3. Финансовая Подготовка
- [ ] Production wallet создан и протестирован
- [ ] SOL баланс достаточен (5-10 SOL минимум)
- [ ] Понимание gas fees на mainnet
- [ ] Plan B на случай проблем

---

## 🔧 Шаг 1: Создание Production Solana Wallet

### 1.1 Генерация Нового Keypair

**ВАЖНО:** НЕ используйте devnet wallet на mainnet!

```bash
# Установите Solana CLI (если еще не установлен)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Проверьте установку
solana --version

# Создайте новый keypair для production
solana-keygen new --outfile ~/takara-mainnet-wallet.json

# ВАЖНО: Сохраните seed phrase в безопасном месте!
# Это единственный способ восстановить доступ к кошельку
```

### 1.2 Получение Public Key

```bash
solana-keygen pubkey ~/takara-mainnet-wallet.json
# Сохраните этот адрес - это ваш PLATFORM_WALLET_ADDRESS
```

### 1.3 Конвертация в Base58 Private Key

```bash
# Установите bs58-cli (если нужно)
npm install -g bs58-cli

# Конвертируйте keypair в base58 format для .env
cat ~/takara-mainnet-wallet.json | jq -r '.' | bs58 -e
# Сохраните это значение - это ваш PLATFORM_WALLET_PRIVATE_KEY
```

### 1.4 Пополнение Кошелька

```bash
# Переключитесь на mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Проверьте баланс
solana balance ~/takara-mainnet-wallet.json

# Отправьте SOL на новый кошелек через:
# - Phantom Wallet
# - Binance/другие exchanges
# - Другой mainnet wallet
```

---

## 🪙 Шаг 2: Создание TAKARA Token на Mainnet

### 2.1 Установка SPL Token CLI

```bash
# Уже включен в Solana CLI, но проверьте:
spl-token --version
```

### 2.2 Создание Token Mint

```bash
# Создайте новый token
spl-token create-token --decimals 6 ~/takara-mainnet-wallet.json

# Команда вернет Mint Address
# Пример: Creating token BtZQfVqL1cgKAxrVUdTE63v91hGzVFE7LuvQ9HQMFdvp
# СОХРАНИТЕ ЭТОТ АДРЕС!
```

**Параметры токена:**
- **Symbol:** TAKARA
- **Name:** Takara Token
- **Decimals:** 6 (1 TAKARA = 1,000,000 units)
- **Supply:** Определите максимальный supply (например, 1,000,000,000 TAKARA)

### 2.3 Создание Token Account

```bash
# Создайте token account для platform wallet
spl-token create-account <TAKARA_MINT_ADDRESS> --owner ~/takara-mainnet-wallet.json

# Команда вернет Token Account Address
# СОХРАНИТЕ ЭТОТ АДРЕС!
```

### 2.4 Mint Начального Supply

```bash
# Mint токенов (например, 1 миллиард)
spl-token mint <TAKARA_MINT_ADDRESS> 1000000000 <TOKEN_ACCOUNT_ADDRESS> \
  --mint-authority ~/takara-mainnet-wallet.json

# Проверьте баланс
spl-token balance <TAKARA_MINT_ADDRESS>
```

### 2.5 (Опционально) Disable Minting

```bash
# Если хотите зафиксировать supply:
spl-token authorize <TAKARA_MINT_ADDRESS> mint --disable \
  --authority ~/takara-mainnet-wallet.json

# ВНИМАНИЕ: Это необратимо! После этого нельзя создать больше токенов
```

### 2.6 Создание Metadata (рекомендуется)

Используйте Metaplex Token Metadata для создания on-chain metadata:

```typescript
// Используйте этот скрипт или GUI tools:
// - Metaplex Token Metadata UI
// - Solana Explorer Token Creator
// - SPL Token Registry

// Metadata должны включать:
{
  "name": "Takara Token",
  "symbol": "TAKARA",
  "description": "Takara DeFi Platform governance and rewards token",
  "image": "https://your-domain.com/takara-token-logo.png",
  "external_url": "https://takara.defi",
  "decimals": 6
}
```

---

## ⚙️ Шаг 3: Обновление Backend Configuration

### 3.1 Обновите `.env` файл

**Backup старого .env:**
```bash
cp /home/elbek/Takara/backend/.env /home/elbek/Takara/backend/.env.devnet.backup
```

**Обновите переменные:**

```bash
# Откройте .env для редактирования
nano /home/elbek/Takara/backend/.env
```

**Изменения для Mainnet:**

```env
# ========================================
# MAINNET CONFIGURATION
# ========================================

# Solana Blockchain Configuration
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Рекомендуется платный RPC для production:
# SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
# или
# SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_API_KEY

# Platform Wallet (НОВЫЙ mainnet wallet)
PLATFORM_WALLET_ADDRESS=<YOUR_NEW_MAINNET_PUBLIC_KEY>
PLATFORM_WALLET_PUBLIC_KEY=<YOUR_NEW_MAINNET_PUBLIC_KEY>
PLATFORM_WALLET_PRIVATE_KEY=<YOUR_BASE58_PRIVATE_KEY>

# TAKARA Token Configuration (НОВЫЙ mainnet token)
TAKARA_TOKEN_MINT=<YOUR_NEW_TAKARA_MINT_ADDRESS>
TAKARA_TOKEN_ACCOUNT=<YOUR_NEW_TAKARA_TOKEN_ACCOUNT>
TAKARA_DECIMALS=6

# USDT Token Configuration (Mainnet - без изменений)
USDT_TOKEN_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
USDT_MINT_ADDRESS=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
USDT_DECIMALS=6

# ⚠️ КРИТИЧНО: Включите verification транзакций
SKIP_TX_VERIFICATION=false

# Bundlr Configuration (для NFT metadata)
BUNDLR_ADDRESS=https://node1.bundlr.network
# Для mainnet используйте mainnet bundlr endpoint
```

### 3.2 Переместите Private Key в Secrets Manager (Production)

**AWS Secrets Manager:**
```bash
# Создайте secret
aws secretsmanager create-secret \
    --name takara/platform-wallet-private-key \
    --secret-string "YOUR_PRIVATE_KEY_BASE58"

# Обновите код для чтения из Secrets Manager:
# См. раздел "Шаг 5: Security Hardening"
```

**Или используйте AWS KMS для signing:**
- Более безопасно для production
- Требует интеграции с AWS SDK

---

## 🔄 Шаг 4: Обновление Сервисов

### 4.1 Solana Service

**Файл:** `/home/elbek/Takara/backend/src/services/solana.service.js`

**Проверка:** Убедитесь что USDT mint address correct:

```javascript
// Mainnet USDT mint address (уже правильный):
this.usdtMintAddress = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
```

### 4.2 Token Service

**Файл:** `/home/elbek/Takara/backend/src/services/token.service.js`

Убедитесь что токен service использует новый TAKARA mint:

```javascript
this.takaraTokenMint = process.env.TAKARA_TOKEN_MINT;
this.takaraTokenAccount = process.env.TAKARA_TOKEN_ACCOUNT;
```

### 4.3 NFT Service

**Файл:** `/home/elbek/Takara/backend/src/services/nft.service.js`

**Изменения для Mainnet:**

```javascript
// Обновите Bundlr endpoint
const bundlrAddress = process.env.BUNDLR_ADDRESS || 'https://node1.bundlr.network';

// Mainnet RPC
this.connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);
```

---

## 🧪 Шаг 5: Тестирование на Mainnet

### 5.1 Unit Testing

```bash
# Проверьте connection к mainnet
cd /home/elbek/Takara/backend

# Создайте test script
cat > test-mainnet-connection.js << 'EOF'
import { Connection, PublicKey } from '@solana/web3.js';

async function testConnection() {
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

  // Test 1: Check connection
  const version = await connection.getVersion();
  console.log('✅ Connected to Solana mainnet:', version);

  // Test 2: Check platform wallet balance
  const walletAddress = new PublicKey('YOUR_PLATFORM_WALLET_ADDRESS');
  const balance = await connection.getBalance(walletAddress);
  console.log('✅ Platform wallet balance:', balance / 1e9, 'SOL');

  // Test 3: Check TAKARA token account
  const tokenMint = new PublicKey('YOUR_TAKARA_MINT_ADDRESS');
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletAddress,
    { mint: tokenMint }
  );
  console.log('✅ TAKARA token accounts:', tokenAccounts.value.length);

  if (tokenAccounts.value.length > 0) {
    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    console.log('✅ TAKARA balance:', balance, 'TAKARA');
  }
}

testConnection().catch(console.error);
EOF

node test-mainnet-connection.js
```

### 5.2 Test Small Transaction

**ВАЖНО:** Начните с малых сумм!

```bash
# Создайте test investment с 1 USDT
# Проверьте все этапы:
# 1. USDT transfer verification
# 2. Investment creation
# 3. NFT minting
# 4. TAKARA reward calculation
```

### 5.3 Monitoring

```bash
# Запустите backend в production mode
NODE_ENV=production npm start

# Мониторьте логи:
tail -f logs/combined.log

# Проверьте health endpoint:
curl http://localhost:5000/health
```

---

## 🔒 Шаг 6: Security Hardening

### 6.1 Переместите Private Key в AWS Secrets Manager

**Обновите `nft.service.js`:**

```javascript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function loadPrivateKey() {
  if (process.env.NODE_ENV === 'production') {
    // Production: Load from AWS Secrets Manager
    const client = new SecretsManagerClient({ region: "us-east-1" });
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: "takara/platform-wallet-private-key",
      })
    );
    return response.SecretString;
  } else {
    // Development: Load from .env
    return process.env.PLATFORM_WALLET_PRIVATE_KEY;
  }
}

// В constructor:
const privateKeyBase58 = await loadPrivateKey();
const privateKeyArray = bs58.decode(privateKeyBase58);
this.platformWallet = Keypair.fromSecretKey(privateKeyArray);
```

### 6.2 Настройте Rate Limiting (уже сделано ✅)

Проверьте что все rate limiters активны:
```bash
grep -r "Limiter" /home/elbek/Takara/backend/src/middleware/
```

### 6.3 Enable HTTPS

```bash
# Используйте reverse proxy (Nginx/Caddy)
# Или AWS Load Balancer с SSL certificate
# Или Cloudflare для SSL + DDoS protection
```

---

## 📊 Шаг 7: Database Considerations

### 7.1 Production Database Migration

**Опции:**
1. **AWS RDS PostgreSQL** (рекомендуется)
2. **Supabase** (хорошо для crypto projects)
3. **DigitalOcean Managed Database**

**Миграция данных:**

```bash
# 1. Dump существующих данных
pg_dump -h localhost -U takara takara_db > takara_backup.sql

# 2. Restore на production DB
psql -h production-db-host -U takara_prod takara_prod < takara_backup.sql

# 3. Обновите .env
DATABASE_URL="postgresql://user:pass@prod-host:5432/takara_prod?ssl=true"
```

### 7.2 Очистка Devnet Данных

```sql
-- ВНИМАНИЕ: Это удалит все devnet данные!
-- Выполняйте только если уверены

-- Очистите транзакции
TRUNCATE TABLE transactions CASCADE;

-- Очистите investments
TRUNCATE TABLE investments CASCADE;

-- Очистите earnings
TRUNCATE TABLE "TakaraEarning" CASCADE;
TRUNCATE TABLE "UsdtEarning" CASCADE;

-- Очистите NFT miners
TRUNCATE TABLE "NftMiner" CASCADE;

-- Очистите withdrawals
TRUNCATE TABLE "WithdrawalRequest" CASCADE;

-- НЕ удаляйте:
-- - admins (сохраните админов)
-- - pools (сохраните конфигурацию пулов)
-- - PlatformSetting (сохраните настройки)
```

---

## 🚀 Шаг 8: Deployment Checklist

### Pre-Launch

- [ ] Все tесты пройдены на mainnet
- [ ] Transaction verification работает
- [ ] NFT minting работает с реальными изображениями
- [ ] TAKARA transfers работают
- [ ] Database backup создан
- [ ] Monitoring настроен
- [ ] Alerts настроены (email/Slack)
- [ ] Private keys в безопасном месте
- [ ] .env файлы не в git
- [ ] HTTPS настроен
- [ ] Rate limiting активен
- [ ] CORS настроен правильно
- [ ] Admin panel доступен только с безопасных IP

### Launch Day

- [ ] Обновите DNS records
- [ ] Deploy backend на production server
- [ ] Deploy frontend на Vercel/Netlify
- [ ] Deploy admin panel на отдельном subdomain
- [ ] Smoke testing всех критичных путей
- [ ] Мониторинг запущен
- [ ] Team на связи для быстрого реагирования

### Post-Launch

- [ ] Мониторьте транзакции первые 24 часа
- [ ] Проверяйте логи каждые 2-4 часа
- [ ] Готовность к rollback если нужно
- [ ] Документируйте все проблемы
- [ ] Обновляйте CHANGELOG

---

## 🔄 Rollback Plan

### Если Что-то Пошло Не Так:

1. **Остановите backend сервер**
```bash
pm2 stop takara-backend
```

2. **Восстановите .env.devnet.backup**
```bash
cp /home/elbek/Takara/backend/.env.devnet.backup /home/elbek/Takara/backend/.env
```

3. **Восстановите database**
```bash
psql -h localhost -U takara takara_db < devnet_backup.sql
```

4. **Перезапустите на devnet**
```bash
pm2 restart takara-backend
```

5. **Analyze проблему** перед повторной попыткой

---

## 📞 Emergency Contacts

**Solana Support:**
- Discord: https://discord.gg/solana
- Forum: https://forums.solana.com

**RPC Providers:**
- Helius: support@helius.dev
- Alchemy: support@alchemy.com
- QuickNode: support@quicknode.com

**Internal Team:**
- Lead Dev: [Your Contact]
- DevOps: [Your Contact]
- Security: [Your Contact]

---

## 🎯 Success Criteria

Миграция считается успешной когда:

✅ Backend подключен к mainnet
✅ TAKARA token создан и работает
✅ Transaction verification активна
✅ NFT minting работает с real assets
✅ Первая real investment обработана успешно
✅ Rewards distribution работает
✅ No critical errors в логах 24 часа
✅ Monitoring показывает нормальную работу

---

## 📚 Additional Resources

**Documentation:**
- [Solana Mainnet Docs](https://docs.solana.com/clusters)
- [SPL Token Program](https://spl.solana.com/token)
- [Metaplex Docs](https://docs.metaplex.com/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)

**Tools:**
- [Solana Explorer](https://explorer.solana.com/)
- [SolScan](https://solscan.io/)
- [Phantom Wallet](https://phantom.app/)

**Best Practices:**
- [Solana Security Best Practices](https://docs.solana.com/integrations/exchange#security)
- [Web3 Security Checklist](https://github.com/slowmist/Web3-Security-Checklist)

---

**Последнее обновление:** 12 ноября 2025
**Автор:** Claude Code
**Версия:** 1.0.0

**Удачи с миграцией! 🚀**
