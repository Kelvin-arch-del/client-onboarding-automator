require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../src/models/Client');

const sampleClients = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'Doe Industries',
    caseType: 'corporate',
    phone: '+1234567890',
    address: '123 Main St, Anytown, USA',
    notes: 'New client referral from partner firm',
    status: 'pending',
    onboardingProgress: 0,
    onboarding: {
      status: 'not_started',
      currentStep: 0,
      steps: [
        { name: 'Document Collection', required: true },
        { name: 'Background Check', required: true },
        { name: 'Contract Signing', required: true },
        { name: 'Payment Setup', required: false }
      ],
      progress: 0
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    company: 'Smith & Associates',
    caseType: 'personal-injury',
    phone: '+1234567891',
    address: '456 Oak Ave, Somewhere, USA',
    notes: 'Motor vehicle accident case',
    status: 'active',
    onboardingProgress: 25,
    onboarding: {
      status: 'in_progress',
      currentStep: 1,
      steps: [
        { name: 'Document Collection', completed: true, completedAt: new Date() },
        { name: 'Medical Records', required: true },
        { name: 'Insurance Claims', required: true },
        { name: 'Settlement Negotiation', required: false }
      ],
      startedAt: new Date(),
      progress: 25
    }
  },
  {
    name: 'Robert Johnson',
    email: 'bob.johnson@example.com',
    company: 'Johnson Corp',
    caseType: 'general',
    phone: '+1234567892',
    address: '789 Pine St, Elsewhere, USA',
    notes: 'Contract dispute resolution',
    status: 'pending',
    onboardingProgress: 0,
    onboarding: {
      status: 'not_started',
      currentStep: 0,
      steps: [
        { name: 'Initial Consultation', required: true },
        { name: 'Document Review', required: true },
        { name: 'Strategy Planning', required: true }
      ],
      progress: 0
    }
  }
];

async function seedClients() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    await Client.deleteMany({});
    console.log('Cleared existing clients');
    
    const clients = await Client.insertMany(sampleClients);
    console.log(`Seeded ${clients.length} clients`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedClients();
