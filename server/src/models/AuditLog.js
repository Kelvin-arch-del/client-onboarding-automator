const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'USER_LOGIN',
      'USER_LOGOUT',
      'LOGIN_FAILED',
      'PASSWORD_CHANGE',
      '2FA_ENABLED',
      '2FA_DISABLED',
      '2FA_VERIFICATION_SUCCESS',
      '2FA_VERIFICATION_FAILED',
      
      // User management
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ROLE_CHANGED',
      
      // Client management
      'CLIENT_CREATED',
      'CLIENT_UPDATED',
      'CLIENT_DELETED',
      'CLIENT_STATUS_CHANGED',
      
      // File operations
      'FILE_UPLOADED',
      'FILE_DOWNLOADED',
      'FILE_DELETED',
      'FILE_ACCESS_ATTEMPT',
      'UNSAFE_FILE_UPLOAD_BLOCKED',
      
      // Security events
      'RATE_LIMIT_EXCEEDED',
      'AUTH_RATE_LIMIT_EXCEEDED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      'SUSPICIOUS_ACTIVITY_DETECTED',
      
      // API access
      'API_ACCESS',
      'API_ERROR',
      
      // Data operations
      'DATA_EXPORT',
      'DATA_IMPORT',
      'DATA_CLEANUP',
      
      // GDPR operations
      'GDPR_EXPORT_REQUEST',
      'GDPR_DELETE_REQUEST',
      'GDPR_DATA_EXPORTED',
      'GDPR_DATA_DELETED',
      
      // System events
      'SYSTEM_BACKUP',
      'SYSTEM_MAINTENANCE',
      'CONFIG_CHANGED'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Can be null for system events or anonymous actions
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // For actions performed on other users
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null // For client-related actions
  },
  resourceId: {
    type: String,
    default: null // Generic resource identifier (file ID, etc.)
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {} // Additional contextual information
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Retention policy - automatically delete after retention period
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  }
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });

// Static methods for logging
auditLogSchema.statics.logEvent = async function(logData) {
  try {
    const {
      action,
      userId = null,
      targetUserId = null,
      clientId = null,
      resourceId = null,
      ip,
      userAgent = null,
      details = {},
      severity = 'LOW',
      success = true,
      errorMessage = null
    } = logData;

    // Validate required fields
    if (!action) {
      throw new Error('Action is required for audit logging');
    }
    if (!ip) {
      throw new Error('IP address is required for audit logging');
    }

    // Auto-assign severity based on action type
    let autoSeverity = severity;
    if (action.includes('FAILED') || action.includes('BLOCKED') || action.includes('UNAUTHORIZED')) {
      autoSeverity = 'HIGH';
    } else if (action.includes('RATE_LIMIT') || action.includes('SUSPICIOUS')) {
      autoSeverity = 'MEDIUM';
    } else if (action.includes('CRITICAL') || action.includes('DELETED')) {
      autoSeverity = 'CRITICAL';
    }

    const auditLog = new this({
      action,
      userId,
      targetUserId,
      clientId,
      resourceId,
      ip,
      userAgent,
      details,
      severity: autoSeverity,
      success,
      errorMessage
    });

    await auditLog.save();
    
    // Send alerts for high severity events
    if (autoSeverity === 'HIGH' || autoSeverity === 'CRITICAL') {
      await this.sendSecurityAlert(auditLog);
    }

    return auditLog;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error to avoid breaking the main application flow
    return null;
  }
};

// Method to send security alerts
auditLogSchema.statics.sendSecurityAlert = async function(auditLog) {
  try {
    // This would integrate with your notification system
    // For now, we'll just log to console
    console.warn(`SECURITY ALERT: ${auditLog.action} - Severity: ${auditLog.severity}`, {
      userId: auditLog.userId,
      ip: auditLog.ip,
      details: auditLog.details,
      timestamp: auditLog.timestamp
    });
    
    // In a production environment, you would:
    // - Send email alerts
    // - Send Slack notifications
    // - Integrate with monitoring systems (DataDog, New Relic, etc.)
    // - Send webhooks to security systems
  } catch (error) {
    console.error('Failed to send security alert:', error);
  }
};

// Method to get security events for monitoring dashboard
auditLogSchema.statics.getSecurityEvents = async function(options = {}) {
  const {
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    endDate = new Date(),
    severity = null,
    limit = 100
  } = options;

  const query = {
    timestamp: { $gte: startDate, $lte: endDate },
    severity: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] }
  };

  if (severity) {
    query.severity = severity;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'email role')
    .populate('targetUserId', 'email role')
    .populate('clientId', 'name email');
};

// Method to get user activity summary
auditLogSchema.statics.getUserActivity = async function(userId, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          action: '$action'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': -1, '_id.action': 1 }
    }
  ]);
};

// Method to detect suspicious patterns
auditLogSchema.statics.detectSuspiciousActivity = async function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Multiple failed login attempts from same IP
  const failedLogins = await this.aggregate([
    {
      $match: {
        action: 'LOGIN_FAILED',
        timestamp: { $gte: oneHourAgo }
      }
    },
    {
      $group: {
        _id: '$ip',
        count: { $sum: 1 },
        attempts: { $push: { userId: '$userId', timestamp: '$timestamp' } }
      }
    },
    {
      $match: { count: { $gte: 5 } }
    }
  ]);

  // Unusual access patterns (too many requests from single IP)
  const highVolumeIPs = await this.aggregate([
    {
      $match: {
        action: 'API_ACCESS',
        timestamp: { $gte: oneHourAgo }
      }
    },
    {
      $group: {
        _id: '$ip',
        count: { $sum: 1 },
        distinctUsers: { $addToSet: '$userId' }
      }
    },
    {
      $match: { count: { $gte: 100 } }
    }
  ]);

  return {
    suspiciousIPs: failedLogins,
    highVolumeIPs: highVolumeIPs
  };
};

// Method to cleanup old logs (beyond retention policy)
auditLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 365) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  console.log(`Cleaned up ${result.deletedCount} old audit log entries`);
  return result;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);