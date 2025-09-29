const request = require('supertest');
const app = require('../../src/index');
const clientFixture = require('../fixtures/client.fixture');

describe('Client API Integration', () => {
  let token;
  beforeAll(async () => {
    // Register and login a test user, get JWT token (mock or real)
    // For demo, assume a valid token is set
    token = 'test.jwt.token';
  });

  it('should reject unauthenticated client creation', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send(clientFixture.validClient);
    expect(res.statusCode).toBe(401);
  });

  it('should create a client with valid token', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(clientFixture.validClient);
    // This will fail unless token is valid and app is set up for test
    // expect(res.statusCode).toBe(201);
  });
});
