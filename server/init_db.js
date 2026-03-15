require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('./db');

const { createPool, isUsingDatabaseUrl } = db;

async function initDb() {
  const schemaFileName = isUsingDatabaseUrl ? 'schema.neon.sql' : 'schema.sql';
  const schemaPath = path.join(__dirname, 'database', schemaFileName);
  let schemaSql = fs.readFileSync(schemaPath, 'utf8');

  schemaSql = schemaSql.replace(/\\c textile_db;/g, '');
  schemaSql = schemaSql.replace(/CREATE DATABASE textile_db;/g, '');

  if (isUsingDatabaseUrl) {
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

  const rootPool = createPool({ database: 'postgres' });

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


    const dbPool = createPool({ database: databaseName });

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
