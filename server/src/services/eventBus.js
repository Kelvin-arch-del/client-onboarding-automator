// RabbitMQ event bus service
const amqp = require('amqplib');

let channel;

async function connectEventBus() {
  if (channel) return channel;
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  return channel;
}

async function publishEvent(queue, message) {
  const ch = await connectEventBus();
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
}

module.exports = { publishEvent };
