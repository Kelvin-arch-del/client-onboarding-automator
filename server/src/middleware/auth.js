const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // TODO: Create User model
const { auditLog } = require('../../../shared/audit');

// Role definitions
const ROLES = {
    ADMIN: 'admin',
    ATTORNEY: 'attorney',
    PARALEGAL: 'paralegal',
    CLIENT: 'client'
};

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
    admin: 4,
    attorney: 3,
    paralegal: 2,
    client: 1
};

/**
 * JWT Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required',
                code: 'MISSING_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // TODO: Implement user lookup from database
        // const user = await User.findById(decoded.userId).select('-password');
        // if (!user) {
        //     return res.status(401).json({ error: 'User not found' });
        // }
        
        // For now, use decoded token data
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || []
        };

        // Log authentication event
        auditLog('AUTH_SUCCESS', req.user.id, {
            action: 'token_authenticated',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path
        });

        next();
    } catch (error) {
        // Log failed authentication
        auditLog('AUTH_FAILURE', null, {
            action: 'token_authentication_failed',
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path
        });

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(403).json({ 
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Single role or array of roles
 * @param {Object} options - Additional options
 */
const requireRole = (allowedRoles, options = {}) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Check if user has required role
        if (!roles.includes(userRole)) {
            // Check role hierarchy if hierarchical access is enabled
            if (options.hierarchical) {
                const userLevel = ROLE_HIERARCHY[userRole] || 0;
                const maxRequiredLevel = Math.max(...roles.map(role => ROLE_HIERARCHY[role] || 0));
                
                if (userLevel < maxRequiredLevel) {
                    auditLog('AUTH_DENIED', req.user.id, {
                        action: 'insufficient_role',
                        requiredRoles: roles,
                        userRole: userRole,
                        endpoint: req.path
                    });
                    
                    return res.status(403).json({ 
                        error: 'Insufficient permissions',
                        code: 'INSUFFICIENT_ROLE'
                    });
                }
            } else {
                auditLog('AUTH_DENIED', req.user.id, {
                    action: 'role_mismatch',
                    requiredRoles: roles,
                    userRole: userRole,
                    endpoint: req.path
                });
                
                return res.status(403).json({ 
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }
        }

        next();
    };
};

/**
 * Client data access control
 * Ensures clients can only access their own data
 */
const requireClientAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Admin and attorneys can access all client data
    if (userRole === ROLES.ADMIN || userRole === ROLES.ATTORNEY) {
        return next();
    }
    
    // Paralegals can access assigned client data (TODO: implement assignment check)
    if (userRole === ROLES.PARALEGAL) {
        // TODO: Check if paralegal is assigned to this client
        // const clientId = req.params.clientId || req.body.clientId;
        // const isAssigned = await checkParalegalAssignment(req.user.id, clientId);
        // if (!isAssigned) {
        //     return res.status(403).json({ error: 'Access denied to client data' });
        // }
        return next();
    }
    
    // Clients can only access their own data
    if (userRole === ROLES.CLIENT) {
        const clientId = req.params.clientId || req.body.clientId;
        if (req.user.clientId !== clientId) {
            auditLog('AUTH_DENIED', req.user.id, {
                action: 'client_data_access_denied',
                attemptedClientId: clientId,
                userClientId: req.user.clientId
            });
            
            return res.status(403).json({ 
                error: 'Access denied to client data',
                code: 'CLIENT_ACCESS_DENIED'
            });
        }
    }
    
    next();
};

/**
 * Document access control middleware
 * Checks document-level permissions and privilege status
 */
const requireDocumentAccess = (action = 'read') => {
    return async (req, res, next) => {
        try {
            // TODO: Implement document access checking
            // const documentId = req.params.documentId || req.body.documentId;
            // const document = await Document.findById(documentId);
            // 
            // if (!document) {
            //     return res.status(404).json({ error: 'Document not found' });
            // }
            // 
            // // Check if document is privileged
            // if (document.privileged && req.user.role === ROLES.CLIENT) {
            //     return res.status(403).json({ 
            //         error: 'Access denied to privileged document',
            //         code: 'PRIVILEGED_DOCUMENT'
            //     });
            // }
            // 
            // // Check user access permissions
            // const hasAccess = await checkDocumentAccess(req.user.id, documentId, action);
            // if (!hasAccess) {
            //     return res.status(403).json({ error: 'Insufficient document permissions' });
            // }
            // 
            // // Log document access
            // auditLog('DOCUMENT_ACCESS', req.user.id, {
            //     action: action,
            //     documentId: documentId,
            //     documentTitle: document.fileInfo.originalName
            // });
            
            next();
        } catch (error) {
            console.error('Document access check error:', error);
            res.status(500).json({ error: 'Access control error' });
        }
    };
};

/**
 * 2FA verification middleware (stub)
 * TODO: Implement full 2FA verification
 */
const require2FA = (req, res, next) => {
    // TODO: Implement 2FA verification
    // Check if user has 2FA enabled and verified for this session
    // if (req.user.requires2FA && !req.user.twoFAVerified) {
    //     return res.status(403).json({ 
    //         error: '2FA verification required',
    //         code: 'REQUIRE_2FA'
    //     });
    // }
    
    next();
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role,
            permissions: user.permissions || []
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Extract user IP address considering proxies
 */
const getUserIP = (req) => {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

module.exports = {
    ROLES,
    ROLE_HIERARCHY,
    authenticateToken,
    requireRole,
    requireClientAccess,
    requireDocumentAccess,
    require2FA,
    generateToken,
    hashPassword,
    comparePassword,
    getUserIP
};
