const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    // Basic File Information
    fileInfo: {
      originalName: { type: String, required: true },
      filename: { type: String, required: true, unique: true }, // System generated filename
      mimetype: { type: String, required: true },
      size: { type: Number, required: true }, // Size in bytes
      extension: { type: String, required: true },
      encoding: { type: String },
      path: { type: String, required: true }, // File system path
      url: { type: String }, // Public access URL if applicable
      checksum: { type: String }, // MD5 or SHA256 hash for integrity verification
    },

    // Document Classification
    classification: {
      type: {
        type: String,
        required: true,
        enum: [
          'intake-form',
          'identification',
          'medical-record',
          'police-report',
          'insurance-document',
          'contract',
          'correspondence',
          'court-filing',
          'discovery',
          'expert-report',
          'financial-record',
          'employment-record',
          'property-deed',
          'will-testament',
          'power-of-attorney',
          'photo-evidence',
          'audio-recording',
          'video-recording',
          'other',
        ],
      },
      category: { type: String },
      subcategory: { type: String },
      description: { type: String },
      confidentialityLevel: {
        type: String,
        enum: ['public', 'internal', 'confidential', 'attorney-client-privileged'],
        default: 'confidential',
      },
      isEvidence: { type: Boolean, default: false },
      evidenceNumber: { type: String },
      chainOfCustody: [
        {
          handler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          action: {
            type: String,
            enum: ['received', 'reviewed', 'modified', 'transmitted'],
          },
          timestamp: { type: Date, default: Date.now },
          notes: { type: String },
          location: { type: String },
        },
      ],
    },

    // Processing Status
    processing: {
      status: {
        type: String,
        enum: [
          'uploaded',
          'processing',
          'processed',
          'reviewed',
          'approved',
          'rejected',
          'archived',
        ],
        default: 'uploaded',
      },
      ocrStatus: {
        status: {
          type: String,
          enum: [
            'pending',
            'processing',
            'completed',
            'failed',
            'not-applicable',
          ],
          default: 'pending',
        },
        extractedText: { type: String },
        confidence: { type: Number },
        processedAt: { type: Date },
        error: { type: String },
      },
      analysis: {
        keywordMatches: [{ type: String }],
        entities: [
          {
            type: { type: String },
            value: { type: String },
            confidence: { type: Number },
          },
        ],
        summary: { type: String },
        language: { type: String, default: 'en' },
        pageCount: { type: Number },
        wordCount: { type: Number },
      },
      virus_scan: {
        status: {
          type: String,
          enum: ['pending', 'scanning', 'clean', 'infected', 'error'],
          default: 'pending',
        },
        scannedAt: { type: Date },
        engine: { type: String },
        result: { type: String },
      },
    },

    // Relationships and Context
    relationships: {
      client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
      workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
      parentDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
      childDocuments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
      relatedDocuments: [
        {
          document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
          relationship: {
            type: String,
            enum: ['attachment', 'amendment', 'exhibit', 'reference'],
          },
        },
      ],
      associatedCase: { type: String },
    },

    // Version Control
    version: {
      major: { type: Number, default: 1 },
      minor: { type: Number, default: 0 },
      isLatest: { type: Boolean, default: true },
      changeLog: { type: String },
      replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    },

    // Access and Permissions
    access: {
      isPublic: { type: Boolean, default: false },
      allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      allowedRoles: [{ type: String }],
      accessLog: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          action: {
            type: String,
            enum: ['view', 'download', 'edit', 'delete'],
          },
          timestamp: { type: Date, default: Date.now },
          ipAddress: { type: String },
          userAgent: { type: String },
        },
      ],
      downloadCount: { type: Number, default: 0 },
      viewCount: { type: Number, default: 0 },
    },

    // Legal and Compliance
    legal: {
      retentionPeriod: { type: Number },
      destructionDate: { type: Date },
      legalHold: {
        isActive: { type: Boolean, default: false },
        reason: { type: String },
        appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        appliedAt: { type: Date },
        releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        releasedAt: { type: Date },
      },
      discoveryStatus: {
        type: String,
        enum: [
          'not-applicable',
          'privileged',
          'work-product',
          'producible',
          'produced',
        ],
        default: 'not-applicable',
      },
      privilegeClaim: {
        isClaimed: { type: Boolean, default: false },
        type: {
          type: String,
          enum: ['attorney-client', 'work-product', 'joint-defense'],
        },
        description: { type: String },
        claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        claimedAt: { type: Date },
      },
    },

    // Metadata and Tracking
    metadata: {
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      tags: [{ type: String }],
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
      },
      dueDate: { type: Date },
      reminderDate: { type: Date },
      notes: [
        {
          content: { type: String },
          author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          createdAt: { type: Date, default: Date.now },
          isPrivate: { type: Boolean, default: false },
          type: {
            type: String,
            enum: ['general', 'review', 'action-required'],
          },
        },
      ],
    },

    // Archive and Status
    status: {
      isActive: { type: Boolean, default: true },
      isArchived: { type: Boolean, default: false },
      archivedAt: { type: Date },
      archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      archiveReason: { type: String },
    },
  },
  {
    timestamps: true,
    collection: 'documents',
  }
);

