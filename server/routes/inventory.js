const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, admin } = require('../middleware/authMiddleware');




router.get('/', auth, admin, async (req, res) => {
  try {
    const inventory = await pool.query(`
      SELECT i.product_id, p.name, i.quantity_available, i.last_updated
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY p.name ASC
    `);
    res.json(inventory.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.put('/:productId', auth, admin, async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  try {

    const updateInventory = await pool.query(
      'UPDATE inventory SET quantity_available = $1, last_updated = CURRENT_TIMESTAMP WHERE product_id = $2 RETURNING *',
      [quantity, productId]
    );

    if (updateInventory.rows.length === 0) {

      const newInventory = await pool.query(
        'INSERT INTO inventory (product_id, quantity_available) VALUES ($1, $2) RETURNING *',
        [productId, quantity]
      );
      return res.json(newInventory.rows[0]);
    }

    res.json(updateInventory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
