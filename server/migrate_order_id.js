const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log("Dropping foreign key constraints...");
    await client.query('ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey');
    
    console.log("Modifying orders table...");
    await client.query('ALTER TABLE orders ALTER COLUMN id DROP DEFAULT');
    await client.query('ALTER TABLE orders ALTER COLUMN id TYPE VARCHAR(10)');
    
    console.log("Modifying order_items table...");
    await client.query('ALTER TABLE order_items ALTER COLUMN order_id TYPE VARCHAR(10)');
    
    console.log("Re-establishing foreign key constraints...");
    await client.query('ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE');
    
    await client.query('COMMIT');
    console.log("Migration successful: Order IDs are now VARCHAR(10)");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
