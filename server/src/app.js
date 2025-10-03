const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Import middleware
const { authLimiter, securityHeaders } = require('./middleware/security');

// Apply middleware
app.use(securityHeaders);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Add after middleware setup
app.use(express.static('public'));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
// Add other routes here as needed

app.use('/api/onboarding', require('./routes/onboarding'));

// Client routes
app.use('/api/clients', require('./routes/clients'));

// Export ONLY the app (no server start)
module.exports = app;
