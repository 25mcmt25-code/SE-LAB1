require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDb = require('./config/db');
const authRoutes = require('./routes/auth');
const farmerProfileRoutes = require('./routes/farmerProfile');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/farmer-profile', farmerProfileRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

connectDb();

module.exports = app;
