/**
 * Takara DeFi Platform - Validation Middleware
 * Input validation for all API endpoints
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// ========================================
// Solana Wallet Validation
// ========================================

export const validateSolanaAddress = (fieldName = 'walletAddress') => {
  return body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isLength({ min: 32, max: 44 })
    .withMessage(`${fieldName} must be a valid Solana address (32-44 characters)`)
    .matches(/^[1-9A-HJ-NP-Za-km-z]+$/)
    .withMessage(`${fieldName} must contain only base58 characters`);
};

export const validateTransactionSignature = (fieldName = 'txSignature') => {
  return body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isLength({ min: 87, max: 88 })
    .withMessage(`${fieldName} must be a valid Solana transaction signature`)
    .matches(/^[1-9A-HJ-NP-Za-km-z]+$/)
    .withMessage(`${fieldName} must contain only base58 characters`);
};

// ========================================
// Investment Validation
// ========================================

export const validateInvestmentCreation = [
  body('poolId')
    .trim()
    .notEmpty()
    .withMessage('Pool ID is required')
    .isUUID()
    .withMessage('Pool ID must be a valid UUID'),

  body('amount')
    .notEmpty()
    .withMessage('Investment amount is required')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Amount must be between 1 and 1,000,000 USDT')
    .custom((value) => {
      // Check if it's a valid number with max 2 decimal places
      const regex = /^\d+(\.\d{1,2})?$/;
      if (!regex.test(value.toString())) {
        throw new Error('Amount must have maximum 2 decimal places');
      }
      return true;
    }),

  validateSolanaAddress('walletAddress'),
  validateTransactionSignature('txSignature'),

  handleValidationErrors,
];

// ========================================
// Withdrawal Validation
// ========================================

export const validateWithdrawalCreation = [
  body('amount')
    .notEmpty()
    .withMessage('Withdrawal amount is required')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Amount must be between 1 and 1,000,000')
    .custom((value) => {
      const regex = /^\d+(\.\d{1,2})?$/;
      if (!regex.test(value.toString())) {
        throw new Error('Amount must have maximum 2 decimal places');
      }
      return true;
    }),

  body('currency')
    .trim()
    .notEmpty()
    .withMessage('Currency is required')
    .isIn(['USDT', 'TAKARA'])
    .withMessage('Currency must be either USDT or TAKARA'),

  validateSolanaAddress('walletAddress'),

  handleValidationErrors,
];

export const validateWithdrawalProcessing = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Withdrawal ID is required')
    .isUUID()
    .withMessage('Withdrawal ID must be a valid UUID'),

  body('action')
    .trim()
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either "approve" or "reject"'),

  body('txSignature')
    .if(body('action').equals('approve'))
    .trim()
    .notEmpty()
    .withMessage('Transaction signature is required for approval')
    .isLength({ min: 87, max: 88 })
    .withMessage('Transaction signature must be valid'),

  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes must be maximum 500 characters'),

  handleValidationErrors,
];

// ========================================
// Authentication Validation
// ========================================

export const validateNonceRequest = [
  validateSolanaAddress('walletAddress'),
  handleValidationErrors,
];

export const validateAuthVerification = [
  validateSolanaAddress('walletAddress'),

  body('signature')
    .trim()
    .notEmpty()
    .withMessage('Signature is required')
    .isLength({ min: 87, max: 88 })
    .withMessage('Signature must be a valid base58 string'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),

  handleValidationErrors,
];

// ========================================
// Admin Validation
// ========================================

export const validateAdminLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  handleValidationErrors,
];

export const validatePoolActivation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Pool ID is required')
    .isUUID()
    .withMessage('Pool ID must be a valid UUID'),

  handleValidationErrors,
];

export const validatePoolCompletion = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Pool ID is required')
    .isUUID()
    .withMessage('Pool ID must be a valid UUID'),

  handleValidationErrors,
];

// ========================================
// Query Parameter Validation
// ========================================

export const validatePaginationParams = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors,
];

export const validateStatusFilter = [
  query('status')
    .optional()
    .trim()
    .isIn(['pending', 'active', 'completed', 'cancelled', 'rejected'])
    .withMessage('Invalid status value'),

  handleValidationErrors,
];

// ========================================
// UUID Parameter Validation
// ========================================

export const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),

  handleValidationErrors,
];

// ========================================
// Date Range Validation
// ========================================

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  handleValidationErrors,
];

// ========================================
// Sanitization Helpers
// ========================================

/**
 * Sanitize string input (prevent XSS)
 */
