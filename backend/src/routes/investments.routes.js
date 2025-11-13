/**
 * Takara DeFi Platform - Investments Routes
 * API endpoints for creating and managing user investments
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware.js';
import { investmentLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateInvestmentCreation, validateUUIDParam } from '../middleware/validation.middleware.js';
import nftService from '../services/nft.service.js';
import solanaService from '../services/solana.service.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/investments
 * Create a new investment
 * Requires authentication
 * Rate limited: 10 requests per minute
 * Validated: poolId, amount, walletAddress, txSignature
 */
router.post('/', authenticate, investmentLimiter, validateInvestmentCreation, async (req, res) => {
  try {
    const { poolId, amount, txSignature, walletAddress } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!poolId || !amount || !txSignature || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Pool ID, amount, transaction signature, and wallet address are required',
      });
    }

    // Validate amount
    const investmentAmount = parseFloat(amount);
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid investment amount',
      });
    }

    // Get pool details
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    // Validate pool is active and accepting investments
    if (!pool.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This pool is not active',
      });
    }

    if (pool.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'This pool is already active and not accepting new investments',
      });
    }

    if (pool.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'This pool has been completed',
      });
    }

    // Validate investment amount is within pool limits
    if (investmentAmount < parseFloat(pool.minInvestment)) {
      return res.status(400).json({
        success: false,
        error: `Minimum investment amount is ${pool.minInvestment} USDT`,
      });
    }

    if (pool.maxInvestment && investmentAmount > parseFloat(pool.maxInvestment)) {
      return res.status(400).json({
        success: false,
        error: `Maximum investment amount is ${pool.maxInvestment} USDT`,
      });
    }

    // Check if pool has space for this investment
    const currentAmount = parseFloat(pool.currentAmount);
    const targetAmount = parseFloat(pool.targetAmount);
    const remainingSpace = targetAmount - currentAmount;

    if (investmentAmount > remainingSpace) {
      return res.status(400).json({
        success: false,
        error: `Pool only has ${remainingSpace.toFixed(2)} USDT remaining capacity`,
      });
    }

    // Verify Solana transaction signature
    // Development mode: Skip verification if SKIP_TX_VERIFICATION is set
    if (!process.env.SKIP_TX_VERIFICATION || process.env.SKIP_TX_VERIFICATION !== 'true') {
      console.log('🔍 Verifying USDT transaction on Solana blockchain...');

      // Get platform wallet address from environment
      const platformWallet = process.env.PLATFORM_WALLET_PUBLIC_KEY;
      if (!platformWallet) {
        return res.status(500).json({
          success: false,
          error: 'Platform wallet not configured',
        });
      }

      // Verify USDT transfer
      const verification = await solanaService.verifyUSDTTransfer(
        txSignature,
        walletAddress,
        platformWallet,
        investmentAmount
      );

      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          error: `Transaction verification failed: ${verification.error}`,
        });
      }

      console.log('✅ USDT transaction verified successfully');
    } else {
      console.log('⚠️  SKIP_TX_VERIFICATION is enabled - skipping blockchain verification');
    }

    // Check if transaction signature already used
    const existingTransaction = await prisma.transaction.findUnique({
      where: { txSignature },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        error: 'This transaction has already been processed',
      });
    }

    // Calculate investment end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + pool.durationMonths);

    // Calculate estimated rewards
    const takaraReward = investmentAmount * parseFloat(pool.takaraMultiplier);
    const monthlyUsdtReward = (investmentAmount * parseFloat(pool.usdtApy) / 100) / 12;
    const totalUsdtReward = monthlyUsdtReward * pool.durationMonths;

    // Create investment and transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create investment
      const investment = await tx.investment.create({
        data: {
          userId,
          poolId,
          amount: investmentAmount,
          status: 'pending',
          takaraReward,
          usdtReward: 0, // Will be accumulated monthly
          startDate,
          endDate,
        },
        include: {
          pool: {
            select: {
              name: true,
              durationMonths: true,
              takaraMultiplier: true,
              usdtApy: true,
            },
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          txSignature,
          txType: 'deposit',
          amount: investmentAmount,
          currency: 'USDT',
          status: 'confirmed',
        },
      });

      // Update pool current amount
      await tx.pool.update({
        where: { id: poolId },
        data: {
          currentAmount: {
            increment: investmentAmount,
          },
        },
      });

      // Check if pool target is reached and activate pool
      const updatedPool = await tx.pool.findUnique({
        where: { id: poolId },
      });

      if (parseFloat(updatedPool.currentAmount) >= parseFloat(updatedPool.targetAmount)) {
        await tx.pool.update({
          where: { id: poolId },
          data: {
            status: 'active',
            startDate: new Date(),
          },
        });

        // Update all pending investments in this pool to active
        await tx.investment.updateMany({
          where: {
            poolId,
            status: 'pending',
          },
          data: {
            status: 'active',
          },
        });
      }

      return investment;
    });

    // Mint NFT Wexel Miner for the investment
    let nftData = null;
    try {
      console.log('🎨 Starting NFT minting for investment:', result.id);

      nftData = await nftService.mintWexelNFT({
        userWalletAddress: walletAddress,
        investmentData: {
          id: result.id,
          poolName: result.pool.name,
          amount: investmentAmount,
          duration: result.pool.durationMonths,
          takaraMultiplier: result.pool.takaraMultiplier,
        },
      });

      // Save NFT data to database
      await prisma.nftMiner.create({
        data: {
          investmentId: result.id,
          mintAddress: nftData.mintAddress,
          imageUrl: nftData.imageUrl,
          metadata: nftData.metadata,
        },
      });

      console.log('✅ NFT minted and saved:', nftData.mintAddress);
    } catch (nftError) {
      console.error('⚠️  NFT minting failed (investment still created):', nftError);
      // Don't fail the investment creation if NFT minting fails
      // Admin can mint NFT manually later
    }

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: {
        investment: result,
        nft: nftData ? {
          mintAddress: nftData.mintAddress,
          imageUrl: nftData.imageUrl,
          metadataUri: nftData.metadataUri,
        } : null,
        estimatedRewards: {
          takaraTokens: takaraReward.toFixed(2),
          totalUsdtRewards: totalUsdtReward.toFixed(2),
          monthlyUsdtReward: monthlyUsdtReward.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create investment',
      message: error.message,
    });
  }
});

