const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

function getLocalDbConfig(databaseOverride) {
  const database = databaseOverride || process.env.DB_NAME;

  const hasLocalDbConfig =
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_HOST &&
    process.env.DB_PORT &&
    database;

  if (!hasLocalDbConfig) {
    throw new Error(
      'Local database configuration is incomplete. Set DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, and DB_NAME for local development.'
    );
  }

  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database,
  };
}

function getPoolConfig(options = {}) {
  const { database } = options;

  if (connectionString) {
    return {
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  if (isProduction) {
    throw new Error('DATABASE_URL is required in production (Render/Neon).');
  }

  return getLocalDbConfig(database);
}

function createPool(options = {}) {
  return new Pool(getPoolConfig(options));
}

const pool = createPool();

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

async function verifyConnection() {
  await pool.query('SELECT 1');
}

module.exports = pool;
module.exports.createPool = createPool;
module.exports.getPoolConfig = getPoolConfig;
module.exports.verifyConnection = verifyConnection;
module.exports.isUsingDatabaseUrl = Boolean(connectionString);
