module.exports = {
  validClient: {
    name: 'Test Client',
    email: 'testclient@example.com',
    phone: '+1-555-123-4567',
    company: 'Test Company Inc.',
    caseType: 'personal-injury',
    status: 'active',
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
    phone: '',           // added
    company: '',         // added
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
