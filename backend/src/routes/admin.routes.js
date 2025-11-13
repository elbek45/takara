/**
 * Takara DeFi Platform - Admin Routes
 * API endpoints for platform administration
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { adminLoginLimiter, adminApiLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  validateAdminLogin,
  validateWithdrawalProcessing,
  validatePoolActivation,
  validatePoolCompletion,
  validateStatusFilter,
} from '../middleware/validation.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Security configuration
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION) || 900000; // 15 minutes

/**
 * POST /api/admin/login
 * Admin login with username/password (no wallet required)
 * Uses bcrypt for password verification and implements account lockout
 * Rate limited: 3 attempts per minute
 * Validated: username, password
 */
router.post('/login', adminLoginLimiter, validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
      },
    });

    // Check if admin exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if account is locked
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((admin.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: `Too many failed login attempts. Account locked for ${remainingTime} more minutes.`,
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = admin.failedLoginAttempts + 1;
      const updateData = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account if max attempts reached
      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: updateData,
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: failedAttempts >= MAX_LOGIN_ATTEMPTS
          ? 'Account locked due to too many failed login attempts.'
          : `Invalid password. ${MAX_LOGIN_ATTEMPTS - failedAttempts} attempts remaining.`,
      });
    }

    // Reset failed login attempts and update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || req.connection.remoteAddress,
      },
    });

    // Generate JWT token with admin ID
    const token = jwt.sign(
      {
        adminId: admin.id,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message,
    });
  }
});

// Apply authentication and admin check to all routes EXCEPT login
router.use(authenticate);
router.use(requireAdmin);
router.use(adminApiLimiter); // Higher rate limit for authenticated admin operations

/**
 * GET /api/admin/dashboard
 * Get platform statistics for admin dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get platform statistics
    const [
      totalUsers,
      totalInvestments,
      totalPools,
      pendingWithdrawals,
      investments,
      pools,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.investment.count().catch(() => 0),
      prisma.pool.count().catch(() => 0),
      prisma.withdrawalRequest.count({ where: { status: 'pending' } }).catch(() => 0),
      prisma.investment.findMany({
        include: {
          pool: true,
          user: {
            select: {
              id: true,
              walletAddress: true,
              role: true,
            },
          },
        },
      }).catch(() => []),
      prisma.pool.findMany().catch(() => []),
    ]);

    // Calculate financial statistics (handle empty arrays)
    const totalInvested = (investments || []).reduce(
      (sum, inv) => sum + parseFloat(inv.amount || 0),
      0
    );

    const totalTakaraRewards = (investments || []).reduce(
      (sum, inv) => sum + parseFloat(inv.takaraReward || 0),
      0
    );

    const totalUsdtRewards = (investments || []).reduce(
      (sum, inv) => sum + parseFloat(inv.usdtReward || 0),
      0
    );

    const activeInvestments = (investments || []).filter(i => i.status === 'active').length;
    const pendingInvestments = (investments || []).filter(i => i.status === 'pending').length;

    // Pool statistics (handle empty arrays)
    const poolStats = (pools || []).map(pool => ({
      id: pool.id,
      name: pool.name,
      currentAmount: parseFloat(pool.currentAmount || 0),
      targetAmount: parseFloat(pool.targetAmount || 0),
      fillPercentage: pool.targetAmount > 0
        ? (parseFloat(pool.currentAmount) / parseFloat(pool.targetAmount) * 100).toFixed(2)
        : '0.00',
      status: pool.status,
      investmentCount: (investments || []).filter(i => i.poolId === pool.id).length,
    }));

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers || 0,
          totalInvestments: totalInvestments || 0,
          totalPools: totalPools || 0,
          activeInvestments,
          pendingInvestments,
          pendingWithdrawals: pendingWithdrawals || 0,
        },
        financial: {
          totalInvested: totalInvested.toFixed(2),
          totalTakaraRewards: totalTakaraRewards.toFixed(2),
          totalUsdtRewards: totalUsdtRewards.toFixed(2),
        },
        pools: poolStats,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with their statistics
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            investments: true,
            withdrawals: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get investment totals for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const investments = await prisma.investment.findMany({
          where: { userId: user.id },
        });

        const totalInvested = investments.reduce(
          (sum, inv) => sum + parseFloat(inv.amount),
          0
        );

        const totalTakaraEarned = investments.reduce(
          (sum, inv) => sum + parseFloat(inv.takaraReward),
          0
        );

        const totalUsdtEarned = investments.reduce(
          (sum, inv) => sum + parseFloat(inv.usdtReward),
          0
        );

        return {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          investmentCount: user._count.investments,
          withdrawalCount: user._count.withdrawals,
          totalInvested: totalInvested.toFixed(2),
          totalTakaraEarned: totalTakaraEarned.toFixed(2),
          totalUsdtEarned: totalUsdtEarned.toFixed(2),
        };
      })
    );

    res.json({
      success: true,
      count: usersWithStats.length,
      data: usersWithStats,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/withdrawals
 * Get all withdrawal requests
 * Validated: status filter (optional)
 */
