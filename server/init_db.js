const { Pool } = require('pg');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

const hasLocalDbConfig =
  process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_HOST &&
  process.env.DB_PORT &&
  process.env.DB_NAME;

if (!connectionString && !hasLocalDbConfig) {
  console.error(
    'Database configuration missing. Set DATABASE_URL for cloud deployments or DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME for local deployments.'
  );
  process.exit(1);
}

const createPool = (database) => {
  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database,
  });
};

async function initDb() {
  const schemaFileName = connectionString ? 'schema.neon.sql' : 'schema.sql';
  const schemaPath = path.join(__dirname, 'database', schemaFileName);
  let schemaSql = fs.readFileSync(schemaPath, 'utf8');

  schemaSql = schemaSql.replace(/\\c textile_db;/g, '');
  schemaSql = schemaSql.replace(/CREATE DATABASE textile_db;/g, '');

  if (connectionString) {
    const dbPool = createPool();
    try {
      console.log(`Running schema from ${schemaFileName} using DATABASE_URL...`);
      await dbPool.query(schemaSql);
      console.log('Schema applied successfully.');
    } catch (err) {
      console.error('Error initializing database with DATABASE_URL:', err);
      process.exit(1);
    } finally {
      await dbPool.end();
    }
    return;
  }

  const databaseName = process.env.DB_NAME;
  const escapedDatabaseName = String(databaseName).replace(/"/g, '""');

  const rootPool = createPool('postgres');

  try {
    const client = await rootPool.connect();


    const dbCheck = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (dbCheck.rowCount === 0) {
      console.log(`Database ${databaseName} not found. Creating...`);
      await client.query(`CREATE DATABASE "${escapedDatabaseName}"`);
      console.log(`Database ${databaseName} created.`);
    } else {
      console.log(`Database ${databaseName} already exists.`);
    }
    client.release();
    await rootPool.end();


    const dbPool = createPool(databaseName);

    console.log('Running schema migration...');
    await dbPool.query(schemaSql);
    console.log('Schema applied successfully.');

    await dbPool.end();

  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDb();