/**
 * GET /api/investments
 * Get all investments for authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const investments = await prisma.investment.findMany({
      where: whereClause,
      include: {
        pool: {
          select: {
            name: true,
            durationMonths: true,
            takaraMultiplier: true,
            usdtApy: true,
            status: true,
          },
        },
        nftMiner: {
          select: {
            id: true,
            mintAddress: true,
            imageUrl: true,
            metadata: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const totalInvested = investments.reduce(
      (sum, inv) => sum + parseFloat(inv.amount),
      0
    );
    const totalTakaraRewards = investments.reduce(
      (sum, inv) => sum + parseFloat(inv.takaraReward),
      0
    );
    const totalUsdtRewards = investments.reduce(
      (sum, inv) => sum + parseFloat(inv.usdtReward),
      0
    );

    res.json({
      success: true,
      count: investments.length,
      statistics: {
        totalInvested: totalInvested.toFixed(2),
        totalTakaraRewards: totalTakaraRewards.toFixed(2),
        totalUsdtRewards: totalUsdtRewards.toFixed(2),
        activeInvestments: investments.filter(i => i.status === 'active').length,
        pendingInvestments: investments.filter(i => i.status === 'pending').length,
        completedInvestments: investments.filter(i => i.status === 'completed').length,
      },
      data: investments,
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investments',
      message: error.message,
    });
  }
});

/**
 * GET /api/investments/:id
 * Get specific investment details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const investment = await prisma.investment.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        pool: true,
        nftMiner: {
          include: {
            metadata: true,
          },
        },
        takaraEarnings: {
          orderBy: {
            distributionDate: 'desc',
          },
        },
        usdtEarnings: {
          orderBy: {
            distributionDate: 'desc',
          },
        },
      },
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found',
      });
    }

    // Calculate progress
    const now = new Date();
    const totalDuration = investment.endDate - investment.startDate;
    const elapsed = now - investment.startDate;
    const progress = Math.min((elapsed / totalDuration) * 100, 100);

    // Calculate expected monthly USDT rewards
    const monthlyReward = (parseFloat(investment.amount) * parseFloat(investment.pool.usdtApy) / 100) / 12;
    const monthsElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24 * 30));
    const expectedUsdtRewards = monthlyReward * monthsElapsed;

    res.json({
      success: true,
      data: {
        ...investment,
        progress: {
          percentage: progress.toFixed(2),
          monthsElapsed,
          totalMonths: investment.pool.durationMonths,
          daysRemaining: Math.max(0, Math.ceil((investment.endDate - now) / (1000 * 60 * 60 * 24))),
        },
        rewards: {
          takaraTokens: {
            total: parseFloat(investment.takaraReward).toFixed(2),
            claimed: parseFloat(investment.takaraClaimed).toFixed(2),
            available: (parseFloat(investment.takaraReward) - parseFloat(investment.takaraClaimed)).toFixed(2),
          },
          usdtRewards: {
            monthlyExpected: monthlyReward.toFixed(2),
            totalExpected: expectedUsdtRewards.toFixed(2),
            earned: parseFloat(investment.usdtReward).toFixed(2),
            claimed: parseFloat(investment.usdtClaimed).toFixed(2),
            available: (parseFloat(investment.usdtReward) - parseFloat(investment.usdtClaimed)).toFixed(2),
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investment',
      message: error.message,
    });
  }
});

/**
 * GET /api/investments/:id/earnings
 * Get earnings history for an investment
 */
router.get('/:id/earnings', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify investment belongs to user
    const investment = await prisma.investment.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found',
      });
    }

    // Get earnings
    const [takaraEarnings, usdtEarnings] = await Promise.all([
      prisma.takaraEarning.findMany({
        where: { investmentId: id },
        orderBy: { distributionDate: 'desc' },
      }),
      prisma.usdtEarning.findMany({
        where: { investmentId: id },
        orderBy: { distributionDate: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        takara: takaraEarnings,
        usdt: usdtEarnings,
        summary: {
          totalTakaraEarnings: takaraEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2),
          totalUsdtEarnings: usdtEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2),
          takaraDistributions: takaraEarnings.length,
          usdtDistributions: usdtEarnings.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings',
      message: error.message,
    });
  }
});

export default router;
