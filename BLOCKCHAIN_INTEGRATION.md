# Takara DeFi Platform - Blockchain Integration

**Дата создания**: 2025-11-12
**Статус**: ✅ Transaction Verification Implemented

---

## 📊 Обзор

Takara DeFi Platform использует Solana blockchain для:
1. **USDT Transfers** - Прием инвестиций в USDT
2. **NFT Minting** - Создание Wexel NFT Miners через Metaplex
3. **TAKARA Token** - Награды в виде кастомного SPL токена
4. **Transaction Verification** - Верификация всех on-chain операций

---

## 🔧 Компоненты

### 1. Solana Service (`src/services/solana.service.js`)

Основной сервис для работы с Solana blockchain.

**Функциональность:**
- ✅ Верификация транзакций (USDT и SOL)
- ✅ Проверка существования транзакций
- ✅ Получение балансов (USDT и SOL)
- ✅ Парсинг token transfers из транзакций

**Основные методы:**

```javascript
// Verify transaction exists and is confirmed
await solanaService.verifyTransaction(signature)

// Verify USDT transfer with amount and wallet checks
await solanaService.verifyUSDTTransfer(
  signature,
  fromWallet,
  toWallet,
  expectedAmount
)

// Verify SOL transfer (для тестирования)
await solanaService.verifySOLTransfer(
  signature,
  fromWallet,
  toWallet,
  expectedAmount
)

// Get wallet balances
await solanaService.getSOLBalance(walletAddress)
await solanaService.getUSDTBalance(walletAddress)

// Quick check if transaction exists
await solanaService.transactionExists(signature)
```

### 2. NFT Service (`src/services/nft.service.js`)

Сервис для минтинга Wexel NFT Miners через Metaplex SDK.

**См. также**: `NFT_INTEGRATION.md` для деталей

### 3. Investment Flow with Verification

```
User Creates Investment
        ↓
Frontend sends TX signature
        ↓
Backend receives request
        ↓
Verify USDT Transfer on Solana:
  - Transaction exists?
  - Transaction confirmed?
  - From correct wallet?
  - To platform wallet?
  - Amount matches?
        ↓
Create Investment in DB
        ↓
Mint Wexel NFT
        ↓
Transfer NFT to user
        ↓
Return success
```

---

## 🔐 Environment Variables

Добавьте в `.env`:

```env
# Solana Blockchain Configuration
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Platform Wallet (receives USDT investments)
PLATFORM_WALLET_ADDRESS=7rXW8Sjiz4u7dd1afhid1K7oQiSXghtEpop9zxLSjbha
PLATFORM_WALLET_PUBLIC_KEY=7rXW8Sjiz4u7dd1afhid1K7oQiSXghtEpop9zxLSjbha

# USDT Token Configuration (Solana mainnet)
USDT_TOKEN_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
USDT_MINT_ADDRESS=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
USDT_DECIMALS=6

# Transaction Verification
# Set to 'true' to skip blockchain verification (development only!)
SKIP_TX_VERIFICATION=true

# Platform Wallet Private Key (for NFT minting)
PLATFORM_WALLET_PRIVATE_KEY=<base58-encoded-private-key>
```

**Development vs Production:**

| Environment | SKIP_TX_VERIFICATION | Network | Notes |
|-------------|---------------------|---------|-------|
| Development | `true` | devnet | Быстрее для тестирования |
| Staging | `false` | devnet | Полная верификация |
| Production | `false` | mainnet | **ОБЯЗАТЕЛЬНО** верифицировать |

---

## 📝 API Integration

### Investment Creation with Verification

**Endpoint:** `POST /api/investments`

**Request:**
```json
{
  "poolId": "pool-id-here",
  "amount": 1000,
  "txSignature": "5J8...abc",
  "walletAddress": "UserWalletPublicKey"
}
```

**Backend Flow:**

1. Validate input data
2. Check pool status and limits
3. **Verify USDT transfer** (if `SKIP_TX_VERIFICATION` !== 'true'):
   - Call `solanaService.verifyUSDTTransfer()`
   - Check sender, recipient, amount
   - Ensure transaction confirmed
