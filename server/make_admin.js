const pool = require('./db');

const email = process.argv[2];

if (!email) {
  console.log('Please provide an email address.');
  console.log('Usage: node make_admin.js <email>');
  process.exit(1);
}

const makeAdmin = async () => {
  try {
    const res = await pool.query(
      "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING *",
      [email]
    );

    if (res.rows.length === 0) {
      console.log(`User with email ${email} not found.`);
    } else {
      console.log(`Success! User ${res.rows[0].name} (${email}) is now an Admin.`);
    }
  } catch (err) {
    console.error('Error updating role:', err.message);
  } finally {
    pool.end();
  }
};

makeAdmin();
