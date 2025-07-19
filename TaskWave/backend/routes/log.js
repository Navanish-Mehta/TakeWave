const express = require('express');
const Log = require('../models/Log');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// In-memory storage for logs when MongoDB is not available
let inMemoryLogs = [];

// Get last 20 actions
router.get('/', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
    const logs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('user', 'username email')
      .populate('task', 'title');
    res.json(logs);
    } else {
      // Use in-memory storage
      const logs = inMemoryLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);
      res.json(logs);
    }
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router; 