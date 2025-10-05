require('dotenv').config()
const mongoose = require('mongoose')
const Client = require('../src/models/Client')

const sampleClients = [
  /* as above */
]

async function seedClients() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')
    await Client.deleteMany({})
    console.log('Cleared existing clients')
    const clients = await Client.insertMany(sampleClients)
    console.log(`Seeded ${clients.length} clients`)
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seedClients()
