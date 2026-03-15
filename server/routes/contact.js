const express = require('express');
const router = express.Router();
const pool = require('../db');




router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const newContact = await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, message]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      contact: newContact.rows[0]
    });
  } catch (err) {
    console.error('Contact Us Route Error:', err.message);
    res.status(500).json({ message: 'Server error while submitting message' });
  }
});

module.exports = router;
