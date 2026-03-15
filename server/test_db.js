const pool = require('./db');

async function testQuery() {
  try {
    const res = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC`
    );
    console.log('Query successful, found', res.rows.length, 'orders');
  } catch (err) {
    console.error('QUERY FAILED:', err.message);
  } finally {
    process.exit();
  }
}

testQuery();
