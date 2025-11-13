import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';

/**
 * TAKARA Token Distribution Service
 * Handles distribution of TAKARA rewards to users
 */
class TokenService {
  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
      'confirmed'
    );

    // Load platform wallet keypair
    if (process.env.PLATFORM_WALLET_PRIVATE_KEY) {
      try {
        const privateKeyArray = bs58.decode(process.env.PLATFORM_WALLET_PRIVATE_KEY);
        this.platformWallet = Keypair.fromSecretKey(privateKeyArray);
        console.log('✅ Token Service initialized with wallet:', this.platformWallet.publicKey.toBase58());
      } catch (error) {
        console.error('Failed to load platform wallet:', error);
        this.platformWallet = null;
      }
    } else {
      console.warn('⚠️  PLATFORM_WALLET_PRIVATE_KEY not set');
      this.platformWallet = null;
    }

    // TAKARA token configuration
    this.takaraTokenMint = process.env.TAKARA_TOKEN_MINT
      ? new PublicKey(process.env.TAKARA_TOKEN_MINT)
      : null;

    this.takaraTokenAccount = process.env.TAKARA_TOKEN_ACCOUNT
      ? new PublicKey(process.env.TAKARA_TOKEN_ACCOUNT)
      : null;

    if (!this.takaraTokenMint) {
      console.warn('⚠️  TAKARA_TOKEN_MINT not set. Run create-takara-token.js first!');
    }

    console.log('   TAKARA Token Mint:', this.takaraTokenMint?.toBase58() || 'Not set');
    console.log('   Network:', process.env.SOLANA_RPC_URL ? 'Custom RPC' : 'Devnet');
  }

  /**
   * Send TAKARA tokens to a user
   * @param {string} recipientWallet - User's wallet address
   * @param {number} amount - Amount of TAKARA tokens (in TAKARA, not lamports)
   * @returns {Promise<Object>} Transaction details
   */
  async sendTakaraReward(recipientWallet, amount) {
    try {
      if (!this.platformWallet) {
        throw new Error('Platform wallet not configured');
      }

      if (!this.takaraTokenMint) {
        throw new Error('TAKARA token not configured. Run create-takara-token.js first!');
      }

      console.log(`💰 Sending ${amount} TAKARA to ${recipientWallet}...`);

      // Get or create recipient's token account
      const recipientPublicKey = new PublicKey(recipientWallet);
      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.platformWallet, // Payer
        this.takaraTokenMint, // Token mint
        recipientPublicKey // Owner
      );

      console.log('   Recipient Token Account:', recipientTokenAccount.address.toBase58());

      // Convert amount to token lamports (TAKARA has 6 decimals)
      const decimals = 6;
      const amountLamports = amount * Math.pow(10, decimals);

      // Transfer tokens from platform account to user
      const signature = await transfer(
        this.connection,
        this.platformWallet, // Payer
        this.takaraTokenAccount, // Source account
        recipientTokenAccount.address, // Destination account
        this.platformWallet.publicKey, // Owner of source account
        amountLamports // Amount in token lamports
      );

      console.log('✅ TAKARA transfer successful!');
      console.log('   Amount:', amount, 'TAKARA');
      console.log('   Transaction:', signature);

      return {
        success: true,
        signature,
        amount,
        recipient: recipientWallet,
        recipientTokenAccount: recipientTokenAccount.address.toBase58(),
      };

    } catch (error) {
      console.error('❌ Failed to send TAKARA tokens:', error);
      throw error;
    }
  }

  /**
   * Batch send TAKARA tokens to multiple users
   * @param {Array} recipients - Array of {wallet, amount} objects
   * @returns {Promise<Array>} Array of transaction results
   */
  async batchSendTakaraRewards(recipients) {
    console.log(`📦 Batch sending TAKARA to ${recipients.length} users...`);

    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendTakaraReward(recipient.wallet, recipient.amount);
        results.push({
          wallet: recipient.wallet,
          amount: recipient.amount,
          success: true,
          signature: result.signature,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to send to ${recipient.wallet}:`, error.message);
        results.push({
          wallet: recipient.wallet,
          amount: recipient.amount,
          success: false,
          error: error.message,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Batch complete: ${successful} successful, ${failed} failed`);

    return results;
  }

  /**
   * Get TAKARA token balance for a wallet
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<number>} Balance in TAKARA tokens
   */
  async getTakaraBalance(walletAddress) {
    try {
      if (!this.takaraTokenMint) {
        throw new Error('TAKARA token not configured');
      }

      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: this.takaraTokenMint }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      // Sum up all token accounts (usually just one)
      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
        totalBalance += balance;
      }

      return totalBalance;

    } catch (error) {
      console.error('Failed to get TAKARA balance:', error);
      throw error;
    }
  }

  /**
   * Get platform's TAKARA token balance
   * @returns {Promise<number>} Balance in TAKARA tokens
   */
  async getPlatformTakaraBalance() {
    try {
      if (!this.takaraTokenAccount) {
        throw new Error('Platform token account not configured');
      }

      const accountInfo = await getAccount(this.connection, this.takaraTokenAccount);
      const balance = Number(accountInfo.amount) / Math.pow(10, 6); // 6 decimals

      return balance;

    } catch (error) {
      console.error('Failed to get platform TAKARA balance:', error);
      throw error;
    }
  }

  /**
   * Verify TAKARA token transfer transaction
   * @param {string} signature - Transaction signature
   * @param {string} recipient - Expected recipient wallet
   * @param {number} expectedAmount - Expected amount in TAKARA
   * @returns {Promise<Object>} Verification result
   */
  async verifyTakaraTransfer(signature, recipient, expectedAmount) {
    try {
      if (!this.takaraTokenMint) {
        throw new Error('TAKARA token not configured');
      }

      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return {
          verified: false,
          error: 'Transaction not found',
        };
      }

      if (tx.meta.err) {
        return {
          verified: false,
          error: 'Transaction failed',
        };
      }

      // Parse token transfers from transaction
      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];

      let transferFound = false;
      let actualAmount = 0;
      let actualRecipient = null;

      // Find TAKARA token transfer
      for (const postBalance of postTokenBalances) {
        if (postBalance.mint === this.takaraTokenMint.toBase58()) {
          const preBalance = preTokenBalances.find(
            (pre) => pre.accountIndex === postBalance.accountIndex
          );

          const preAmount = preBalance ? parseFloat(preBalance.uiTokenAmount.uiAmount) : 0;
          const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmount);
          const change = postAmount - preAmount;

          if (change > 0) {
            // This is the recipient
            actualRecipient = postBalance.owner;
            actualAmount = change;
            transferFound = true;
            break;
          }
        }
      }

      if (!transferFound) {
        return {
          verified: false,
          error: 'TAKARA transfer not found in transaction',
        };
      }

      // Verify recipient
      if (actualRecipient !== recipient) {
        return {
          verified: false,
          error: `Recipient mismatch: expected ${recipient}, got ${actualRecipient}`,
        };
      }

      // Verify amount (with small tolerance)
      const tolerance = 0.01;
      if (Math.abs(actualAmount - expectedAmount) > tolerance) {
        return {
          verified: false,
          error: `Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`,
        };
      }

      return {
        verified: true,
        signature,
        recipient: actualRecipient,
        amount: actualAmount,
        blockTime: tx.blockTime,
      };

    } catch (error) {
      console.error('Failed to verify TAKARA transfer:', error);
      return {
        verified: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
const tokenService = new TokenService();
export default tokenService;