// Indexes for better query performance
documentSchema.index({ 'relationships.client': 1 });
documentSchema.index({ 'classification.type': 1 });
documentSchema.index({ 'processing.status': 1 });
documentSchema.index({ 'metadata.uploadedBy': 1 });
documentSchema.index({ 'fileInfo.filename': 1 });
documentSchema.index({ 'version.isLatest': 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ 'metadata.tags': 1 });
documentSchema.index({ 'access.allowedUsers': 1 });
documentSchema.index({ 'legal.legalHold.isActive': 1 });
documentSchema.index({ 'relationships.client': 1, 'classification.type': 1 });
documentSchema.index({ 'relationships.client': 1, createdAt: -1 });

// Virtuals
documentSchema.virtual('versionString').get(function () {
  return `${this.version.major}.${this.version.minor}`;
});

documentSchema.virtual('fullPath').get(function () {
  return this.fileInfo.path;
});

// Methods
documentSchema.methods.incrementVersion = function (major = false) {
  if (major) {
    this.version.major += 1;
    this.version.minor = 0;
  } else {
    this.version.minor += 1;
  }
  return this;
};

documentSchema.methods.logAccess = function (userId, action, ipAddress, userAgent) {
  this.access.accessLog.push({
    user: userId,
    action: action,
    ipAddress: ipAddress,
    userAgent: userAgent,
  });

  if (action === 'view') {
    this.access.viewCount += 1;
  } else if (action === 'download') {
    this.access.downloadCount += 1;
  }

  return this.save();
};

documentSchema.methods.updateProcessingStatus = function (status, details = {}) {
  this.processing.status = status;

  if (details.ocrResult) {
    this.processing.ocrStatus = details.ocrResult;
  }

  if (details.analysis) {
    this.processing.analysis = {
      ...this.processing.analysis,
      ...details.analysis
    };
  }

  return this.save();
};

documentSchema.methods.applyLegalHold = function (reason, userId) {
  this.legal.legalHold = {
    isActive: true,
    reason: reason,
    appliedBy: userId,
    appliedAt: new Date(),
  };
  return this.save();
};

documentSchema.methods.releaseLegalHold = function (userId) {
  this.legal.legalHold.isActive = false;
  this.legal.legalHold.releasedBy = userId;
  this.legal.legalHold.releasedAt = new Date();
  return this.save();
};

// Static methods
documentSchema.statics.findByClient = function (clientId, options = {}) {
  let query = this.find({ 'relationships.client': clientId });

  if (options.type) {
    query = query.where('classification.type').equals(options.type);
  }

  if (options.status) {
    query = query.where('processing.status').equals(options.status);
  }

  if (options.latestOnly) {
    query = query.where('version.isLatest').equals(true);
  }

  return query.sort({ createdAt: -1 });
};

documentSchema.statics.findByWorkflow = function (workflowId) {
  return this.find({ 'relationships.workflow': workflowId })
    .populate('relationships.client', 'contactInfo.firstName contactInfo.lastName')
    .sort({ createdAt: -1 });
};

// Pre-save middleware
documentSchema.pre('save', function (next) {
  // Auto-generate extension from filename if not provided
  if (!this.fileInfo.extension && this.fileInfo.originalName) {
    const ext = this.fileInfo.originalName.split('.').pop();
    if (ext) {
      this.fileInfo.extension = ext.toLowerCase();
    }
  }

  // Set destruction date based on retention period
  if (this.legal.retentionPeriod && !this.legal.destructionDate) {
    const destructionDate = new Date();
    destructionDate.setDate(destructionDate.getDate() + this.legal.retentionPeriod);
    this.legal.destructionDate = destructionDate;
  }

  next();
});

// Pre-remove middleware
documentSchema.pre('remove', async function (next) {
  // Update parent document if this is being replaced
  if (this.version.replacedBy) {
    await this.model('Document').updateOne(
      { _id: this.version.replacedBy },
      { 'version.isLatest': true }
    );
  }
  next();
});

module.exports = mongoose.model('Document', documentSchema);