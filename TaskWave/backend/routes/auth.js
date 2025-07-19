const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// In-memory storage for testing when MongoDB is not available
let inMemoryUsers = [];

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
    } else {
      // Use in-memory storage
      const existingUser = inMemoryUsers.find(u => u.username === username || u.email === email);
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };
      inMemoryUsers.push(newUser);
      res.status(201).json({ message: 'User registered successfully.' });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
      const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '1d' });
      res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } else {
      // Use in-memory storage
      const user = inMemoryUsers.find(u => u.username === username);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }
      const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get all users (for assignment)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      const users = await User.find({}, { _id: 1, username: 1, email: 1 });
      res.json(users.map(u => ({ _id: u._id, username: u.username, email: u.email })));
    } else {
      // Use in-memory storage
      const users = inMemoryUsers.map(u => ({ _id: u._id, username: u.username, email: u.email }));
      res.json(users);
    }
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router; 