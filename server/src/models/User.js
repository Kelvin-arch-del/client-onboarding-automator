const jwt = require('jsonwebtoken');
// Instance method to generate JWT token
userSchema.methods.generateJWT = function() {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );
};
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// User roles enum
const USER_ROLES = {
    ADMIN: 'admin',
    ATTORNEY: 'attorney', 
    PARALEGAL: 'paralegal',
    CLIENT: 'client'
};

// Permission levels
const PERMISSIONS = {
    CLIENT_READ: 'client:read',
    CLIENT_WRITE: 'client:write',
    CLIENT_DELETE: 'client:delete',
    DOCUMENT_READ: 'document:read',
    DOCUMENT_WRITE: 'document:write',
    DOCUMENT_DELETE: 'document:delete',
    USER_MANAGE: 'user:manage',
    AUDIT_READ: 'audit:read',
    SYSTEM_ADMIN: 'system:admin'
};

const userSchema = new mongoose.Schema({
    // Basic user information
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    
    password: {
        type: String,
        required: true,
        minlength: 8,
        // Will be hashed before saving
    },
    
    // Personal information
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9]?[0-9]{7,15}$/, 'Invalid phone number']
    },
    
    // Role and permissions
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        required: true,
        default: USER_ROLES.CLIENT
    },
    
    permissions: [{
        type: String,
        enum: Object.values(PERMISSIONS)
    }],
    
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // Email verification
    emailVerificationToken: {
        type: String,
        select: false // Don't include in queries by default
    },
    
    emailVerificationExpires: {
        type: Date,
        select: false
    },
    
    // Password reset
    passwordResetToken: {
        type: String,
        select: false
    },
    
    passwordResetExpires: {
        type: Date,
        select: false
    },
    
    lastPasswordChange: {
        type: Date,
        default: Date.now
    },
    
    // 2FA (Two-Factor Authentication) settings
    twoFactorAuth: {
        enabled: {
            type: Boolean,
            default: false
        },
        secret: {
            type: String,
            select: false // Never include in queries
        },
        backupCodes: [{
            code: String,
            used: {
                type: Boolean,
                default: false
            },
            usedAt: Date
        }],
        lastUsed: Date,
        // TODO: Implement phone/SMS 2FA options
        methods: [{
            type: String,
            enum: ['app', 'sms', 'email'], // TOTP app, SMS, email backup
            default: 'app'
        }]
    },
    
    // Session management
    activeSessions: [{
        sessionId: String,
        ipAddress: String,
        userAgent: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastActivity: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Login tracking
    lastLogin: Date,
    
    loginAttempts: {
        count: {
            type: Number,
            default: 0
        },
        lockUntil: Date
    },
    
    // Professional information (for attorneys/paralegals)
    professional: {
        barNumber: String,
        licenseState: String,
        specialties: [String],
        firmName: String
    },
    
    // Client-specific information
    clientProfile: {
        // Reference to Client model when role is 'client'
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client'
        },
        // Billing and contact preferences
        preferredContactMethod: {
            type: String,
            enum: ['email', 'phone', 'portal'],
            default: 'email'
        }
    },
    
    // Security settings
    security: {
        passwordChangeRequired: {
            type: Boolean,
            default: false
        },
        accountLocked: {
            type: Boolean,
            default: false
        },
        lockReason: String,
        lockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        lockedAt: Date,
        
        // TODO: Implement device tracking
        trustedDevices: [{
            deviceId: String,
            deviceName: String,
            trustedAt: Date,
            lastSeen: Date
        }]
    },
    
    // Audit fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Privacy and compliance
    privacySettings: {
        dataRetentionConsent: {
            type: Boolean,
            default: false
        },
        marketingConsent: {
            type: Boolean,
            default: false
        },
        consentDate: Date,
        consentVersion: String
    }
    
}, {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.loginAttempts && this.loginAttempts.lockUntil && this.loginAttempts.lockUntil > Date.now());
});

// Indexes for performance and security
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'clientProfile.clientId': 1 });
userSchema.index({ 'security.accountLocked': 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastLogin: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        
        // Update password change timestamp
        this.lastPasswordChange = new Date();
        
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to assign default permissions based on role
userSchema.pre('save', function(next) {
    if (!this.isModified('role')) return next();
    
    // Assign default permissions based on role
    switch (this.role) {
        case USER_ROLES.ADMIN:
            this.permissions = Object.values(PERMISSIONS);
            break;
        case USER_ROLES.ATTORNEY:
            this.permissions = [
                PERMISSIONS.CLIENT_READ,
                PERMISSIONS.CLIENT_WRITE,
                PERMISSIONS.CLIENT_DELETE,
                PERMISSIONS.DOCUMENT_READ,
                PERMISSIONS.DOCUMENT_WRITE,
                PERMISSIONS.DOCUMENT_DELETE,
                PERMISSIONS.AUDIT_READ
            ];
            break;
        case USER_ROLES.PARALEGAL:
            this.permissions = [
                PERMISSIONS.CLIENT_READ,
                PERMISSIONS.CLIENT_WRITE,
                PERMISSIONS.DOCUMENT_READ,
                PERMISSIONS.DOCUMENT_WRITE
            ];
            break;
        case USER_ROLES.CLIENT:
            this.permissions = [
                PERMISSIONS.CLIENT_READ,
                PERMISSIONS.DOCUMENT_READ
            ];
            break;
    }
    
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
        
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return token;
};

// Instance method to generate password reset token  
userSchema.methods.generatePasswordResetToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
        
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    
    return token;
};

// Instance method to generate 2FA backup codes
userSchema.methods.generate2FABackupCodes = function() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        codes.push({
            code: crypto.randomBytes(4).toString('hex').toUpperCase(),
            used: false
        });
    }
    this.twoFactorAuth.backupCodes = codes;
    return codes.map(c => c.code);
};

// Instance method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
    return this.permissions && this.permissions.includes(permission);
};

// Instance method to check if password change is required
userSchema.methods.isPasswordChangeRequired = function() {
    return this.security.passwordChangeRequired || 
           (this.lastPasswordChange && 
            Date.now() - this.lastPasswordChange > 90 * 24 * 60 * 60 * 1000); // 90 days
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to increment login attempts
userSchema.statics.incLoginAttempts = async function(userId) {
    const user = await this.findById(userId);
    if (!user) return null;
    
    const updates = { $inc: { 'loginAttempts.count': 1 } };
    
    // If first failed attempt, set lock until
    if (user.loginAttempts.count === 1) {
        updates.$set = { 'loginAttempts.lockUntil': Date.now() + 15 * 60 * 1000 }; // 15 min
    }
    // If 5 failed attempts, extend lock
    else if (user.loginAttempts.count >= 4) {
        updates.$set = { 'loginAttempts.lockUntil': Date.now() + 60 * 60 * 1000 }; // 1 hour
    }
    
    return this.findByIdAndUpdate(userId, updates, { new: true });
};

// Static method to reset login attempts
userSchema.statics.resetLoginAttempts = function(userId) {
    return this.findByIdAndUpdate(userId, {
        $unset: { 'loginAttempts.count': 1, 'loginAttempts.lockUntil': 1 }
    });
};

// Export the model
const User = mongoose.model('User', userSchema);

// Export constants as well
User.ROLES = USER_ROLES;
User.PERMISSIONS = PERMISSIONS;

module.exports = User;
