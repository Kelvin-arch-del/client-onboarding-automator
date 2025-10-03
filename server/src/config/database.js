const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return mongoose.connection;
  
  // Use test DB when NODE_ENV=test, otherwise use main DB
  const uri = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_MONGO_URI 
    : process.env.MONGO_URI;
    
  if (!uri) {
    throw new Error('Database URI not found in environment variables');
  }
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = true;
    console.log('MongoDB connected:', uri.split('@')[1]); // Hide credentials
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (process.env.NODE_ENV === 'test') {
      throw new Error('Database connection failed (test mode)');
    }
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
};

module.exports = { connectDB, disconnectDB };
