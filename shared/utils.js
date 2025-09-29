const fs = require('fs').promises;
const path = require('path');

/**
 * Audit logging utility for compliance and security monitoring
 * Provides centralized logging for user actions, document access, and system events
 */

// Audit event types
const AUDIT_EVENTS = {
    // Authentication events
    AUTH_SUCCESS: 'auth.success',
    AUTH_FAILURE: 'auth.failure',
    AUTH_DENIED: 'auth.denied',
    PASSWORD_CHANGED: 'auth.password_changed',
    ACCOUNT_LOCKED: 'auth.account_locked',
    
    // User management events
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_ROLE_CHANGED: 'user.role_changed',
    
    // Client data events
    CLIENT_CREATED: 'client.created',
    CLIENT_VIEWED: 'client.viewed',
    CLIENT_UPDATED: 'client.updated',
    CLIENT_DELETED: 'client.deleted',
    
    // Document events
    DOCUMENT_UPLOADED: 'document.uploaded',
    DOCUMENT_VIEWED: 'document.viewed',
    DOCUMENT_DOWNLOADED: 'document.downloaded',
    DOCUMENT_UPDATED: 'document.updated',
    DOCUMENT_DELETED: 'document.deleted',
    DOCUMENT_SHARED: 'document.shared',
    
    // Workflow events
    WORKFLOW_CREATED: 'workflow.created',
    WORKFLOW_UPDATED: 'workflow.updated',
    WORKFLOW_COMPLETED: 'workflow.completed',
    
    // System events
    SYSTEM_LOGIN: 'system.login',
    SYSTEM_LOGOUT: 'system.logout',
    SYSTEM_ERROR: 'system.error',
    DATA_EXPORT: 'system.data_export',
    BACKUP_CREATED: 'system.backup_created'
};

// Risk levels for audit events
const RISK_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Default risk level mapping
const DEFAULT_RISK_LEVELS = {
    [AUDIT_EVENTS.AUTH_SUCCESS]: RISK_LEVELS.LOW,
    [AUDIT_EVENTS.AUTH_FAILURE]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.AUTH_DENIED]: RISK_LEVELS.HIGH,
    [AUDIT_EVENTS.PASSWORD_CHANGED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.ACCOUNT_LOCKED]: RISK_LEVELS.HIGH,
    
    [AUDIT_EVENTS.USER_CREATED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.USER_UPDATED]: RISK_LEVELS.LOW,
    [AUDIT_EVENTS.USER_DELETED]: RISK_LEVELS.HIGH,
    [AUDIT_EVENTS.USER_ROLE_CHANGED]: RISK_LEVELS.HIGH,
    
    [AUDIT_EVENTS.CLIENT_CREATED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.CLIENT_VIEWED]: RISK_LEVELS.LOW,
    [AUDIT_EVENTS.CLIENT_UPDATED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.CLIENT_DELETED]: RISK_LEVELS.HIGH,
    
    [AUDIT_EVENTS.DOCUMENT_UPLOADED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.DOCUMENT_VIEWED]: RISK_LEVELS.LOW,
    [AUDIT_EVENTS.DOCUMENT_DOWNLOADED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.DOCUMENT_UPDATED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.DOCUMENT_DELETED]: RISK_LEVELS.HIGH,
    [AUDIT_EVENTS.DOCUMENT_SHARED]: RISK_LEVELS.MEDIUM,
    
    [AUDIT_EVENTS.WORKFLOW_CREATED]: RISK_LEVELS.MEDIUM,
    [AUDIT_EVENTS.WORKFLOW_UPDATED]: RISK_LEVELS.LOW,
    [AUDIT_EVENTS.WORKFLOW_COMPLETED]: RISK_LEVELS.LOW,
    
    [AUDIT_EVENTS.SYSTEM_LOGIN]: RISK_LEVELS.LOW,
    [AUDIT_EVENTS.SYSTEM_LOGOUT]: RISK_LEVELS.LOW,
    [AUDIT_EVENTS.SYSTEM_ERROR]: RISK_LEVELS.HIGH,
    [AUDIT_EVENTS.DATA_EXPORT]: RISK_LEVELS.HIGH,
    [AUDIT_EVENTS.BACKUP_CREATED]: RISK_LEVELS.LOW
};

/**
 * Format audit log entry
 * @param {string} event - Event type from AUDIT_EVENTS
 * @param {string} userId - User ID performing the action
 * @param {Object} metadata - Additional event metadata
 * @param {string} riskLevel - Risk level override
 * @returns {Object} Formatted audit entry
 */
function formatAuditEntry(event, userId, metadata = {}, riskLevel = null) {
    const timestamp = new Date().toISOString();
    const risk = riskLevel || DEFAULT_RISK_LEVELS[event] || RISK_LEVELS.LOW;
    
    return {
        timestamp,
        event,
        userId,
        risk,
        metadata: {
            ...metadata,
            // Add system info
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development',
            serverHostname: require('os').hostname()
        }
    };
}

/**
 * Write audit log to file
 * @param {Object} auditEntry - Formatted audit entry
 */
