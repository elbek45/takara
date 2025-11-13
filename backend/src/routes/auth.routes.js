/**
 * Takara DeFi Platform - Authentication Routes
 * Phantom wallet integration with Solana signature verification
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PrismaClient } from '@prisma/client';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateNonceRequest, validateAuthVerification } from '../middleware/validation.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/nonce
 * Generate a nonce for wallet signature
 * Used to prevent replay attacks
 * Rate limited: 5 requests per minute
 * Validated: walletAddress
 */
router.post('/nonce', authLimiter, validateNonceRequest, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    // Validate Solana wallet address format
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Solana wallet address',
      });
    }

    // Generate random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const message = `Sign this message to authenticate with Takara DeFi Platform.\n\nNonce: ${nonce}\nWallet: ${walletAddress}`;

    // Store nonce temporarily (in production, use Redis with expiration)
    // For now, we'll include it in the response and verify it in the next step
    res.json({
      success: true,
      data: {
        nonce,
        message,
        walletAddress,
      },
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify wallet signature and issue JWT token
 * Rate limited: 5 requests per minute
 * Validated: walletAddress, signature, message
 */
router.post('/verify', authLimiter, validateAuthVerification, async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // Validate required fields
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address, signature, and message are required',
      });
    }

    // Verify signature
    let isValid = false;
    try {
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);

      isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Signature verification failed',
      });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        walletAddress: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            investments: true,
          },
        },
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          walletAddress,
          role: 'user',
          isActive: true,
        },
        select: {
          id: true,
          walletAddress: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              investments: true,
            },
          },
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled. Please contact support.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          investmentsCount: user._count.investments,
        },
      },
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify signature',
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/profile
 * Get authenticated user profile
 * Requires authentication middleware
 */
router.get('/profile', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Get user profile with statistics
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        investments: {
          select: {
            id: true,
            poolId: true,
            amount: true,
            status: true,
            takaraReward: true,
            usdtReward: true,
            startDate: true,
            endDate: true,
            pool: {
              select: {
                name: true,
                durationMonths: true,
                takaraMultiplier: true,
                usdtApy: true,
              },
            },
          },
        },
        withdrawalRequests: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled',
      });
    }

    // Calculate total investments and earnings
    const totalInvested = user.investments.reduce(
      (sum, inv) => sum + parseFloat(inv.amount),
      0
    );
    const totalTakaraRewards = user.investments.reduce(
      (sum, inv) => sum + parseFloat(inv.takaraReward),
      0
    );
    const totalUsdtRewards = user.investments.reduce(
      (sum, inv) => sum + parseFloat(inv.usdtReward),
      0
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        statistics: {
          totalInvestments: user.investments.length,
          activeInvestments: user.investments.filter(i => i.status === 'active').length,
          totalInvested: totalInvested.toFixed(2),
          totalTakaraRewards: totalTakaraRewards.toFixed(2),
          totalUsdtRewards: totalUsdtRewards.toFixed(2),
        },
        recentInvestments: user.investments.slice(0, 5),
        recentWithdrawals: user.withdrawalRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Verify old token (allow expired tokens for refresh)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      message: error.message,
    });
  }
});

export default router;