4. Check TX signature not already used
5. Create Investment in database
6. Mint Wexel NFT
7. Transfer NFT to user
8. Return success response

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "investment": {
      "id": "inv-123",
      "amount": "1000",
      "status": "active",
      ...
    },
    "nft": {
      "mintAddress": "NFT Mint Address",
      "imageUrl": "https://...",
      "metadata": {...}
    }
  }
}
```

**Response (Verification Failed):**
```json
{
  "success": false,
  "error": "Transaction verification failed: Amount mismatch..."
}
```

---

## 🧪 Testing

### Development Mode (Skip Verification)

Для быстрого тестирования:

```env
SKIP_TX_VERIFICATION=true
```

В этом режиме backend **НЕ** будет верифицировать транзакции на блокчейне.

**⚠️ ВАЖНО**: Никогда не используйте `SKIP_TX_VERIFICATION=true` в production!

### Testing with Real Transactions

1. **Devnet Setup:**
```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SKIP_TX_VERIFICATION=false
```

2. **Get Devnet SOL:**
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

3. **Create Test USDT Token** (devnet doesn't have real USDT):
```bash
spl-token create-token --url devnet
spl-token create-account <TOKEN_MINT> --url devnet
spl-token mint <TOKEN_MINT> 1000000 --url devnet
```

4. **Send Test USDT to Platform Wallet:**
```bash
spl-token transfer <TOKEN_MINT> 100 PLATFORM_WALLET --url devnet
```

5. **Use Transaction Signature** в API request

### Manual Verification Test

```javascript
// In Node.js console or test file
import solanaService from './src/services/solana.service.js';

// Test transaction verification
const result = await solanaService.verifyUSDTTransfer(
  'YOUR_TX_SIGNATURE',
  'FROM_WALLET',
  'TO_WALLET',
  100
);

console.log(result);
```

---

## 🔍 Transaction Verification Details

### USDT Transfer Verification Steps

1. **Get Transaction from Blockchain**
   ```javascript
   const tx = await connection.getTransaction(signature)
   ```

2. **Check Transaction Success**
   ```javascript
   if (tx.meta.err) {
     throw new Error('Transaction failed')
   }
   ```

3. **Parse Token Balances**
   - Compare `preTokenBalances` vs `postTokenBalances`
   - Find USDT token (by mint address)
   - Calculate balance changes

4. **Verify Sender**
   ```javascript
   if (fromAddress !== expectedSender) {
     throw new Error('Sender mismatch')
   }
   ```

5. **Verify Recipient**
   ```javascript
   if (toAddress !== platformWallet) {
     throw new Error('Recipient mismatch')
   }
   ```

6. **Verify Amount**
   ```javascript
   const tolerance = 0.01 // USDT
   if (Math.abs(actualAmount - expectedAmount) > tolerance) {
     throw new Error('Amount mismatch')
   }
   ```

### Common Verification Errors

| Error | Причина | Решение |
|-------|---------|---------|
| Transaction not found | TX еще не подтверждена | Подождать confirmation |
| Transaction failed | TX failed on-chain | Проверить TX в explorer |
| Sender mismatch | Неверный отправитель | Проверить wallet address |
| Recipient mismatch | Отправили не на platform wallet | Проверить PLATFORM_WALLET_PUBLIC_KEY |
| Amount mismatch | Неверная сумма | Проверить amount в TX |
| USDT transfer not found | TX не содержит USDT transfer | Проверить USDT_MINT_ADDRESS |

---

## 📊 Solana Explorer Links

### Mainnet
- **Explorer**: https://explorer.solana.com
- **Transaction**: `https://explorer.solana.com/tx/<SIGNATURE>`
- **Wallet**: `https://explorer.solana.com/address/<ADDRESS>`
- **Token**: `https://explorer.solana.com/address/<MINT_ADDRESS>`

### Devnet
- **Explorer**: https://explorer.solana.com/?cluster=devnet
- **Transaction**: `https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet`

---

## 🚀 USDT Token на Solana

