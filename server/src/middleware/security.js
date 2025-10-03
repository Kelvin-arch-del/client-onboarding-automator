// security.js

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const AuditLog = require('../models/AuditLog');

// --- Security headers with Helmet ---
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Relax if you know you need this
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
});

// --- Rate Limiting ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs (for login/register)
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: async (req, res) => {
    await AuditLog.logEvent({
      action: 'AUTH_RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: { endpoint: req.originalUrl, email: req.body.email }
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Add other exports below as needed for your app...
// EXAMPLE: uploadLimiter, fileAccessControl, TwoFactorAuth, etc.

// --- Export all middlewares as an object ---
module.exports = {
  securityHeaders,
  authLimiter,
  // Add any others you need here, e.g.:
  // uploadLimiter,
  // fileAccessControl,
  // TwoFactorAuth,
};
