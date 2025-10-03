// Sample client fixture for tests
module.exports = {
  validClient: {
    name: 'Test Client',
    email: 'testclient@example.com',
    phone: '+1-555-123-4567',
    company: 'Test Company Inc.', // This was missing and required
    caseType: 'personal-injury',
    status: 'active', // Changed from 'inquiry' to valid enum value
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
    // Missing required fields for validation testing
    email: '',
    name: '',
    // phone missing
    // company missing
    // caseType missing
    // status missing
  },
  
  invalidClient: {
    name: 'Invalid Client',
    email: 'invalid-email', // Invalid email format
    phone: '123', // Invalid phone format
    company: 'Invalid Company',
    caseType: 'invalid-case-type', // Invalid enum
    status: 'invalid-status', // Invalid enum
    contactInfo: {
      firstName: 'Invalid',
      lastName: 'Client'
    }
  }
};
