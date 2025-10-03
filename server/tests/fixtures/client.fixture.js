// server/tests/fixtures/client.fixture.js
module.exports = {
  validClient: {
    name: 'Test Client',
    email: 'testclient@example.com',
    phone: '+15551234567',          // digits only per regex
    company: 'Test Company Inc.',
    caseType: 'general',            // valid enum value
    status: 'active',               // valid enum value
    contactInfo: {
      firstName: 'Test',
      lastName: 'Client',
      address: {
        street: '123 Main St',
        city: 'Testville',
        state: 'TS',
        zipCode: '12345',
        country: 'USA'
      },
      preferredContactMethod: 'email'
    },
    caseDetails: {
      caseDescription: 'Test case for personal injury',
      urgencyLevel: 'medium'
    },
    onboarding: {
      status: 'not_started',
      currentStep: 0,
      steps: [],
      progress: 0
    }
  },

  incompleteClient: {
    name: '',
    email: '',
    phone: '',
    company: '',
    caseType: '',
    status: '',
    contactInfo: {},
    caseDetails: {}
  },

  invalidClient: {
    name: 'Invalid Client',
    email: 'invalid-email',
    phone: '123',
    company: 'Invalid Company',
    caseType: 'invalid-case-type',
    status: 'invalid-status',
    contactInfo: {},
    caseDetails: {}
  }
};
