// server/src/routes/clients.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Create client (stub)
router.post('/', auth, async (req, res) => {
  // In real impl, you'd create the client here
  res.status(201).json({ success: true, data: req.body });
});

module.exports = router;