router.get('/withdrawals', validateStatusFilter, async (req, res) => {
  try {
    const { status } = req.query;

    const whereClause = status ? { status } : {};

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      count: withdrawals.length,
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
 * PUT /api/admin/withdrawals/:id/process
 * Process a withdrawal request (approve or reject)
 * Validated: id, action, txSignature (if approve), adminNotes
 */
router.put('/withdrawals/:id/process', validateWithdrawalProcessing, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, txSignature, adminNotes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "approve" or "reject"',
      });
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found',
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Withdrawal is already ${withdrawal.status}`,
      });
    }

    if (action === 'approve' && !txSignature) {
      return res.status(400).json({
        success: false,
        error: 'Transaction signature required for approval',
      });
    }

    const updatedWithdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'completed' : 'rejected',
        txSignature: action === 'approve' ? txSignature : null,
        adminNotes: adminNotes || null,
        processedAt: new Date(),
      },
      include: {
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: updatedWithdrawal,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process withdrawal',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/pools
 * Get all pools with detailed statistics
 */
router.get('/pools', async (req, res) => {
  try {
    const pools = await prisma.pool.findMany({
      include: {
        _count: {
          select: {
            investments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const poolsWithStats = pools.map(pool => ({
      ...pool,
      currentAmount: parseFloat(pool.currentAmount),
      targetAmount: parseFloat(pool.targetAmount),
      fillPercentage: (parseFloat(pool.currentAmount) / parseFloat(pool.targetAmount) * 100).toFixed(2),
      remainingAmount: (parseFloat(pool.targetAmount) - parseFloat(pool.currentAmount)).toFixed(2),
      investmentCount: pool._count.investments,
    }));

    res.json({
      success: true,
      count: poolsWithStats.length,
      data: poolsWithStats,
    });
  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pools',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/pools/:id/activate
 * Manually activate a pool
 * Validated: id (UUID)
 */
router.put('/pools/:id/activate', validatePoolActivation, async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await prisma.pool.findUnique({
      where: { id },
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    if (pool.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Pool is already active',
      });
    }

    // Activate pool and all pending investments
    await prisma.$transaction(async (tx) => {
      await tx.pool.update({
        where: { id },
        data: {
          status: 'active',
          startDate: new Date(),
        },
      });

      await tx.investment.updateMany({
        where: {
          poolId: id,
          status: 'pending',
        },
        data: {
          status: 'active',
        },
      });
    });

    const updatedPool = await prisma.pool.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            investments: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Pool activated successfully',
      data: updatedPool,
    });
  } catch (error) {
    console.error('Error activating pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate pool',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/pools/:id/complete
 * Mark a pool as completed
 * Validated: id (UUID)
 */
router.put('/pools/:id/complete', validatePoolCompletion, async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await prisma.pool.findUnique({
      where: { id },
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    if (pool.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Pool is already completed',
      });
    }

    // Complete pool and all active investments
    await prisma.$transaction(async (tx) => {
      await tx.pool.update({
        where: { id },
        data: {
          status: 'completed',
          endDate: new Date(),
        },
      });

      await tx.investment.updateMany({
        where: {
          poolId: id,
          status: 'active',
        },
        data: {
          status: 'completed',
        },
      });
    });

    const updatedPool = await prisma.pool.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Pool completed successfully',
      data: updatedPool,
    });
  } catch (error) {
    console.error('Error completing pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete pool',
      message: error.message,
    });
  }
});

export default router;
