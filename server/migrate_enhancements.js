const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: Product and Order enhancements...');

   
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';
    `);

   
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'online';
    `);

    console.log('✅ Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