export const sanitizeString = (fieldName) => {
  return body(fieldName)
    .trim()
    .escape()
    .stripLow();
};

/**
 * Sanitize optional string input
 */
export const sanitizeOptionalString = (fieldName) => {
  return body(fieldName)
    .optional()
    .trim()
    .escape()
    .stripLow();
};

// ========================================
// Custom Validators
// ========================================

/**
 * Validate that amount matches expected token decimals
 */
export const validateTokenAmount = (fieldName, decimals = 6) => {
  return body(fieldName)
    .custom((value) => {
      const parts = value.toString().split('.');
      if (parts.length > 1 && parts[1].length > decimals) {
        throw new Error(`${fieldName} can have maximum ${decimals} decimal places`);
      }
      return true;
    });
};

/**
 * Validate that amount is not dust (too small to be economical)
 */
export const validateMinimumAmount = (fieldName, minAmount = 0.01) => {
  return body(fieldName)
    .custom((value) => {
      if (parseFloat(value) < minAmount) {
        throw new Error(`${fieldName} must be at least ${minAmount}`);
      }
      return true;
    });
};

// ========================================
// Composite Validators (для часто используемых комбинаций)
// ========================================

export const validateBasicInvestmentFields = [
  body('poolId').trim().notEmpty().isUUID(),
  body('amount').notEmpty().isFloat({ min: 1, max: 1000000 }),
  validateSolanaAddress('walletAddress'),
  validateTransactionSignature('txSignature'),
];

export const validateBasicWithdrawalFields = [
  body('amount').notEmpty().isFloat({ min: 1, max: 1000000 }),
  body('currency').trim().notEmpty().isIn(['USDT', 'TAKARA']),
  validateSolanaAddress('walletAddress'),
];

// ========================================
// Security Validators
// ========================================

/**
 * Validate that input doesn't contain SQL injection patterns
 */
export const preventSQLInjection = (fieldName) => {
  return body(fieldName)
    .custom((value) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(--|;|\/\*|\*\/|xp_|sp_)/gi,
      ];

      const strValue = String(value);
      for (const pattern of sqlPatterns) {
        if (pattern.test(strValue)) {
          throw new Error('Input contains potentially dangerous characters');
        }
      }
      return true;
    });
};

/**
 * Validate that input doesn't contain script tags (XSS prevention)
 */
export const preventXSS = (fieldName) => {
  return body(fieldName)
    .custom((value) => {
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi,
        /javascript:/gi,
      ];

      const strValue = String(value);
      for (const pattern of xssPatterns) {
        if (pattern.test(strValue)) {
          throw new Error('Input contains potentially dangerous content');
        }
      }
      return true;
    });
};

export default {
  handleValidationErrors,
  validateSolanaAddress,
  validateTransactionSignature,
  validateInvestmentCreation,
  validateWithdrawalCreation,
  validateWithdrawalProcessing,
  validateNonceRequest,
  validateAuthVerification,
  validateAdminLogin,
  validatePoolActivation,
  validatePoolCompletion,
  validatePaginationParams,
  validateStatusFilter,
  validateUUIDParam,
  validateDateRange,
  sanitizeString,
  sanitizeOptionalString,
  validateTokenAmount,
  validateMinimumAmount,
  validateBasicInvestmentFields,
  validateBasicWithdrawalFields,
  preventSQLInjection,
  preventXSS,
};
