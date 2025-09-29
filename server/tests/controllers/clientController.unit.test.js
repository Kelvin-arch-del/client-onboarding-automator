const clientFixture = require('../fixtures/client.fixture');
const Client = require('../../src/models/Client');

describe('Client Controller - Unit', () => {
  it('should validate required fields for client', async () => {
    const client = new Client({});
    let err;
    try {
      await client.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.caseType).toBeDefined();
    expect(err.errors.status).toBeDefined();
  });

  it('should create a valid client', async () => {
    const client = new Client(clientFixture.validClient);
    await expect(client.validate()).resolves.toBeUndefined();
  });
});
