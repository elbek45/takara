/**
 * Takara DeFi Platform - Main Server Entry Point
 * Express.js REST API Server with Solana blockchain integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { apiLimiter, healthCheckLimiter, trackSuspiciousActivity } from './middleware/rateLimiter.middleware.js';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// Security & Performance Middleware
// ========================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiting - Enhanced with endpoint-specific limits
app.use('/api/', apiLimiter);
app.use(trackSuspiciousActivity); // Track and log suspicious activity

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ========================================
// Health Check Routes
// ========================================

// Basic health check (with rate limit to prevent abuse)
app.get('/health', healthCheckLimiter, (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ========================================
// API Routes
// ========================================

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: '宝 Takara DeFi Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      healthDb: '/health/db',
      api: '/api',
      pools: '/api/pools',
      auth: {
        nonce: 'POST /api/auth/nonce',
        verify: 'POST /api/auth/verify',
        profile: 'GET /api/auth/profile',
        refresh: 'POST /api/auth/refresh',
      },
      investments: {
        create: 'POST /api/investments',
        list: 'GET /api/investments',
        details: 'GET /api/investments/:id',
        earnings: 'GET /api/investments/:id/earnings',
      },
      withdrawals: {
        create: 'POST /api/withdrawals',
        list: 'GET /api/withdrawals',
        details: 'GET /api/withdrawals/:id',
        cancel: 'DELETE /api/withdrawals/:id',
        balance: 'GET /api/withdrawals/balance/available',
      },
      admin: '/api/admin (coming soon)',
    },
  });
});

// Import routes
import poolsRoutes from './routes/pools.routes.js';
import authRoutes from './routes/auth.routes.js';
import investmentsRoutes from './routes/investments.routes.js';
import withdrawalsRoutes from './routes/withdrawals.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Import services
import cronService from './services/cron.service.js';

// Mount routes
app.use('/api/pools', poolsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentsRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/admin', adminRoutes);

// ========================================
// Error Handling Middleware
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'development' ? err.name : 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// Server Initialization
// ========================================

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Stop cron jobs
    cronService.stop();
    console.log('✅ Cron service stopped');

    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected');

    // Close server
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Takara DeFi Platform API Server');
  console.log('='.repeat(50));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${prisma ? 'Connected' : 'Disconnected'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
  console.log('='.repeat(50) + '\n');

  // Start cron jobs
  cronService.start();
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

export default app;
