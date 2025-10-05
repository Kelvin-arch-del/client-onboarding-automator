const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Client = require('../models/Client');

// Get all clients
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find()
      .select('name email company caseType phone status onboardingProgress')
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch clients', error: error.message });
  }
});

// Get single client
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch client', error: error.message });
  }
});

// Create new client
router.post('/', auth, async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create client', error: error.message });
  }
});

// Update client
router.put('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update client', error: error.message });
  }
});

module.exports = router;
