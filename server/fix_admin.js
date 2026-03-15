const pool = require('./db');

async function checkUser(email) {
  try {
    const res = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log(`User ${email} not found.`);
      return;
    }
    const user = res.rows[0];
    console.log(`User: ${user.email}, Role: ${user.role}`);
    
    if (user.role !== 'admin') {
      console.log('Promoting user to admin...');
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
      console.log('User promoted successfully.');
    } else {
      console.log('User is already an admin.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

const email = process.argv[2] || 'uniqueuser123@gmail.com';
checkUser(email);
