const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/authMiddleware');




router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone_number, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.put('/', auth, async (req, res) => {
  const { name, phone_number } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, phone_number = $2 WHERE id = $3 RETURNING id, name, email, phone_number, role',
      [name.trim(), phone_number || null, req.user.id]
    );
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
