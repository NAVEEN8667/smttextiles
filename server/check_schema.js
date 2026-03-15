const pool = require('./db');

async function checkSchema() {
  try {
    const res = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'"
    );
    const res2 = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
    );
    const results = {
      orders: res.rows,
      users: res2.rows
    };
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('SCHEMA CHECK FAILED:', err.message);
  } finally {
    process.exit();
  }
}

checkSchema();
