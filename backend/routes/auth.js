const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

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
      return res.status(400).json({ message: 'Invalid Username.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password' });
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

// Password reset - request OTP
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Generate 6-digit OTP and expiry (10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found.' });
      user.resetCode = otp;
      user.resetCodeExpiry = expiry;
      await user.save();
    } else {
      // In-memory fallback
      const user = inMemoryUsers.find(u => u.email === email);
      if (!user) return res.status(404).json({ message: 'User not found.' });
      user.resetCode = otp;
      user.resetCodeExpiry = expiry;
    }

    // Send email via Nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'TaskWave Password Reset Code',
      text: `Your TaskWave password reset code is ${otp}. It expires in 10 minutes.`,
    };

    // Don't block on email send for too long
    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Request reset error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Password reset - verify OTP and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required.' });
    }

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found.' });
      if (!user.resetCode || !user.resetCodeExpiry) {
        return res.status(400).json({ message: 'No reset request found.' });
      }
      if (user.resetCode !== code || user.resetCodeExpiry < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired code.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetCode = null;
      user.resetCodeExpiry = null;
      await user.save();
    } else {
      user = inMemoryUsers.find(u => u.email === email);
      if (!user) return res.status(404).json({ message: 'User not found.' });
      if (!user.resetCode || !user.resetCodeExpiry) {
        return res.status(400).json({ message: 'No reset request found.' });
      }
      if (user.resetCode !== code || user.resetCodeExpiry < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired code.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetCode = null;
      user.resetCodeExpiry = null;
    }

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});