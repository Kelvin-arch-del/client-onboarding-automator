require('dotenv').config();
const amqp = require('amqplib');

// Only initialize external services if valid credentials exist
let sgMail, twilioClient;

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (SENDGRID_KEY && SENDGRID_KEY.startsWith('SG.')) {
  sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(SENDGRID_KEY);
  console.log('[Notification] SendGrid initialized');
} else {
  console.log('[Notification] SendGrid disabled - invalid API key');
}

if (TWILIO_SID && TWILIO_SID.startsWith('AC') && TWILIO_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
  console.log('[Notification] Twilio initialized');
} else {
  console.log('[Notification] Twilio disabled - invalid credentials');
}

async function sendEmail(to, subject, text) {
  if (!sgMail) {
    console.log(`[Notification] Email stub: ${subject} to ${to}`);
    return;
  }
  
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject,
      text
    };
    await sgMail.send(msg);
    console.log(`[Notification] Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('[Notification] Email send failed:', error.message);
  }
}

async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log(`[Notification] SMS stub: ${message} to ${to}`);
    return;
  }
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to
    });
    console.log(`[Notification] SMS sent to ${to}`);
  } catch (error) {
    console.error('[Notification] SMS send failed:', error.message);
  }
}

async function startNotificationService() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const ch = await conn.createChannel();

  const queues = [
    'OnboardingStarted',
    'OnboardingStepCompleted', 
    'OnboardingCompleted'
  ];

  for (const queue of queues) {
    await ch.assertQueue(queue, { durable: true });
    ch.consume(queue, async (msg) => {
      if (msg !== null) {
        const event = JSON.parse(msg.content.toString());
        console.log(`[Notification] Received ${queue}:`, event);

        switch (queue) {
          case 'OnboardingStarted':
            await sendEmail(
              'client@example.com',
              'Welcome - Onboarding Started',
              `Your onboarding process has begun. Client ID: ${event.clientId}`
            );
            break;
          
          case 'OnboardingStepCompleted':
            await sendEmail(
              'admin@yourfirm.com',
              'Step Completed',
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
      }
    });
    console.log(`[*] Listening for ${queue} notifications`);
  }
}

startNotificationService().catch(err => {
  console.error('Notification service error:', err);
  process.exit(1);
});
