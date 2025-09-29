// Jest global setup for test DB, teardown, and environment
const mongoose = require('mongoose');

beforeAll(async () => {
  const dbUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/client_onboarding_test';
  await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Optionally add global test helpers here
