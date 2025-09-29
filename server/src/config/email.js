const nodemailer = require('nodemailer');

/**
 * Email configuration using Nodemailer with SMTP settings from environment variables
 * TODO: Configure with your preferred email provider (Gmail, SendGrid, AWS SES, etc.)
 */

// Create transporter with environment variables
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  // For development, allow self-signed certificates
  if (process.env.NODE_ENV === 'development') {
    config.tls = {
      rejectUnauthorized: false
    };
  }

  return nodemailer.createTransporter(config);
};

// Email sender configuration
const emailConfig = {
  from: process.env.EMAIL_FROM || '"Client Onboarding" <noreply@yourcompany.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@yourcompany.com',
  // Base URL for unsubscribe links and tracking
  baseUrl: process.env.CLIENT_APP_URL || 'http://localhost:3000'
};

// Test email connection
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
};

module.exports = {
  createTransporter,
  emailConfig,
  verifyConnection
};

// TODO: Add environment variables to .env file:
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_SECURE=false
// SMTP_USER=your-email@gmail.com
// SMTP_PASS=your-app-password
// EMAIL_FROM="Your Company" <noreply@yourcompany.com>
// EMAIL_REPLY_TO=support@yourcompany.com
// CLIENT_APP_URL=http://localhost:3000