const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  caseType: {
    type: String,
    required: true,
    enum: ['personal-injury', 'family-law', 'criminal-defense', 'estate-planning', 'business-law', 'immigration', 'employment-law', 'real-estate', 'other']
  },
  status: {
    type: String,
    required: true,
    enum: ['inquiry', 'consultation-scheduled', 'consultation-completed', 'retained', 'documents-gathering', 'case-preparation', 'active-litigation', 'settlement', 'closed', 'declined'],
    default: 'inquiry'
  },
  contactInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    },
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'mail'],
      default: 'email'
    }
  },
  caseDetails: {
    caseDescription: { type: String, required: true },
    dateOfIncident: Date,
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    estimatedValue: Number,
    referralSource: String,
    opposingParty: {
      name: String,
      attorney: String,
      insuranceCompany: String
    }
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Indexes for efficient querying
clientSchema.index({ email: 1 }, { unique: true });
clientSchema.index({ status: 1 });
clientSchema.index({ caseType: 1 });

module.exports = mongoose.model('Client', clientSchema);
