const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  details: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

module.exports = mongoose.model('Log', logSchema); 