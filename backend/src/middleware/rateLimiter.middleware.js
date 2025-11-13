/**
 * Takara DeFi Platform - Enhanced Rate Limiting Middleware
 * Different rate limits for different endpoint types
 */

import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints
 * Protects against brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please wait a minute before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
});

/**
 * Very strict rate limiter for admin login
 * Maximum protection for admin panel
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 attempts per minute
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Please wait 1 minute before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Moderate rate limiter for investment creation
 * Prevents spam but allows legitimate users
 */
export const investmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 investments per minute
  message: {
    success: false,
    error: 'Too many investment requests',
    message: 'Please wait before creating another investment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Moderate rate limiter for withdrawal requests
 */
export const withdrawalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 withdrawals per minute
  message: {
    success: false,
    error: 'Too many withdrawal requests',
    message: 'Please wait before submitting another withdrawal.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Liberal rate limiter for read-only endpoints (pools, public data)
 * Allows frequent reads for good UX
 */
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (1 per second)
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please slow down your requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Standard rate limiter for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin panel rate limiter (more generous for authenticated admins)
 */
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Higher limit for admin operations
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Admin rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Health check limiter (very liberal, just to prevent abuse)
 */
export const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 health checks per minute
  message: 'Health check rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * IP-based tracking for suspicious activity
 * This can be enhanced with Redis for distributed systems
 */
export const trackSuspiciousActivity = (req, res, next) => {
  // Get client IP
  const clientIp = req.ip || req.connection.remoteAddress;

  // Log suspicious patterns (can be enhanced with Redis)
  if (req.rateLimit && req.rateLimit.remaining === 0) {
    console.warn(`⚠️  Rate limit exceeded for IP: ${clientIp} on ${req.path}`);
    // TODO: In production, send alert to admin or security monitoring
  }

  next();
};

/**
 * Dynamic rate limiter based on user authentication
 * Authenticated users get higher limits
 */
export const dynamicLimiter = (authenticatedMax, unauthenticatedMax) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // If user is authenticated, give higher limit
      if (req.user) {
        return authenticatedMax;
      }
      return unauthenticatedMax;
    },
    message: {
      success: false,
      error: 'Rate limit exceeded',
      message: 'Please slow down or authenticate for higher limits.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Configuration for production environments
 * Stricter limits for production
 */
export const getProductionLimiters = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return {
      authLimit: 3, // Stricter in production
      investmentLimit: 5,
      withdrawalLimit: 5,
      apiLimit: 50,
    };
  }

  return {
    authLimit: 5,
    investmentLimit: 10,
    withdrawalLimit: 10,
    apiLimit: 100,
  };
};

export default {
  authLimiter,
  adminLoginLimiter,
  investmentLimiter,
  withdrawalLimiter,
  readLimiter,
  apiLimiter,
  adminApiLimiter,
  healthCheckLimiter,
  trackSuspiciousActivity,
  dynamicLimiter,
  getProductionLimiters,
};
