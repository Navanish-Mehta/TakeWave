const mongoose = require('mongoose');

const COLUMN_NAMES = ['Todo', 'In Progress', 'Done'];

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return !COLUMN_NAMES.includes(v);
      },
      message: props => `Task title cannot match column names: ${COLUMN_NAMES.join(', ')}`
    }
  },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: COLUMN_NAMES,
    default: 'Todo',
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

taskSchema.index({ title: 1 }, { unique: true });

module.exports = mongoose.model('Task', taskSchema); 