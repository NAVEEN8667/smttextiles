const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, admin } = require('../middleware/authMiddleware');
const { softAuth } = require('../middleware/softAuthMiddleware');
const { getKNearestNeighbors } = require('../utils/knnRecommender');




router.get('/', async (req, res) => {
  try {

    const products = await pool.query(
      `SELECT p.*, i.quantity_available as quantity 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.is_active = TRUE 
       ORDER BY p.created_at DESC`
    );
    res.json(products.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.get('/admin', auth, admin, async (req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.get('/recommendations', softAuth, async (req, res) => {
  try {

    const allProductsRes = await pool.query(
      `SELECT p.*, i.quantity_available as quantity 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.is_active = TRUE AND i.quantity_available > 0`
    );
    const allProducts = allProductsRes.rows;

    let targetProfile = [];


    if (req.user && req.user.id) {

      const pastOrdersRes = await pool.query(
        `SELECT p.id, p.category, p.price, p.rating
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.user_id = $1`,
        [req.user.id]
      );
      

      const currentCartRes = await pool.query(
        `SELECT p.id, p.category, p.price, p.rating
         FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = $1`,
        [req.user.id]
      );

      targetProfile = [...pastOrdersRes.rows, ...currentCartRes.rows];
    }


    const recommendations = getKNearestNeighbors(targetProfile, allProducts, 4);

    res.json(recommendations);
  } catch (err) {
    console.error('Error fetching ML recommendations:', err.message);
    res.status(500).send('Server Error');
  }
});




router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query(
      `SELECT p.*, i.quantity_available as quantity 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = $1 AND p.is_active = TRUE`,
      [id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variants = await pool.query('SELECT * FROM product_variants WHERE product_id = $1', [id]);
    
    res.json({
      ...product.rows[0],
      variants: variants.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.post('/', auth, admin, async (req, res) => {
  const { 
    name, description, price, discount_price, category, image_url, is_active,
    rating, reviews_count, images, variants 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const newProduct = await client.query(
      `INSERT INTO products 
       (name, description, price, discount_price, category, image_url, is_active, rating, reviews_count, images) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name, 
        description, 
        price, 
        discount_price || null,
        category, 
        image_url, 
        is_active !== undefined ? is_active : true,
        rating || 0,
        reviews_count || 0,
        JSON.stringify(images || [])
      ]
    );

    const productId = newProduct.rows[0].id;


    let totalStock = 0;
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await client.query(
          'INSERT INTO product_variants (product_id, size, color, stock) VALUES ($1, $2, $3, $4)',
          [productId, variant.size, variant.color, variant.stock || 0]
        );
        totalStock += (variant.stock || 0);
      }
    }


    await client.query(
      'INSERT INTO inventory (product_id, quantity_available) VALUES ($1, $2)',
      [productId, totalStock]
    );

    await client.query('COMMIT');
    res.json(newProduct.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});




router.put('/:id', auth, admin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;


  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.status(400).json({ message: 'No update data provided' });
  }

  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = Object.values(updates);
  values.push(id);

  try {
    const query = `UPDATE products SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const updateProduct = await pool.query(query, values);

    if (updateProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updateProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.delete('/:id', auth, admin, async (req, res) => {
  const { id } = req.params;
  try {

    const deleteProduct = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (deleteProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
