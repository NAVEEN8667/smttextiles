const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting Professional E-commerce Migration...');

   
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2)
    `);
    console.log('✓ Added discount_price to products');

   
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        size VARCHAR(50),
        color VARCHAR(50),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created product_variants table');

   
    await client.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS color VARCHAR(50)
    `);
    console.log('✓ Updated order_items with size and color');

   
   
    try {
      await client.query(`
        ALTER TABLE cart DROP CONSTRAINT IF EXISTS cart_pkey
      `);
    } catch (e) {
      console.log('Note: cart_pkey might not exist or already dropped');
    }

    await client.query(`
      ALTER TABLE cart 
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS color VARCHAR(50)
    `);

   
    await client.query(`UPDATE cart SET size = 'NA' WHERE size IS NULL`);
    await client.query(`UPDATE cart SET color = 'NA' WHERE color IS NULL`);

    await client.query(`
      ALTER TABLE cart 
      ADD PRIMARY KEY (user_id, product_id, size, color)
    `);
    console.log('✓ Updated cart primary key to (user_id, product_id, size, color)');

   
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'online'
    `);
    console.log('✓ Ensured payment_method exists in orders');

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
