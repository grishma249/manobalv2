const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/events', require('./routes/events'));
app.use('/api/contact', require('./routes/contact'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Manobal API is running' });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manobal')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

// Serve uploaded event images
const path = require('path');
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

