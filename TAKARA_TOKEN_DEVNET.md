# TAKARA Token - Devnet Configuration

**Дата создания**: 2025-11-12
**Network**: Solana Devnet
**Status**: ✅ Active

---

## 📋 Token Details

| Parameter | Value |
|-----------|-------|
| **Token Name** | Takara |
| **Symbol** | TAKARA |
| **Decimals** | 6 |
| **Total Supply** | 1,000,000,000 TAKARA |
| **Mint Address** | `2wbjeuSPYEtVfccDeDgUvpP18Z5krcrTqzhjn3oTVHsa` |
| **Platform Token Account** | `36T1cuuVWyuDhRT936c54iC2mxrnCMVvJaikwjS7V5fp` |

---

## 🔑 Platform Wallet

| Parameter | Value |
|-----------|-------|
| **Public Key** | `CwG3yemLDj1CkCkPTf1BF4jvNKLqhVydXQsJ3NQEcFpF` |
| **Network** | Devnet |
| **SOL Balance** | ~2 SOL (devnet) |
| **TAKARA Balance** | 1,000,000,000 TAKARA |

⚠️ **IMPORTANT**: This is a TEST wallet for devnet only! Do NOT use for mainnet or real funds!

---

## 🔗 Explorer Links

### Token
- **Mint Address**: https://explorer.solana.com/address/2wbjeuSPYEtVfccDeDgUvpP18Z5krcrTqzhjn3oTVHsa?cluster=devnet
- **Platform Account**: https://explorer.solana.com/address/36T1cuuVWyuDhRT936c54iC2mxrnCMVvJaikwjS7V5fp?cluster=devnet

### Wallet
- **Platform Wallet**: https://explorer.solana.com/address/CwG3yemLDj1CkCkPTf1BF4jvNKLqhVydXQsJ3NQEcFpF?cluster=devnet

### Transactions
- **Token Creation TX**: https://explorer.solana.com/tx/2LjVABn3exfJGPVnSPyF6gPGUvwXubXwiYZxLyv1SH3GBBU3AVsnwDsQVXH63LU5fPbC67GzoYU4oKxbvjfUfyyS?cluster=devnet

---

## 🧪 Testing Token Distribution

### 1. Test Rewards Service (Dry Run)

```bash
cd /home/elbek/Takara/backend
node -e "
import('./src/services/rewards.service.js').then(module => {
  const service = module.default;
  service.testRewardsProcessing(true).then(result => {
    console.log('Test Result:', result);
    process.exit(0);
  });
});
"
```

### 2. Manual Token Distribution Test

Create a test script `test-distribution.js`:

```javascript
import tokenService from './src/services/token.service.js';

// Test sending 10 TAKARA to a wallet
const testWallet = 'YOUR_TEST_WALLET_ADDRESS';
const amount = 10;

tokenService.sendTakaraReward(testWallet, amount)
  .then(result => {
    console.log('✅ Distribution successful!');
    console.log('TX:', result.signature);
    console.log('Explorer:', `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
  })
  .catch(error => {
    console.error('❌ Distribution failed:', error);
  });
```

Run:
```bash
node test-distribution.js
```

### 3. Check Platform TAKARA Balance

```bash
node -e "
import('./src/services/token.service.js').then(module => {
  const service = module.default;
  service.getPlatformTakaraBalance().then(balance => {
    console.log('Platform TAKARA Balance:', balance);
    process.exit(0);
  });
});
"
```

---

## 📊 Environment Variables

Current `.env` configuration:

```env
# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Platform Wallet
PLATFORM_WALLET_PRIVATE_KEY=3oDpR765AXZEmu1q5Ep1dMv1mNGBxdqLBMzp43RN7yPhc4V5BPnAjnBigW1y5h8kEuUTWLTMwyvQUUVumkq9WCAw

# TAKARA Token
TAKARA_TOKEN_MINT=2wbjeuSPYEtVfccDeDgUvpP18Z5krcrTqzhjn3oTVHsa
TAKARA_TOKEN_ACCOUNT=36T1cuuVWyuDhRT936c54iC2mxrnCMVvJaikwjS7V5fp
TAKARA_DECIMALS=6

# Cron Jobs
ENABLE_CRON_JOBS=true
DAILY_REWARDS_CRON=0 0 * * *
```

---

## 🚀 Services Status

### Token Service
✅ Initialized with TAKARA token
✅ Connected to devnet
✅ Platform wallet loaded
✅ Ready for distribution

### Rewards Service
✅ Initialized
✅ Daily rewards calculation ready
✅ USDT earning records supported
✅ TAKARA distribution supported

### Cron Service
✅ 3 jobs scheduled:
- Daily Rewards (00:00 UTC)
- Pool Completion Check (01:00 UTC)
- Health Check (every 5 minutes)

---

## 🔄 Migrating to Mainnet

When ready for production:

1. **Create new mainnet wallet**:
```bash
node scripts/generate-wallet.js
```

2. **Update .env**:
```env
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PLATFORM_WALLET_PRIVATE_KEY=<new-mainnet-private-key>
```

3. **Create TAKARA token on mainnet**:
```bash
node scripts/create-takara-token.js
```

4. **Update .env** with new mainnet token addresses

5. **⚠️ IMPORTANT**: Use secure key management:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Hardware wallet for signing

---

## 📝 Notes

1. **Devnet Reset**: Devnet can be reset periodically. If token disappears, recreate using `create-takara-token.js`

2. **SOL Balance**: Keep at least 0.1 SOL on platform wallet for transaction fees

3. **Rate Limits**: Devnet may have rate limits. Use dedicated RPC for production

4. **Token Metadata**: Consider adding token metadata using Metaplex Token Metadata program

5. **Security**: NEVER commit private keys to git. Use environment variables only.

---

**Last Updated**: 2025-11-12
**Created By**: Elbek
**Status**: ✅ Ready for Testing
