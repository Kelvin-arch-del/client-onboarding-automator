const app = require('../../src/app');
const request = require('supertest');

describe('Authentication', () => {
  it('should return 400 if email or password missing on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '' });
    expect(res.statusCode).toBe(400);
  });
  // Add more tests (successful login, JWT validation, etc.)
});
