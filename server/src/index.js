const { connectDB } = require('./config/database');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  });
}

// Export app for testing
module.exports = app;
