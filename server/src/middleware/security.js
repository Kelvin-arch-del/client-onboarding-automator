const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await AuditLog.logEvent({
      action: 'RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: { endpoint: req.originalUrl, method: req.method }
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
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

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  }
});

// File access control
const fileAccessControl = (req, res, next) => {
  const { fileId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  // Check if user has access to the file
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Admin users have access to all files
  if (userRole === 'admin') {
    return next();
  }
  
  // Regular users can only access their own files or files they're assigned to
  // This would typically check against a database
  // For now, we'll implement basic logging
  AuditLog.logEvent({
    action: 'FILE_ACCESS_ATTEMPT',
    userId: userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    details: { fileId: fileId, userRole: userRole }
  });
  
  next();
};

// File upload security
const secureFileUpload = (req, res, next) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  
  if (req.file) {
    // Check file type
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      AuditLog.logEvent({
        action: 'UNSAFE_FILE_UPLOAD_BLOCKED',
        userId: req.user?.id,
        ip: req.ip,
        details: { 
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size 
        }
      });
      return res.status(400).json({ error: 'File type not allowed' });
    }
    
    // Check file size
    if (req.file.size > maxFileSize) {
      return res.status(400).json({ error: 'File too large' });
    }
    
    // Sanitize filename
    const sanitizedFilename = path.basename(req.file.originalname)
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    req.file.sanitizedName = sanitizedFilename;
  }
  
  next();
};

// 2FA Implementation
class TwoFactorAuth {
  static generateSecret(email) {
    const secret = speakeasy.generateSecret({
      name: `Client Onboarding (${email})`,
      issuer: 'Client Onboarding System',
      length: 32
    });
    return secret;
  }
  
  static async generateQRCode(secret) {
    try {
      return await QRCode.toDataURL(secret.otpauth_url);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }
  
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) of variance
      encoding: 'base32'
    });
  }
  
  static async enable2FA(req, res, next) {
    try {
      const { email } = req.user;
      const secret = this.generateSecret(email);
      const qrCode = await this.generateQRCode(secret);
      
      // Store the secret temporarily (you'd typically save this to user model)
      req.session.tempSecret = secret.base32;
      
      res.json({
        message: 'Scan this QR code with your authenticator app',
        qrCode: qrCode,
        secret: secret.base32 // Only for backup purposes
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to setup 2FA' });
    }
  }
  
  static async verify2FA(req, res, next) {
    const { token } = req.body;
    const userSecret = req.user.twoFactorSecret; // From database
    
    if (!userSecret) {
      return res.status(400).json({ error: '2FA not enabled for this account' });
    }
    
    const isValid = this.verifyToken(userSecret, token);
    
    if (!isValid) {
      await AuditLog.logEvent({
        action: '2FA_VERIFICATION_FAILED',
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Invalid 2FA token' });
    }
    
    await AuditLog.logEvent({
      action: '2FA_VERIFICATION_SUCCESS',
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  }
}

// Monitoring and alerting
const monitorSuspiciousActivity = async (req, res, next) => {
  const suspiciousPatterns = [
    // Multiple failed auth attempts
    { pattern: /\/auth\/login/, threshold: 3, window: 300000 }, // 5 minutes
    // Rapid API calls
    { pattern: /\/api\//, threshold: 50, window: 60000 }, // 1 minute
    // File access patterns
    { pattern: /\/files\//, threshold: 20, window: 300000 } // 5 minutes
  ];
  
  const clientId = req.ip + ':' + (req.user?.id || 'anonymous');
  const endpoint = req.originalUrl;
  
  // Check for suspicious patterns
  for (const { pattern, threshold, window } of suspiciousPatterns) {
    if (pattern.test(endpoint)) {
      // You would typically use Redis or similar for tracking
      // For now, we'll log the event
      await AuditLog.logEvent({
        action: 'API_ACCESS',
        userId: req.user?.id || null,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: { 
          endpoint: endpoint,
          method: req.method,
          clientId: clientId
        }
      });
      
      // In a real implementation, you'd check against stored counts
      // and trigger alerts if thresholds are exceeded
    }
  }
  
  next();
};

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Needed for some frameworks
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
});

// Input validation and sanitization
const validateInput = (req, res, next) => {
  // Remove potentially dangerous characters from all string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    
    return sanitized;
  };
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

// Admin authentication check for sensitive operations
const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    await AuditLog.logEvent({
      action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      userId: req.user?.id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: { endpoint: req.originalUrl, method: req.method }
    });
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Export all security middleware
module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  fileAccessControl,
  secureFileUpload,
  TwoFactorAuth,
  monitorSuspiciousActivity,
  securityHeaders,
  validateInput,
  requireAdmin
};