const { Pool } = require('pg');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

async function initDb() {

  const rootPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
  });

  try {
    const client = await rootPool.connect();


    const dbCheck = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
    if (dbCheck.rowCount === 0) {
      console.log(`Database ${process.env.DB_NAME} not found. Creating...`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created.`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
    }
    client.release();
    await rootPool.end();


    const dbPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });


    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');


    schemaSql = schemaSql.replace(/\\c textile_db;/g, '');
    schemaSql = schemaSql.replace(/CREATE DATABASE textile_db;/g, '');

    console.log('Running schema migration...');
    await dbPool.query(schemaSql);
    console.log('Schema applied successfully.');

    await dbPool.end();

  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDb();