async function writeToFile(auditEntry) {
    try {
        const logDir = process.env.AUDIT_LOG_DIR || path.join(process.cwd(), 'logs');
        const logFile = path.join(logDir, 'audit.log');
        
        // Ensure log directory exists
        try {
            await fs.mkdir(logDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }
        
        // Format as JSONL (JSON Lines)
        const logLine = JSON.stringify(auditEntry) + '\n';
        
        // Append to file
        await fs.appendFile(logFile, logLine, 'utf8');
        
    } catch (error) {
        console.error('Failed to write audit log:', error);
        // TODO: Implement fallback logging (e.g., to database, external service)
    }
}

/**
 * Main audit logging function
 * @param {string} event - Event type from AUDIT_EVENTS
 * @param {string} userId - User ID performing the action (null for system events)
 * @param {Object} metadata - Additional event metadata
 * @param {string} riskLevel - Risk level override
 */
async function auditLog(event, userId = null, metadata = {}, riskLevel = null) {
    try {
        const auditEntry = formatAuditEntry(event, userId, metadata, riskLevel);
        
        // Write to file (primary storage)
        await writeToFile(auditEntry);
        
        // TODO: Implement additional logging destinations:
        // - Database logging for real-time queries
        // - External SIEM integration
        // - Real-time alerting for high-risk events
        
        // Console logging for development
        if (process.env.NODE_ENV === 'development') {
            console.log('AUDIT:', auditEntry);
        }
        
        // Alert on critical events
        if (auditEntry.risk === RISK_LEVELS.CRITICAL) {
            console.error('CRITICAL AUDIT EVENT:', auditEntry);
            // TODO: Send immediate alerts (email, SMS, Slack, etc.)
        }
        
    } catch (error) {
        console.error('Audit logging failed:', error);
        // Critical: audit logging failure should be logged separately
    }
}

/**
 * Audit middleware for Express routes
 * Automatically logs HTTP requests with user context
 */
function auditMiddleware(event, options = {}) {
    return (req, res, next) => {
        const metadata = {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            ...options.metadata
        };
        
        // Extract additional metadata from request
        if (req.params) metadata.params = req.params;
        if (req.query && Object.keys(req.query).length > 0) {
            metadata.query = req.query;
        }
        
        // Log the event
        auditLog(event, req.user?.id, metadata, options.riskLevel)
            .catch(err => console.error('Audit middleware error:', err));
        
        next();
    };
}

/**
 * Create audit log query helpers
 * TODO: Implement database querying when audit logs are stored in DB
 */
const auditQuery = {
    /**
     * Get audit logs for a specific user
     * @param {string} userId 
     * @param {Object} options 
     * @returns {Array} Audit log entries
     */
    async getByUser(userId, options = {}) {
        // TODO: Implement database query
        throw new Error('Database audit querying not implemented yet');
    },
    
    /**
     * Get audit logs for a specific event type
     * @param {string} event 
     * @param {Object} options 
     * @returns {Array} Audit log entries
     */
    async getByEvent(event, options = {}) {
        // TODO: Implement database query
        throw new Error('Database audit querying not implemented yet');
    },
    
    /**
     * Get audit logs within a date range
     * @param {Date} startDate 
     * @param {Date} endDate 
     * @param {Object} options 
     * @returns {Array} Audit log entries
     */
    async getByDateRange(startDate, endDate, options = {}) {
        // TODO: Implement database query
        throw new Error('Database audit querying not implemented yet');
    },
    
    /**
     * Get high-risk audit events
     * @param {Object} options 
     * @returns {Array} High-risk audit log entries
     */
    async getHighRisk(options = {}) {
        // TODO: Implement database query for risk levels
        throw new Error('Database audit querying not implemented yet');
    }
};

/**
 * Audit log rotation and cleanup utilities
 */
const auditMaintenance = {
    /**
     * Rotate audit logs (move old logs to archive)
     * @param {number} maxSizeBytes - Maximum log file size before rotation
     */
    async rotateLogs(maxSizeBytes = 100 * 1024 * 1024) { // 100MB default
        try {
            const logDir = process.env.AUDIT_LOG_DIR || path.join(process.cwd(), 'logs');
            const logFile = path.join(logDir, 'audit.log');
            
            const stats = await fs.stat(logFile).catch(() => null);
            
            if (stats && stats.size > maxSizeBytes) {
                const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
                const archiveFile = path.join(logDir, `audit-${timestamp}.log`);
                
                // Move current log to archive
                await fs.rename(logFile, archiveFile);
                
                console.log(`Audit log rotated: ${archiveFile}`);
            }
        } catch (error) {
            console.error('Log rotation failed:', error);
        }
    },
    
    /**
     * Clean up old audit logs
     * @param {number} retentionDays - Days to retain logs
     */
    async cleanupOldLogs(retentionDays = 2555) { // ~7 years default for legal retention
        try {
            const logDir = process.env.AUDIT_LOG_DIR || path.join(process.cwd(), 'logs');
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            
            const files = await fs.readdir(logDir);
            
            for (const file of files) {
                if (file.startsWith('audit-') && file.endsWith('.log')) {
                    const filePath = path.join(logDir, file);
                    const stats = await fs.stat(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        await fs.unlink(filePath);
                        console.log(`Deleted old audit log: ${file}`);
                    }
                }
            }
        } catch (error) {
            console.error('Log cleanup failed:', error);
        }
    }
};

/**
 * Export utility functions and constants
 */
module.exports = {
    // Main audit function
    auditLog,
    
    // Middleware
    auditMiddleware,
    
    // Constants
    AUDIT_EVENTS,
    RISK_LEVELS,
    
    // Query helpers (future implementation)
    auditQuery,
    
    // Maintenance utilities
    auditMaintenance,
    
    // Helper functions
    formatAuditEntry
};
