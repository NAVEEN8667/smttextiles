const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, admin } = require('../middleware/authMiddleware');
const { sendOrderStatusEmail } = require('../utils/emailService');
const { generateOrderId } = require('../utils/generateOrderId');

async function isOrdersIdInteger(client) {
  const result = await client.query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_name = 'orders' AND column_name = 'id'
     LIMIT 1`
  );

  return result.rows[0]?.data_type === 'integer';
}








router.get('/cart', auth, async (req, res) => {
  try {
    const cart = await pool.query(
      `SELECT c.*, p.name, p.price, p.image_url, p.discount_price 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json(cart.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.post('/cart', auth, async (req, res) => {
  const { productId, quantity, size, color } = req.body;
  const s = size || 'NA';
  const c = color || 'NA';

  try {

    const existingItem = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4',
      [req.user.id, productId, s, c]
    );

    if (existingItem.rows.length > 0) {

      const updateCart = await pool.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 AND size = $4 AND color = $5 RETURNING *',
        [quantity || 1, req.user.id, productId, s, c]
      );
      return res.json(updateCart.rows[0]);
    }


    const newItem = await pool.query(
      'INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, productId, quantity || 1, s, c]
    );
    res.json(newItem.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.put('/cart/:productId', auth, async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  try {
    if (quantity < 1) {
      await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
      return res.json({ message: 'Item removed' });
    }
    const update = await pool.query(
      'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
      [quantity, req.user.id, productId]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.delete('/cart/:productId', auth, async (req, res) => {
  const { productId } = req.params;
  try {
    await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});








router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');


    const cartItems = await client.query(
      `SELECT c.*, p.price, p.name 
             FROM cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }


    let totalAmount = 0;
    for (let item of cartItems.rows) {
      const activePrice = item.discount_price ? item.discount_price : item.price;
      totalAmount += parseFloat(activePrice) * item.quantity;
    }


    const useIntegerOrderId = await isOrdersIdInteger(client);
    let newOrder;
    if (useIntegerOrderId) {
      newOrder = await client.query(
        'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, totalAmount, 'pending']
      );
    } else {
      const orderId = generateOrderId();
      newOrder = await client.query(
        'INSERT INTO orders (id, user_id, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [orderId, req.user.id, totalAmount, 'pending']
      );
    }

    const placedOrderId = newOrder.rows[0].id;


    for (let item of cartItems.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, size, color) VALUES ($1, $2, $3, $4, $5, $6)',
        [placedOrderId, item.product_id, item.quantity, item.price, item.size, item.color]
      );


      await client.query(
        'UPDATE product_variants SET stock = stock - $1 WHERE product_id = $2 AND size = $3 AND color = $4',
        [item.quantity, item.product_id, item.size, item.color]
      );


      await client.query(
        'UPDATE inventory SET quantity_available = quantity_available - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }


    await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');
    res.json({ message: 'Order placed successfully', orderId: placedOrderId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});




router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(orders.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});








router.get('/admin', auth, admin, async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC`
    );
    res.json(orders.rows);
  } catch (err) {
    console.error('ADMIN ORDERS ERROR:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});




router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }


    if (order.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const items = await pool.query(
      `SELECT oi.*, p.name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      ...order.rows[0],
      items: items.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.put('/:id/cancel', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');


    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderRes.rows[0];


    if (order.status !== 'pending' && order.status !== 'packed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot cancel order that has been shipped or delivered' });
    }

    if (order.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Order is already cancelled' });
    }


    await client.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = $1",
      [req.params.id]
    );


    const orderItems = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [req.params.id]
    );

    for (let item of orderItems.rows) {

      await client.query(
        'UPDATE product_variants SET stock = stock + $1 WHERE product_id = $2 AND size = $3 AND color = $4',
        [item.quantity, item.product_id, item.size, item.color]
      );
      

      await client.query(
        'UPDATE inventory SET quantity_available = quantity_available + $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled successfully', orderId: order.id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});




router.put('/:id/action', auth, async (req, res) => {
  const { action } = req.body;
  try {
    const orderRes = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned or exchanged' });
    }

    let newStatus;
    if (action === 'return') {
      newStatus = 'return_requested';
    } else if (action === 'exchange') {
      newStatus = 'exchange_requested';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const update = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, req.params.id]
    );
    res.json(update.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});








router.put('/:id/status', auth, admin, async (req, res) => {
  const { status } = req.body;
  try {

    const currentOrder = await pool.query('SELECT status FROM orders WHERE id = $1', [req.params.id]);

    if (currentOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentStatus = currentOrder.rows[0].status;

    if (currentStatus === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update status of a cancelled order' });
    }


    if (currentStatus === 'delivered') {
      return res.status(400).json({ message: 'Cannot manually change status of a delivered order. Customer must initiate Return or Exchange.' });
    }

    const returnFlow = ['return_requested', 'quality_check', 'refund_initiated', 'refunded'];
    const exchangeFlow = ['exchange_requested', 'exchange_approved', 'exchange_shipped', 'exchange_delivered'];


    if (returnFlow.includes(currentStatus) && !returnFlow.includes(status)) {
      return res.status(400).json({ message: 'Invalid status change. Order is in Return Flow.' });
    }


    if (exchangeFlow.includes(currentStatus) && !exchangeFlow.includes(status)) {
      return res.status(400).json({ message: 'Invalid status change. Order is in Exchange Flow.' });
    }

    const updateOrder = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );


    try {
      if (updateOrder.rows.length > 0) {
        const orderData = updateOrder.rows[0];
        const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [orderData.user_id]);
        if (userRes.rows.length > 0) {
          await sendOrderStatusEmail(userRes.rows[0].email, orderData);
        }
      }
    } catch (emailErr) {
      console.error('Failed to send status update email:', emailErr);
    }

    res.json(updateOrder.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
