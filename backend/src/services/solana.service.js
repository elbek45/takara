import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * Solana Transaction Verification Service
 * Verifies USDT transfers on Solana blockchain
 */
class SolanaService {
  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
      'confirmed'
    );

    // USDT Token Mint Address (USDT SPL Token on Solana)
    // Mainnet: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
    // Devnet: (test token address or create your own)
    this.usdtMintAddress = process.env.USDT_MINT_ADDRESS || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

    // Platform wallet address (where users send USDT)
    if (process.env.PLATFORM_WALLET_PUBLIC_KEY) {
      this.platformWalletAddress = new PublicKey(process.env.PLATFORM_WALLET_PUBLIC_KEY);
    } else {
      console.warn('⚠️  PLATFORM_WALLET_PUBLIC_KEY not set in environment');
    }

    console.log('✅ Solana Service initialized');
    console.log('   Network:', process.env.SOLANA_RPC_URL ? 'Custom RPC' : 'Devnet');
    console.log('   Platform Wallet:', this.platformWalletAddress?.toBase58() || 'Not set');
    console.log('   USDT Mint:', this.usdtMintAddress);
  }

  /**
   * Verify a transaction signature exists and is confirmed
   * @param {string} signature - Transaction signature
   * @returns {Promise<Object>} Transaction details
   */
  async verifyTransaction(signature) {
    try {
      console.log('🔍 Verifying transaction:', signature);

      // Get transaction details
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        throw new Error('Transaction not found on blockchain');
      }

      // Check if transaction was successful
      if (transaction.meta.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(transaction.meta.err)}`);
      }

      console.log('✅ Transaction verified:', signature);
      return {
        signature,
        blockTime: transaction.blockTime,
        slot: transaction.slot,
        meta: transaction.meta,
        transaction: transaction.transaction,
      };
    } catch (error) {
      console.error('❌ Transaction verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify USDT transfer transaction
   * @param {string} signature - Transaction signature
   * @param {string} fromWallet - Sender wallet address
   * @param {string} toWallet - Recipient wallet address (platform wallet)
   * @param {number} expectedAmount - Expected USDT amount (in USDT, not lamports)
   * @returns {Promise<Object>} Verification result
   */
  async verifyUSDTTransfer(signature, fromWallet, toWallet, expectedAmount) {
    try {
      console.log('💰 Verifying USDT transfer:');
      console.log('   From:', fromWallet);
      console.log('   To:', toWallet);
      console.log('   Expected Amount:', expectedAmount, 'USDT');

      // Get and verify transaction exists
      const txData = await this.verifyTransaction(signature);

      // Parse transaction to find SPL token transfer
      const { transaction, meta } = txData;

      // Get pre and post token balances
      const preTokenBalances = meta.preTokenBalances || [];
      const postTokenBalances = meta.postTokenBalances || [];

      // Find USDT token transfers (USDT has 6 decimals)
      let transferFound = false;
      let actualAmount = 0;
      let fromAddress = null;
      let toAddress = null;

      // Check token balance changes
      for (let i = 0; i < postTokenBalances.length; i++) {
        const postBalance = postTokenBalances[i];
        const preBalance = preTokenBalances.find(
          (pre) => pre.accountIndex === postBalance.accountIndex
        );

        // Check if this is USDT token
        if (postBalance.mint === this.usdtMintAddress) {
          const preAmount = preBalance ? parseFloat(preBalance.uiTokenAmount.uiAmount) : 0;
          const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmount);
          const change = postAmount - preAmount;

          // Find the owner of this token account
          const accountKeys = transaction.message.staticAccountKeys ||
                             transaction.message.accountKeys;
          const owner = postBalance.owner;

          if (change > 0) {
            // This is the recipient
            toAddress = owner;
            actualAmount = change;
            transferFound = true;
          } else if (change < 0) {
            // This is the sender
            fromAddress = owner;
          }
        }
      }

      if (!transferFound) {
        throw new Error('USDT transfer not found in transaction');
      }

      // Verify sender
      if (fromAddress !== fromWallet) {
        throw new Error(
          `Sender mismatch: expected ${fromWallet}, got ${fromAddress}`
        );
      }

      // Verify recipient
      if (toAddress !== toWallet) {
        throw new Error(
          `Recipient mismatch: expected ${toWallet}, got ${toAddress}`
        );
      }

      // Verify amount (with small tolerance for rounding)
      const tolerance = 0.01; // 0.01 USDT tolerance
      if (Math.abs(actualAmount - expectedAmount) > tolerance) {
        throw new Error(
          `Amount mismatch: expected ${expectedAmount} USDT, got ${actualAmount} USDT`
        );
      }

      console.log('✅ USDT transfer verified successfully!');
      console.log('   From:', fromAddress);
      console.log('   To:', toAddress);
      console.log('   Amount:', actualAmount, 'USDT');

      return {
        verified: true,
        signature,
        from: fromAddress,
        to: toAddress,
        amount: actualAmount,
        blockTime: txData.blockTime,
        slot: txData.slot,
      };
    } catch (error) {
      console.error('❌ USDT transfer verification failed:', error);
      return {
        verified: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify SOL transfer transaction (for testing/development)
   * @param {string} signature - Transaction signature
   * @param {string} fromWallet - Sender wallet address
   * @param {string} toWallet - Recipient wallet address
   * @param {number} expectedAmount - Expected SOL amount
   * @returns {Promise<Object>} Verification result
   */
  async verifySOLTransfer(signature, fromWallet, toWallet, expectedAmount) {
    try {
      console.log('💎 Verifying SOL transfer:');
      console.log('   From:', fromWallet);
      console.log('   To:', toWallet);
      console.log('   Expected Amount:', expectedAmount, 'SOL');

      // Get and verify transaction exists
      const txData = await this.verifyTransaction(signature);
      const { transaction, meta } = txData;

      // Get account keys
      const accountKeys = transaction.message.staticAccountKeys ||
                         transaction.message.accountKeys;

      // Find sender and recipient indices
      const fromIndex = accountKeys.findIndex(
        (key) => key.toBase58() === fromWallet
      );
      const toIndex = accountKeys.findIndex(
        (key) => key.toBase58() === toWallet
      );

      if (fromIndex === -1 || toIndex === -1) {
        throw new Error('Sender or recipient not found in transaction');
      }

      // Get balance changes
      const preBalances = meta.preBalances;
      const postBalances = meta.postBalances;

      const fromPreBalance = preBalances[fromIndex];
      const fromPostBalance = postBalances[fromIndex];
      const toPreBalance = preBalances[toIndex];
      const toPostBalance = postBalances[toIndex];

      // Calculate transferred amount (in SOL)
      const sentAmount = (fromPreBalance - fromPostBalance) / 1e9; // lamports to SOL
      const receivedAmount = (toPostBalance - toPreBalance) / 1e9;

      // Verify amount (with tolerance for transaction fees)
      const tolerance = 0.001; // 0.001 SOL tolerance for fees
      if (Math.abs(receivedAmount - expectedAmount) > tolerance) {
        throw new Error(
          `Amount mismatch: expected ${expectedAmount} SOL, got ${receivedAmount} SOL`
        );
      }

      console.log('✅ SOL transfer verified successfully!');
      console.log('   Sent:', sentAmount, 'SOL (including fees)');
      console.log('   Received:', receivedAmount, 'SOL');

      return {
        verified: true,
        signature,
        from: fromWallet,
        to: toWallet,
        amount: receivedAmount,
        sentAmount,
        blockTime: txData.blockTime,
        slot: txData.slot,
      };
    } catch (error) {
      console.error('❌ SOL transfer verification failed:', error);
      return {
        verified: false,
        error: error.message,
      };
    }
  }

  /**
   * Get wallet SOL balance
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<number>} Balance in SOL
   */
  async getSOLBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      throw error;
    }
  }

  /**
   * Get wallet USDT balance
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<number>} Balance in USDT
   */
  async getUSDTBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: new PublicKey(this.usdtMintAddress) }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      // Sum up all USDT token accounts (usually just one)
      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
        totalBalance += amount;
      }

      return totalBalance;
    } catch (error) {
      console.error('Failed to get USDT balance:', error);
      throw error;
    }
  }

  /**
   * Check if transaction exists (simple check without full verification)
   * @param {string} signature - Transaction signature
   * @returns {Promise<boolean>}
   */
  async transactionExists(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status.value !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const solanaService = new SolanaService();
export default solanaService;
