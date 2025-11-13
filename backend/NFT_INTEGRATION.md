# NFT Wexel Miner Integration

## Overview
The Takara DeFi Platform automatically mints unique NFT Wexel Miners for each investment. These NFTs serve as proof of ownership and represent the mining rights for TAKARA tokens.

## How It Works

### 1. Investment Flow with NFT Minting
When a user creates an investment:
1. Investment record is created in the database
2. NFT is automatically minted on Solana blockchain
3. NFT is transferred to user's wallet
4. NFT metadata is stored in database

### 2. NFT Metadata
Each Wexel Miner NFT contains:
- **Name**: `Takara Wexel Miner #<investment-id>`
- **Symbol**: `WEXEL`
- **Attributes**:
  - Investment Amount (USDT)
  - Pool Name
  - Duration (months)
  - TAKARA Multiplier
  - Mining Power (calculated from amount × multiplier)
  - Rarity (based on investment size)
  - Investment ID

### 3. Rarity Tiers
- **Legendary**: $10,000+ investment
- **Epic**: $5,000 - $9,999
- **Rare**: $1,000 - $4,999
- **Uncommon**: $500 - $999
- **Common**: < $500

### 4. NFT Color Scheme
- **1x multiplier**: Dark green (#0A2F23)
- **1.5x multiplier**: Medium green (#1A4D3A)
- **2x multiplier**: Gold (#D4AF37)

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install @metaplex-foundation/js @metaplex-foundation/mpl-token-metadata @solana/spl-token bs58
```

### 2. Generate Platform Wallet
```bash
# Generate new keypair
solana-keygen new --outfile platform-wallet.json

# Get the public key
solana-keygen pubkey platform-wallet.json
```

### 3. Configure Environment Variables
Add to `.env`:
```env
PLATFORM_WALLET_PRIVATE_KEY=<base58-encoded-private-key>
BUNDLR_ADDRESS=https://devnet.bundlr.network
NFT_IMAGE_BASE_URL=https://via.placeholder.com
```

**Important**:
- For production, use `https://node1.bundlr.network` for Bundlr
- Store private key securely using AWS Secrets Manager or KMS
- Ensure platform wallet has SOL for transaction fees

### 4. Fund Platform Wallet
```bash
# For devnet testing
solana airdrop 2 <PLATFORM_WALLET_ADDRESS> --url devnet

# For mainnet, transfer SOL to the wallet
```

## API Changes

### Investment Creation Endpoint
**POST** `/api/investments`

Request body now requires:
```json
{
  "poolId": "uuid",
  "amount": "1000",
  "walletAddress": "user-solana-wallet-address",
  "txSignature": "transaction-signature"
}
```

Response includes NFT data:
```json
{
  "success": true,
  "data": {
    "investment": {...},
    "nft": {
      "mintAddress": "NFT-mint-address",
      "imageUrl": "NFT-image-url",
      "metadataUri": "arweave-metadata-uri"
    },
    "estimatedRewards": {...}
  }
}
```

## Database Schema

### nft_miners Table
```sql
CREATE TABLE nft_miners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  mint_address TEXT NOT NULL UNIQUE,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Frontend Integration

The frontend automatically:
1. Passes user's wallet address when creating investment
2. Displays NFT information on investments page
3. Links to Solscan for NFT details

## Error Handling

If NFT minting fails:
- Investment is still created successfully
- Error is logged but doesn't fail the request
- Admin can manually mint NFT later using investment ID

## Security Considerations

1. **Private Key Storage**: Never commit `PLATFORM_WALLET_PRIVATE_KEY` to version control
2. **Production Setup**: Use AWS Secrets Manager, Google Cloud KMS, or HashiCorp Vault
3. **Wallet Funding**: Ensure platform wallet always has sufficient SOL for minting
4. **Transaction Verification**: TODO - Add actual Solana transaction verification (currently using placeholder)

## Future Enhancements

1. **Real Transaction Verification**: Verify actual USDT transfer on Solana
2. **Custom NFT Images**: Generate unique images for each NFT instead of placeholder
3. **NFT Collections**: Group NFTs into collections by pool type
4. **Metadata Updates**: Allow updating NFT metadata for active investments
5. **NFT Trading**: Enable secondary market for Wexel Miners
6. **Staking Benefits**: Provide additional benefits for NFT holders

## Troubleshooting

### NFT Service Not Initializing
- Check that `PLATFORM_WALLET_PRIVATE_KEY` is set correctly
- Ensure private key is base58 encoded
- Verify wallet has SOL balance

### Minting Fails
- Check Solana RPC endpoint is accessible
- Verify Bundlr endpoint is responding
- Ensure wallet has enough SOL for transaction fees
- Check console logs for detailed error messages

### NFT Not Appearing in Wallet
- Verify NFT was minted (check mint address on Solscan)
- Check transfer transaction succeeded
- Refresh wallet (may take a few seconds)
- Verify correct wallet address was provided

## Testing

For testing without real blockchain transactions:
1. Use Solana devnet (`SOLANA_RPC_URL=https://api.devnet.solana.com`)
2. Use devnet Bundlr (`BUNDLR_ADDRESS=https://devnet.bundlr.network`)
3. Fund wallet with devnet SOL (airdrop)
4. Test full investment + NFT minting flow

## Links

- [Metaplex Documentation](https://docs.metaplex.com/)
- [Solana NFT Standard](https://docs.metaplex.com/programs/token-metadata/)
- [Bundlr Documentation](https://docs.bundlr.network/)
- [Solscan Explorer](https://solscan.io/)
