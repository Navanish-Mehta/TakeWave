const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "https://task-wave-xi.vercel.app", credentials: true }));
app.use(express.json());

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/task');
const logRoutes = require('./routes/log');
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'TaskWave backend is running.',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection
const startServer = () => {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });
    app.set('io', io);
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
};

// Try to connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskwave', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected successfully');
    startServer();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting server without MongoDB (using in-memory storage)...');
    // Start server anyway for testing
    startServer();
  }); 