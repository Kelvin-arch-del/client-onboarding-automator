require('dotenv').config();
const amqp = require('amqplib');

async function startConsumer() {
  const url = process.env.RABBITMQ_URL;
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();

  // List of queues to consume
  const queues = [
    'OnboardingStarted',
    'OnboardingStepCompleted',
    'OnboardingCompleted'
  ];

  for (const q of queues) {
    await ch.assertQueue(q, { durable: true });
    ch.consume(q, msg => {
      if (msg !== null) {
        const content = msg.content.toString();
        console.log(`[Workflow Engine] Event on ${q}:`, content);
        ch.ack(msg);
        // TODO: invoke business logic based on event
      }
    });
    console.log(`[*] Listening for ${q} events`);
  }
}

startConsumer().catch(err => {
  console.error('Workflow Engine error:', err);
  process.exit(1);
});
