require('dotenv').config();
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const uri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Atlas connection successful:', uri);
  mongoose.connection.close();
}).catch(err => {
  console.error('Atlas connection failed:', err.message);
});
