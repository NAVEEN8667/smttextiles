const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const pool = require('./db');

const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());


app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/contact', require('./routes/contact'));

app.get('/', (req, res) => {
  res.send('Textile E-commerce API is running');
});

let hasLoggedDbReady = false;
const retryIntervalMs = Number(process.env.DB_RETRY_MS || 5000);

async function checkDbConnection() {
  try {
    await pool.query('SELECT 1');
    if (!hasLoggedDbReady) {
      console.log('Database connection established.');
      hasLoggedDbReady = true;
    }
  } catch (err) {
    hasLoggedDbReady = false;
    console.error(`Database unavailable, retrying in ${retryIntervalMs}ms: ${err.message}`);
  }
}

checkDbConnection();
setInterval(checkDbConnection, retryIntervalMs);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
