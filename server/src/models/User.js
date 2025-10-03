const jwt = require('jsonwebtoken');
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
        select: false
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
    // 2FA
    twoFactorAuth: {
        enabled: {
            type: Boolean,
            default: false
        },
        secret: {
            type: String,
            select: false
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
        methods: [{
            type: String,
            enum: ['app', 'sms', 'email'],
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
    // Professional information
    professional: {
        barNumber: String,
        licenseState: String,
        specialties: [String],
        firmName: String
    },
    // Client-specific information
    clientProfile: {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client'
        },
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.virtual('isLocked').get(function() {
    return !!(this.loginAttempts && this.loginAttempts.lockUntil && this.loginAttempts.lockUntil > Date.now());
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'clientProfile.clientId': 1 });
userSchema.index({ 'security.accountLocked': 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastLogin: 1 });

// Middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        this.lastPasswordChange = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', function(next) {
    if (!this.isModified('role')) return next();
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

// Instance methods
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
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.generateEmailVerificationToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    return token;
};
userSchema.methods.generatePasswordResetToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    return token;
};
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
userSchema.methods.hasPermission = function(permission) {
    return this.permissions && this.permissions.includes(permission);
};
userSchema.methods.isPasswordChangeRequired = function() {
    return this.security.passwordChangeRequired || 
        (this.lastPasswordChange && Date.now() - this.lastPasswordChange > 90 * 24 * 60 * 60 * 1000);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};
userSchema.statics.incLoginAttempts = async function(userId) {
    const user = await this.findById(userId);
    if (!user) return null;
    const updates = { $inc: { 'loginAttempts.count': 1 } };
    if (user.loginAttempts.count === 1) {
        updates.$set = { 'loginAttempts.lockUntil': Date.now() + 15 * 60 * 1000 };
    } else if (user.loginAttempts.count >= 4) {
        updates.$set = { 'loginAttempts.lockUntil': Date.now() + 60 * 60 * 1000 };
    }
    return this.findByIdAndUpdate(userId, updates, { new: true });
};
userSchema.statics.resetLoginAttempts = function(userId) {
    return this.findByIdAndUpdate(userId, {
        $unset: { 'loginAttempts.count': 1, 'loginAttempts.lockUntil': 1 }
    });
};

// Export the model
const User = mongoose.model('User', userSchema);

User.ROLES = USER_ROLES;
User.PERMISSIONS = PERMISSIONS;

module.exports = User;
