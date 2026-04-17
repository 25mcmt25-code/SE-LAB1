require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDb = require('./config/db');
const authRoutes = require('./routes/auth');
const farmerProfileRoutes = require('./routes/farmerProfile');
const profileBrowseRoutes = require('./routes/profileBrowse');
const marketplaceRoutes = require('./routes/marketplace');
const paymentsRoutes = require('./routes/payments');
const contractsRoutes = require('./routes/contracts');
const reportsRoutes = require('./routes/reports');
const supportRoutes = require('./routes/support');

const app = express();
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const localDevOrigins = ['http://localhost:4200', 'http://127.0.0.1:4200'];
const allowedOrigins = [...new Set([...configuredOrigins, ...localDevOrigins])];
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '5mb';

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || localOriginPattern.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ limit: requestBodyLimit, extended: true }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/farmer-profile', farmerProfileRoutes);
app.use('/api/profile-browse', profileBrowseRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/support', supportRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

connectDb();

module.exports = app;
