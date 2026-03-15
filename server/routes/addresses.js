const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/authMiddleware');




router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.post('/', auth, async (req, res) => {
  const { label, street, city, state, pincode, country, is_default } = req.body;

  if (!street || !city || !state || !pincode) {
    return res.status(400).json({ message: 'Street, city, state, and pincode are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

   
    if (is_default) {
      await client.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.id]
      );
    }

   
    const countRes = await client.query(
      'SELECT COUNT(*) FROM addresses WHERE user_id = $1',
      [req.user.id]
    );
    const isFirst = parseInt(countRes.rows[0].count) === 0;

    const result = await client.query(
      `INSERT INTO addresses (user_id, label, street, city, state, pincode, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        label || 'Home',
        street,
        city,
        state,
        pincode,
        country || 'India',
        is_default || isFirst,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});




router.put('/:id', auth, async (req, res) => {
  const { label, street, city, state, pincode, country } = req.body;

  if (!street || !city || !state || !pincode) {
    return res.status(400).json({ message: 'Street, city, state, and pincode are required' });
  }

  try {
   
    const check = await pool.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const result = await pool.query(
      `UPDATE addresses
       SET label = $1, street = $2, city = $3, state = $4, pincode = $5, country = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [label || 'Home', street, city, state, pincode, country || 'India', req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.delete('/:id', auth, async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = check.rows[0].is_default;
    await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

   
    if (wasDefault) {
      await pool.query(
        `UPDATE addresses SET is_default = TRUE
         WHERE id = (SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1)`,
        [req.user.id]
      );
    }

    res.json({ message: 'Address deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.put('/:id/default', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

   
    const check = await client.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Address not found' });
    }

   
    await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [req.user.id]);

   
    const result = await client.query(
      'UPDATE addresses SET is_default = TRUE WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

module.exports = router;
