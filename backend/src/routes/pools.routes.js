/**
 * Takara DeFi Platform - Pools Routes
 * API endpoints для работы с инвестиционными пулами
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { readLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/pools
 * Получить список всех активных пулов
 * Rate limited: 60 requests per minute (read-only)
 */
router.get('/', readLimiter, async (req, res) => {
  try {
    const pools = await prisma.pool.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        durationMonths: 'asc',
      },
      select: {
        id: true,
        name: true,
        durationMonths: true,
        takaraMultiplier: true,
        usdtApy: true,
        minInvestment: true,
        maxInvestment: true,
        targetAmount: true,
        currentAmount: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    // Добавляем процент заполнения пула
    const poolsWithProgress = pools.map(pool => ({
      ...pool,
      fillPercentage: ((parseFloat(pool.currentAmount) / parseFloat(pool.targetAmount)) * 100).toFixed(2),
      remainingAmount: (parseFloat(pool.targetAmount) - parseFloat(pool.currentAmount)).toFixed(2),
    }));

    res.json({
      success: true,
      count: pools.length,
      data: poolsWithProgress,
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
 * GET /api/pools/:id
 * Получить детальную информацию о конкретном пуле
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await prisma.pool.findUnique({
      where: { id },
      include: {
        investments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    // Статистика пула
    const stats = {
      totalInvestments: pool.investments.length,
      activeInvestments: pool.investments.filter(i => i.status === 'active').length,
      fillPercentage: ((parseFloat(pool.currentAmount) / parseFloat(pool.targetAmount)) * 100).toFixed(2),
      remainingAmount: (parseFloat(pool.targetAmount) - parseFloat(pool.currentAmount)).toFixed(2),
    };

    res.json({
      success: true,
      data: {
        ...pool,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pool',
      message: error.message,
    });
  }
});

/**
 * GET /api/pools/:id/stats
 * Получить статистику по пулу
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем существование пула
    const pool = await prisma.pool.findUnique({
      where: { id },
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    // Получаем статистику инвестиций
    const investments = await prisma.investment.findMany({
      where: { poolId: id },
      select: {
        amount: true,
        status: true,
        takaraReward: true,
        usdtReward: true,
        createdAt: true,
      },
    });

    const stats = {
      totalInvestments: investments.length,
      totalAmount: investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0).toFixed(2),
      activeInvestments: investments.filter(i => i.status === 'active').length,
      completedInvestments: investments.filter(i => i.status === 'completed').length,
      totalTakaraRewards: investments.reduce((sum, inv) => sum + parseFloat(inv.takaraReward), 0).toFixed(2),
      totalUsdtRewards: investments.reduce((sum, inv) => sum + parseFloat(inv.usdtReward), 0).toFixed(2),
      fillPercentage: ((parseFloat(pool.currentAmount) / parseFloat(pool.targetAmount)) * 100).toFixed(2),
      canActivate: parseFloat(pool.currentAmount) >= parseFloat(pool.targetAmount),
    };

    res.json({
      success: true,
      poolId: id,
      poolName: pool.name,
      stats,
    });
  } catch (error) {
    console.error('Error fetching pool stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pool statistics',
      message: error.message,
    });
  }
});

export default router;
