const pool = require('./db');
require('dotenv').config();

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: new modules...');

    await client.query(`
      -- 1. Add phone_number to users if not exists
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

      -- 2. Addresses table
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(100) DEFAULT 'Home',
        street TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Add payment / address columns to orders
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES addresses(id);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(500);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    `);

    console.log('✅ Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
