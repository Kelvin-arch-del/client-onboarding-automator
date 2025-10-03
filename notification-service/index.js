require('dotenv').config();
const amqp = require('amqplib');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendEmail(to, subject, text) {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject,
      text
    };
    await sgMail.send(msg);
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Email send failed:', error);
  }
}

async function sendSMS(to, message) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to
    });
    console.log(`SMS sent to ${to}: ${message}`);
  } catch (error) {
    console.error('SMS send failed:', error);
  }
}

async function startNotificationService() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const ch = await conn.createChannel();

  // Listen for onboarding events
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

        // Handle different event types
        switch (queue) {
          case 'OnboardingStarted':
            await sendEmail(
              'client@example.com', // TODO: get from client data
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
