const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Log = require('../models/Log');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory storage for testing when MongoDB is not available
let inMemoryTasks = [];
let inMemoryLogs = [];
let inMemoryUsers = [
  {
    _id: '1',
    username: 'Navanish',
    email: 'navanish@example.com'
  }
];

// Create Task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority } = req.body;
    console.log('Creating task with data:', { title, description, assignedTo, status, priority });
    
    if (!title || !status || !priority) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    
    // Check title not matching column names
    const COLUMN_NAMES = ['Todo', 'In Progress', 'Done'];
    if (COLUMN_NAMES.includes(title)) {
      return res.status(400).json({ message: 'Task title cannot match column names.' });
    }
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      // Check for unique title
      const existing = await Task.findOne({ title });
      if (existing) {
        return res.status(400).json({ message: 'Task title must be unique.' });
      }
      // Check assigned user exists if provided
      if (assignedTo) {
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(400).json({ message: 'Assigned user does not exist.' });
        }
    }
    const task = new Task({
      title,
      description,
        assignedTo: assignedTo || req.user.id,
      status,
      priority,
      createdBy: req.user.id
    });
    await task.save();
    // Log action
    const newLog = await Log.create({
      user: req.user.id,
      action: 'create',
      task: task._id,
      details: { title, assignedTo, status, priority }
    });
    req.app.get('io').emit('logCreated', newLog);
    // Emit real-time event
    req.app.get('io').emit('taskCreated', task);
    res.status(201).json(task);
    } else {
      // Use in-memory storage
      // Check for unique title
      const existing = inMemoryTasks.find(t => t.title === title);
      if (existing) {
        return res.status(400).json({ message: 'Task title must be unique.' });
      }
      const newTask = {
        _id: Date.now().toString(),
        title,
        description,
        assignedTo: assignedTo || req.user.id,
        status,
        priority,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryTasks.push(newTask);
      // Log action
      const newLog = {
        _id: Date.now().toString(),
        user: req.user.id,
        action: 'create',
        task: newTask._id,
        details: { title, assignedTo, status, priority },
        timestamp: new Date()
      };
      inMemoryLogs.push(newLog);
      req.app.get('io').emit('logCreated', newLog);
      // Emit real-time event
      req.app.get('io').emit('taskCreated', newTask);
      res.status(201).json(newTask);
    }
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get All Tasks
router.get('/', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
    const tasks = await Task.find().populate('assignedTo', 'username email').populate('createdBy', 'username email');
    res.json(tasks);
    } else {
      // Use in-memory storage
      res.json(inMemoryTasks);
    }
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update Task with conflict detection
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, updatedAt } = req.body;
    const COLUMN_NAMES = ['Todo', 'In Progress', 'Done'];
    if (title && COLUMN_NAMES.includes(title)) {
      return res.status(400).json({ message: 'Task title cannot match column names.' });
    }
    if (title) {
      const existing = await Task.findOne({ title, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: 'Task title must be unique.' });
      }
    }
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(400).json({ message: 'Assigned user does not exist.' });
      }
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    // Conflict detection
    if (updatedAt && new Date(updatedAt).getTime() < new Date(task.updatedAt).getTime()) {
      return res.status(409).json({
        message: 'Conflict detected. Task has been updated by another user.',
        serverTask: task,
        clientTask: { ...req.body }
      });
    }
    // Proceed with update
    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.assignedTo = assignedTo ?? task.assignedTo;
    task.status = status ?? task.status;
    task.priority = priority ?? task.priority;
    await task.save();
    // Log action
    const newLog = await Log.create({
      user: req.user.id,
      action: 'update',
      task: task._id,
      details: { ...req.body }
    });
    req.app.get('io').emit('logCreated', newLog);
    // Emit real-time event
    req.app.get('io').emit('taskUpdated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Conflict resolution route: force update (overwrite or merge)
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    await task.save();
    // Log action
    const newLog = await Log.create({
      user: req.user.id,
      action: 'resolve_conflict',
      task: task._id,
      details: { ...req.body }
    });
    req.app.get('io').emit('logCreated', newLog);
    // Emit real-time event
    req.app.get('io').emit('taskUpdated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Smart Assign: assign task to user with fewest active tasks
router.post('/:id/smart-assign', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }
      // Find all users
      const users = await User.find();
      if (!users.length) {
        return res.status(400).json({ message: 'No users found.' });
      }
      // Count active tasks for each user
      const counts = await Promise.all(users.map(async (user) => {
        const count = await Task.countDocuments({ assignedTo: user._id, status: { $ne: 'Done' } });
        return { user, count };
      }));
      // Find user with fewest active tasks
      const minCount = Math.min(...counts.map(c => c.count));
      const candidates = counts.filter(c => c.count === minCount);
      // If multiple, pick the first (or random)
      const selected = candidates[0].user;
      // Assign task
      task.assignedTo = selected._id;
      await task.save();
      // Log action
      const newLog = await Log.create({
        user: req.user.id,
        action: 'smart_assign',
        task: task._id,
        details: { assignedTo: selected._id, username: selected.username }
      });
      req.app.get('io').emit('logCreated', newLog);
      // Emit real-time event
      req.app.get('io').emit('taskUpdated', task);
      res.json({ message: 'Task smart-assigned.', task });
    } else {
      // Use in-memory storage
      const task = inMemoryTasks.find(t => t._id === req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }
      // Find all users
      const users = inMemoryUsers;
      if (!users.length) {
        return res.status(400).json({ message: 'No users found.' });
      }
      // Count active tasks for each user
      const counts = users.map(user => {
        const count = inMemoryTasks.filter(t => 
          t.assignedTo === user._id && t.status !== 'Done'
        ).length;
        return { user, count };
      });
      // Find user with fewest active tasks
      const minCount = Math.min(...counts.map(c => c.count));
      const candidates = counts.filter(c => c.count === minCount);
      // If multiple, pick the first (or random)
      const selected = candidates[0].user;
      // Assign task
      task.assignedTo = selected._id;
      task.updatedAt = new Date();
      // Log action
      const newLog = {
        _id: Date.now().toString(),
        user: req.user.id,
        action: 'smart_assign',
        task: task._id,
        details: { assignedTo: selected._id, username: selected.username },
        timestamp: new Date()
      };
      inMemoryLogs.push(newLog);
      req.app.get('io').emit('logCreated', newLog);
      // Emit real-time event
      req.app.get('io').emit('taskUpdated', task);
      res.json({ message: 'Task smart-assigned.', task });
    }
  } catch (err) {
    console.error('Smart assign error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete Task
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    // Log action
    const newLog = await Log.create({
      user: req.user.id,
      action: 'delete',
      task: req.params.id,
      details: { title: deleted.title }
    });
    req.app.get('io').emit('logCreated', newLog);
    // Emit real-time event
    req.app.get('io').emit('taskDeleted', { _id: req.params.id });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router; 