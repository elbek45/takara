/**
 * Generate a new Solana wallet keypair for testing
 * This will create a new wallet and display its public key and private key
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

console.log('🔑 Generating new Solana wallet keypair...\n');

// Generate new keypair
const keypair = Keypair.generate();

// Get public key
const publicKey = keypair.publicKey.toBase58();

// Get private key in base58 format (for .env)
const privateKey = bs58.encode(keypair.secretKey);

console.log('✅ Wallet generated successfully!\n');
console.log('='.repeat(60));
console.log('📋 Wallet Details:');
console.log('='.repeat(60));
console.log(`Public Key:  ${publicKey}`);
console.log(`Private Key: ${privateKey}`);
console.log('='.repeat(60));

console.log('\n⚠️  IMPORTANT:');
console.log('1. Save these keys securely!');
console.log('2. Add the private key to your .env file:');
console.log(`   PLATFORM_WALLET_PRIVATE_KEY=${privateKey}`);
console.log('\n3. Get devnet SOL for this wallet:');
console.log(`   Visit: https://faucet.solana.com/`);
console.log(`   Or use: curl -X POST https://api.devnet.solana.com -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"requestAirdrop","params":["${publicKey}",2000000000]}'`);
console.log('\n4. Update .env with devnet configuration:');
console.log('   SOLANA_NETWORK=devnet');
console.log('   SOLANA_RPC_URL=https://api.devnet.solana.com');
console.log('\n⚠️  This is a TEST wallet for devnet only!');
console.log('    Do NOT use for mainnet or real funds!\n');
