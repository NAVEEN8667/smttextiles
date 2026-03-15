const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const pool = require('./db');

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.warn(`Missing environment variables: ${missingEnv.join(', ')}`);
}

const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  'https://smttextiles.vercel.app',
  'http://localhost:5173',
  ...configuredOrigins,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.use((err, req, res, next) => {
  if (err && err.message && err.message.toLowerCase().includes('cors')) {
    console.error(`CORS error for origin ${req.headers.origin || 'unknown'}: ${err.message}`);
    return res.status(403).json({ message: 'CORS blocked this request origin' });
  }

  return next(err);
});


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
