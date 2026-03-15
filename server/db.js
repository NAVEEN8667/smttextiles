const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const hasLocalDbConfig =
  process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_HOST &&
  process.env.DB_PORT &&
  process.env.DB_NAME;

if (!connectionString && !hasLocalDbConfig) {
  throw new Error(
    'Database configuration missing. Set DATABASE_URL for cloud deployments or DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME for local deployments.'
  );
}

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
      }
);

module.exports = pool;
