const pool = require('./db');

const migrate = async () => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)');
    console.log('Successfully added phone_number column to users table.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    pool.end();
  }
};

migrate();
