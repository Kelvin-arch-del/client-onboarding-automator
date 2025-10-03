const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  company: {
    type: String,
    required: true
  },
  caseType: {
    type: String,
    required: true,
    enum: ['personal-injury', 'general', 'corporate']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[1-9]?[0-9]{7,15}$/, 'Invalid phone number']
  },
  address: {
    type: String
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'active', 'completed', 'inactive'],
    default: 'pending'
  },
  onboardingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  onboarding: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'paused'],
      default: 'not_started'
    },
    currentStep: {
      type: Number,
      default: 0
    },
    steps: [{
      name: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      required: { type: Boolean, default: true }
    }],
    startedAt: Date,
    completedAt: Date,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
});

// Encryption configuration
const encKey = process.env.ENCRYPTION_KEY;
const sigKey = process.env.SIGNING_KEY;

// Apply encryption plugin to encrypt specific fields
clientSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ['name', 'email', 'notes']
});

// Update the updatedAt timestamp before saving
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Client', clientSchema);