### Mainnet USDT
```
Mint Address: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
Decimals: 6
Name: USD Coin (Portal from Ethereum)
Symbol: USDT
```

### Получение USDT на Mainnet

1. **Через DEX** (Jupiter, Raydium, Orca):
   - Swap SOL → USDT
   - Swap другие токены → USDT

2. **Через CEX** (Binance, OKX, etc.):
   - Withdraw USDT to Solana network
   - Указать Solana wallet address

3. **Через Bridge**:
   - Wormhole Bridge (Ethereum → Solana)
   - Allbridge (multi-chain)

---

## 📈 Next Steps (TODO)

### 1. TAKARA SPL Token Creation
- [ ] Create TAKARA token mint
- [ ] Set up token metadata
- [ ] Configure mint authority
- [ ] Test token transfers
- [ ] Update `TAKARA_TOKEN_MINT` in .env

### 2. TAKARA Rewards Distribution
- [ ] Create distribution service
- [ ] Implement daily rewards calculation
- [ ] Batch transfer optimization
- [ ] Transaction fee management

### 3. Withdrawal Processing
- [ ] Admin approval flow
- [ ] Automated USDT transfers
- [ ] Automated TAKARA transfers
- [ ] Transaction signature logging

### 4. Advanced Features
- [ ] Multi-signature wallet support
- [ ] Transaction batching
- [ ] Gas optimization
- [ ] Fallback RPC endpoints
- [ ] Transaction retry logic

---

## 🔒 Security Best Practices

### Platform Wallet Security

1. **Private Key Storage:**
   - ❌ Never commit private keys to git
   - ✅ Use environment variables
   - ✅ Production: Use AWS Secrets Manager / KMS
   - ✅ Multi-signature wallet for large amounts

2. **RPC Endpoints:**
   - ✅ Use dedicated RPC (Helius, QuickNode, Alchemy)
   - ✅ Set rate limits
   - ✅ Monitor RPC health
   - ✅ Have fallback RPCs

3. **Transaction Verification:**
   - ✅ Always verify in production
   - ✅ Check transaction finality
   - ✅ Validate all amounts
   - ✅ Log all verifications

4. **Error Handling:**
   - ✅ Never expose internal errors to users
   - ✅ Log detailed errors internally
   - ✅ Implement retry logic
   - ✅ Alert on critical failures

---

## 📚 Resources

### Documentation
- [Solana Docs](https://docs.solana.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token Program](https://spl.solana.com/token)
- [Metaplex Docs](https://docs.metaplex.com/)

### Tools
- [Solana Explorer](https://explorer.solana.com)
- [Solana CLI](https://docs.solana.com/cli)
- [SPL Token CLI](https://spl.solana.com/token#command-line-utility)

### RPC Providers
- [Helius](https://www.helius.dev/)
- [QuickNode](https://www.quicknode.com/)
- [Alchemy](https://www.alchemy.com/)
- [Triton](https://triton.one/)

---

## 🐛 Troubleshooting

### Backend не запускается

**Error**: `Cannot find module '@solana/spl-token'`

**Solution**:
```bash
cd backend
npm install @solana/spl-token
```

### Transaction Verification всегда fails

**Check**:
1. `SKIP_TX_VERIFICATION` set to `true` or `false`?
2. `PLATFORM_WALLET_PUBLIC_KEY` matches actual platform wallet?
3. `USDT_MINT_ADDRESS` correct for your network?
4. Transaction actually confirmed on blockchain?

**Debug**:
```javascript
// Check transaction in explorer
console.log('TX Explorer:', `https://explorer.solana.com/tx/${signature}`)

// Check balances
const balance = await solanaService.getUSDTBalance(walletAddress)
console.log('USDT Balance:', balance)
```

### RPC Rate Limits

**Symptom**: `429 Too Many Requests`

**Solution**:
1. Use dedicated RPC provider
2. Implement caching
3. Add retry logic with exponential backoff

---

**Последнее обновление:** 2025-11-12
**Разработчик:** Elbek
**Статус:** ✅ Transaction Verification Implemented
