/**
 * Takara DeFi Platform - Withdrawals Routes
 * API endpoints for requesting and managing withdrawals
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware.js';
import { withdrawalLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateWithdrawalCreation } from '../middleware/validation.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/withdrawals
 * Create a new withdrawal request
 * Requires authentication
 * Rate limited: 10 requests per minute
 * Validated: amount, currency, walletAddress
 */
router.post('/', authenticate, withdrawalLimiter, validateWithdrawalCreation, async (req, res) => {
  try {
    const { amount, currency, walletAddress } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!amount || !currency || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Amount, currency, and wallet address are required',
      });
    }

    // Validate currency
    if (!['TAKARA', 'USDT'].includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Currency must be either TAKARA or USDT',
      });
    }

    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal amount',
      });
    }

    // Get minimum withdrawal amounts from settings
    const minWithdrawalSetting = await prisma.platformSetting.findUnique({
      where: { key: currency === 'TAKARA' ? 'min_withdrawal_takara' : 'min_withdrawal_usdt' },
    });

    const minWithdrawal = minWithdrawalSetting ? parseFloat(minWithdrawalSetting.value) : 0;

    if (withdrawalAmount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        error: `Minimum withdrawal amount is ${minWithdrawal} ${currency}`,
      });
    }

    // Check if withdrawals are enabled
    const withdrawalsEnabled = await prisma.platformSetting.findUnique({
      where: { key: 'enable_withdrawals' },
    });

    if (withdrawalsEnabled && withdrawalsEnabled.value !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Withdrawals are currently disabled. Please try again later.',
      });
    }

    // Calculate available balance
    const investments = await prisma.investment.findMany({
      where: { userId },
      select: {
        takaraReward: true,
        takaraClaimed: true,
        usdtReward: true,
        usdtClaimed: true,
      },
    });

    let availableBalance = 0;
    if (currency === 'TAKARA') {
      availableBalance = investments.reduce(
        (sum, inv) => sum + (parseFloat(inv.takaraReward) - parseFloat(inv.takaraClaimed)),
        0
      );
    } else {
      availableBalance = investments.reduce(
        (sum, inv) => sum + (parseFloat(inv.usdtReward) - parseFloat(inv.usdtClaimed)),
        0
      );
    }

    if (withdrawalAmount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${availableBalance.toFixed(2)} ${currency}`,
      });
    }

    // Check for pending withdrawal requests
    const pendingWithdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        userId,
        currency,
        status: 'pending',
      },
    });

    if (pendingWithdrawal) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending withdrawal request. Please wait for it to be processed.',
      });
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: withdrawalAmount,
        currency,
        walletAddress,
        status: 'pending',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: withdrawal,
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create withdrawal request',
      message: error.message,
    });
  }
});

/**
 * GET /api/withdrawals
 * Get all withdrawal requests for authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const stats = {
      total: withdrawals.length,
      pending: withdrawals.filter(w => w.status === 'pending').length,
      processing: withdrawals.filter(w => w.status === 'processing').length,
      completed: withdrawals.filter(w => w.status === 'completed').length,
      rejected: withdrawals.filter(w => w.status === 'rejected').length,
      totalAmount: {
        TAKARA: withdrawals
          .filter(w => w.currency === 'TAKARA' && w.status === 'completed')
          .reduce((sum, w) => sum + parseFloat(w.amount), 0)
          .toFixed(2),
        USDT: withdrawals
          .filter(w => w.currency === 'USDT' && w.status === 'completed')
          .reduce((sum, w) => sum + parseFloat(w.amount), 0)
          .toFixed(2),
      },
    };

    res.json({
      success: true,
      count: withdrawals.length,
      statistics: stats,
      data: withdrawals,
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawals',
      message: error.message,
    });
  }
});

/**
 * GET /api/withdrawals/:id
 * Get specific withdrawal request details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found',
      });
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawal',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/withdrawals/:id
 * Cancel a pending withdrawal request
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found',
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending withdrawal requests can be cancelled',
      });
    }

    // Update status to cancelled
    await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        adminNotes: 'Cancelled by user',
      },
    });

    res.json({
      success: true,
      message: 'Withdrawal request cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling withdrawal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel withdrawal',
      message: error.message,
    });
  }
});

/**
 * GET /api/withdrawals/balance/available
 * Get available balance for withdrawals
 */
router.get('/balance/available', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const investments = await prisma.investment.findMany({
      where: { userId },
      select: {
        takaraReward: true,
        takaraClaimed: true,
        usdtReward: true,
        usdtClaimed: true,
      },
    });

    const takaraAvailable = investments.reduce(
      (sum, inv) => sum + (parseFloat(inv.takaraReward) - parseFloat(inv.takaraClaimed)),
      0
    );

    const usdtAvailable = investments.reduce(
      (sum, inv) => sum + (parseFloat(inv.usdtReward) - parseFloat(inv.usdtClaimed)),
      0
    );

    // Get minimum withdrawal amounts
    const [minTakara, minUsdt] = await Promise.all([
      prisma.platformSetting.findUnique({ where: { key: 'min_withdrawal_takara' } }),
      prisma.platformSetting.findUnique({ where: { key: 'min_withdrawal_usdt' } }),
    ]);

    res.json({
      success: true,
      data: {
        TAKARA: {
          available: takaraAvailable.toFixed(2),
          minimum: minTakara ? parseFloat(minTakara.value).toFixed(2) : '0.00',
          canWithdraw: takaraAvailable >= (minTakara ? parseFloat(minTakara.value) : 0),
        },
        USDT: {
          available: usdtAvailable.toFixed(2),
          minimum: minUsdt ? parseFloat(minUsdt.value).toFixed(2) : '0.00',
          canWithdraw: usdtAvailable >= (minUsdt ? parseFloat(minUsdt.value) : 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching available balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available balance',
      message: error.message,
    });
  }
});

export default router;
