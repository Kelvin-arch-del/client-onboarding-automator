// Sample client fixture for tests
module.exports = {
  validClient: {
    name: 'Test Client',
    email: 'testclient@example.com',
    phone: '555-123-4567',
    caseType: 'personal-injury',
    status: 'inquiry',
    contactInfo: {
      firstName: 'Test',
      lastName: 'Client',
      address: { street: '123 Main St', city: 'Testville', state: 'TS', zipCode: '12345', country: 'USA' },
      preferredContactMethod: 'email'
    },
    caseDetails: {
      caseDescription: 'Test case',
      urgencyLevel: 'medium'
    }
  }
};
