/**
 * TAKARA Token Creation Script
 * Creates a custom SPL token on Solana for platform rewards
 *
 * Usage:
 *   node scripts/create-takara-token.js
 *
 * Requirements:
 *   - PLATFORM_WALLET_PRIVATE_KEY in .env
 *   - SOL balance on platform wallet for transaction fees
 */

import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Token configuration
const TOKEN_CONFIG = {
  name: 'Takara',
  symbol: 'TAKARA',
  decimals: 6, // 1 TAKARA = 1,000,000 smallest units
  initialSupply: 1_000_000_000, // 1 billion TAKARA tokens
  description: 'Takara DeFi Platform Rewards Token',
  logoUrl: 'https://takara.defi/assets/takara-logo.png', // TODO: Upload actual logo
};

async function createTakaraToken() {
  try {
    console.log('🚀 Starting TAKARA Token Creation...\n');

    // Initialize connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
      'confirmed'
    );
    console.log('✅ Connected to Solana:', process.env.SOLANA_RPC_URL || 'devnet');

    // Load platform wallet from private key
    if (!process.env.PLATFORM_WALLET_PRIVATE_KEY) {
      throw new Error('PLATFORM_WALLET_PRIVATE_KEY not set in environment');
    }

    const privateKeyArray = bs58.decode(process.env.PLATFORM_WALLET_PRIVATE_KEY);
    const payer = Keypair.fromSecretKey(privateKeyArray);
    console.log('✅ Platform Wallet:', payer.publicKey.toBase58());

    // Check SOL balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 SOL Balance: ${balance / 1e9} SOL`);

    if (balance < 0.01 * 1e9) {
      throw new Error('Insufficient SOL balance. Need at least 0.01 SOL for token creation.');
    }

    console.log('\n📝 Token Configuration:');
    console.log(`   Name: ${TOKEN_CONFIG.name}`);
    console.log(`   Symbol: ${TOKEN_CONFIG.symbol}`);
    console.log(`   Decimals: ${TOKEN_CONFIG.decimals}`);
    console.log(`   Initial Supply: ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol}`);

    // Step 1: Create the token mint
    console.log('\n🎨 Step 1: Creating Token Mint...');
    const mint = await createMint(
      connection,
      payer, // Payer for the transaction
      payer.publicKey, // Mint authority (who can mint new tokens)
      payer.publicKey, // Freeze authority (who can freeze token accounts)
      TOKEN_CONFIG.decimals // Number of decimals
    );

    console.log('✅ Token Mint Created!');
    console.log(`   Mint Address: ${mint.toBase58()}`);

    // Step 2: Create associated token account for platform wallet
    console.log('\n💼 Step 2: Creating Platform Token Account...');
    const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    console.log('✅ Platform Token Account Created!');
    console.log(`   Token Account: ${platformTokenAccount.address.toBase58()}`);

    // Step 3: Mint initial supply to platform wallet
    console.log('\n🪙  Step 3: Minting Initial Supply...');
    const initialSupplyLamports = TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals);

    const mintSignature = await mintTo(
      connection,
      payer,
      mint,
      platformTokenAccount.address,
      payer.publicKey, // Mint authority
      initialSupplyLamports
    );

    console.log('✅ Initial Supply Minted!');
    console.log(`   Amount: ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol}`);
    console.log(`   Transaction: ${mintSignature}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${mintSignature}${process.env.SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`);

    // Step 4: (Optional) Remove mint authority to make supply fixed
    // Uncomment if you want to make the token supply fixed (no more minting possible)
    /*
    console.log('\n🔒 Step 4: Removing Mint Authority (Making Supply Fixed)...');
    await setAuthority(
      connection,
      payer,
      mint,
      payer.publicKey, // Current authority
      AuthorityType.MintTokens,
      null // Set to null to remove mint authority
    );
    console.log('✅ Mint Authority Removed! Token supply is now fixed.');
    */

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TAKARA TOKEN CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 Token Details:');
    console.log(`   Name: ${TOKEN_CONFIG.name}`);
    console.log(`   Symbol: ${TOKEN_CONFIG.symbol}`);
    console.log(`   Decimals: ${TOKEN_CONFIG.decimals}`);
    console.log(`   Mint Address: ${mint.toBase58()}`);
    console.log(`   Platform Token Account: ${platformTokenAccount.address.toBase58()}`);
    console.log(`   Initial Supply: ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol}`);
    console.log(`   Network: ${process.env.SOLANA_NETWORK || 'devnet'}`);

    console.log('\n🔧 Next Steps:');
    console.log('   1. Add to .env:');
    console.log(`      TAKARA_TOKEN_MINT=${mint.toBase58()}`);
    console.log(`      TAKARA_TOKEN_ACCOUNT=${platformTokenAccount.address.toBase58()}`);
    console.log('   2. Restart backend server');
    console.log('   3. Test token distribution');
    console.log('   4. (Optional) Add token metadata with Metaplex Token Metadata program');
    console.log('\n📊 View Token:');
    console.log(`   Explorer: https://explorer.solana.com/address/${mint.toBase58()}${process.env.SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`);

    console.log('\n💾 Save these values to your .env file!');

    return {
      mintAddress: mint.toBase58(),
      tokenAccount: platformTokenAccount.address.toBase58(),
      initialSupply: TOKEN_CONFIG.initialSupply,
      decimals: TOKEN_CONFIG.decimals,
    };

  } catch (error) {
    console.error('\n❌ Error creating TAKARA token:', error);

    if (error.message.includes('Insufficient SOL balance')) {
      console.log('\n💡 Tip: Get SOL from:');
      console.log('   Devnet: solana airdrop 2 YOUR_WALLET --url devnet');
      console.log('   Mainnet: Buy SOL from an exchange');
    }

    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTakaraToken()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

export default createTakaraToken;
