process.env.NODE_ENV = 'test';
require('dotenv').config();

const { connectDB, disconnectDB } = require('../src/config/database');
const mongoose = require('mongoose');

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await disconnectDB();
});
