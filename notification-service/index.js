// notification-service/index.js

require('dotenv').config();
const amqp = require('amqplib');

// Retry logic for RabbitMQ connection
async function connectWithRetry(url, retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Notification] Connecting to RabbitMQ (attempt ${i + 1})...`);
      return await amqp.connect(url);
    } catch (err) {
      console.warn(`[Notification] Connection attempt ${i + 1} failed: ${err.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Unable to connect to RabbitMQ after multiple attempts');
}

// Initialize SendGrid and Twilio only if credentials are valid
let sgMail = null;
let twilioClient = null;

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (SENDGRID_KEY && SENDGRID_KEY.startsWith('SG.')) {
  sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(SENDGRID_KEY);
  console.log('[Notification] SendGrid initialized');
} else {
  console.log('[Notification] SendGrid disabled – invalid API key');
}

if (TWILIO_SID && TWILIO_SID.startsWith('AC') && TWILIO_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
  console.log('[Notification] Twilio initialized');
} else {
  console.log('[Notification] Twilio disabled – invalid credentials');
}

async function sendEmail(to, subject, text) {
  if (!sgMail) {
    console.log(`[Notification] (stub) Email to ${to}: ${subject}`);
    return;
  }
  try {
    await sgMail.send({ to, from: process.env.FROM_EMAIL, subject, text });
    console.log(`[Notification] Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('[Notification] Email send failed:', err.message);
  }
}

async function sendSMS(to, body) {
  if (!twilioClient) {
    console.log(`[Notification] (stub) SMS to ${to}: ${body}`);
    return;
  }
  try {
    await twilioClient.messages.create({ body, from: process.env.TWILIO_PHONE, to });
    console.log(`[Notification] SMS sent to ${to}`);
  } catch (err) {
    console.error('[Notification] SMS send failed:', err.message);
  }
}

async function startNotificationService() {
  const conn = await connectWithRetry(process.env.RABBITMQ_URL);
  const ch = await conn.createChannel();

  const queues = ['OnboardingStarted', 'OnboardingStepCompleted', 'OnboardingCompleted'];
  for (const queue of queues) {
    await ch.assertQueue(queue, { durable: true });
    ch.consume(queue, async msg => {
      if (!msg) return;
      const event = JSON.parse(msg.content.toString());
      console.log(`[Notification] Received ${queue}:`, event);

      switch (queue) {
        case 'OnboardingStarted':
          await sendEmail(
            'client@example.com',
            'Welcome – Onboarding Started',
            `Your onboarding has started. Client ID: ${event.clientId}`
          );
          break;
        case 'OnboardingStepCompleted':
          await sendEmail(
            'admin@yourfirm.com',
            'Onboarding Step Completed',
            `Client ${event.clientId} completed step ${event.stepId}`
          );
          break;
        case 'OnboardingCompleted':
          await sendEmail(
            'client@example.com',
            'Onboarding Complete!',
            `Congratulations! Your onboarding is complete. Client ID: ${event.clientId}`
          );
          break;
      }
      ch.ack(msg);
    });
    console.log(`[*] Listening for ${queue} notifications`);
  }
}

startNotificationService().catch(err => {
  console.error('[Notification] Service error:', err.message);
  process.exit(1);
});
