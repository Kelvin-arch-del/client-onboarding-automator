const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    templateType: {
        type: String,
        enum: ['welcome', 'documentRequest', 'reminder', 'completion'],
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['queued', 'sent', 'delivered', 'failed', 'bounced'],
        default: 'queued'
    },
    messageId: {
        type: String,
        unique: true,
        sparse: true
    },
    deliveryAttempts: {
        type: Number,
        default: 0
    },
    lastAttemptAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    failureReason: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for performance
emailLogSchema.index({ clientId: 1, templateType: 1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ messageId: 1 });
emailLogSchema.index({ createdAt: -1 });

// Static methods
emailLogSchema.statics.updateStatus = function(messageId, status, additionalData = {}) {
    const updateData = { 
        status, 
        lastAttemptAt: new Date(),
        ...additionalData 
    };
    
    if (status === 'delivered') {
        updateData.deliveredAt = new Date();
    }
    
    return this.findOneAndUpdate(
        { messageId },
        { $set: updateData, $inc: { deliveryAttempts: 1 } },
        { new: true }
    );
};

// Instance methods
emailLogSchema.methods.markAsSent = function(messageId) {
    this.status = 'sent';
    this.messageId = messageId;
    this.lastAttemptAt = new Date();
    this.deliveryAttempts += 1;
    return this.save();
};

emailLogSchema.methods.markAsDelivered = function() {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
};

emailLogSchema.methods.markAsFailed = function(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    this.lastAttemptAt = new Date();
    this.deliveryAttempts += 1;
    return this.save();
};

// TODO: Add webhook handler endpoint for delivery status updates from email provider
// TODO: Implement polling mechanism for providers without webhooks
// TODO: Add retry logic with exponential backoff
// TODO: Add cleanup job for old email logs

module.exports = mongoose.model('EmailLog', emailLogSchema);