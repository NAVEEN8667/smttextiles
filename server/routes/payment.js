const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../db');
const { auth } = require('../middleware/authMiddleware');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailService');
const { generateOrderId } = require('../utils/generateOrderId');

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const isTestModeKey = typeof process.env.RAZORPAY_KEY_ID === 'string' && process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_');

async function isOrdersIdInteger(client) {
  const result = await client.query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_name = 'orders' AND column_name = 'id'
     LIMIT 1`
  );

  return result.rows[0]?.data_type === 'integer';
}


if (
  !process.env.RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET ||
  process.env.RAZORPAY_KEY_ID.includes('REPLACE') ||
  process.env.RAZORPAY_KEY_SECRET.includes('REPLACE')
) {
  console.error(
    ' RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set in .env. ' +
    'Get your live keys from https://dashboard.razorpay.com → Account & Settings → API Keys'
  );
}

if (isProduction && isTestModeKey) {
  console.error('Razorpay is configured with test keys in production. Replace rzp_test_* with live rzp_live_* keys.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});




router.post('/create-order', auth, async (req, res) => {

  if (
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.includes('REPLACE')
  ) {
    return res.status(503).json({
      message:
        'Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET with Razorpay live keys.',
    });
  }

  if (isProduction && isTestModeKey) {
    return res.status(503).json({
      message: 'Razorpay is still in test mode. Replace rzp_test_* credentials with live rzp_live_* credentials in production.',
    });
  }

  try {

    const cartItems = await pool.query(
      `SELECT c.product_id, c.quantity, p.price, p.name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }


    let totalAmountPaise = 0;
    for (const item of cartItems.rows) {
      totalAmountPaise += Math.round(parseFloat(item.price) * item.quantity * 100);
    }


    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      receipt: `receipt_user_${req.user.id}_${Date.now()}`,
    });

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error('Razorpay create-order error:', err?.error || err);
    const razorpayMsg = err?.error?.description || err?.message || 'Failed to create payment order';
    res.status(500).json({ message: razorpayMsg });
  }
});




router.post('/verify', auth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    address_id,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !address_id) {
    return res.status(400).json({ message: 'Missing required payment fields' });
  }


  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');


    const cartItems = await client.query(
      `SELECT c.product_id, c.quantity, p.price, p.name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }


    const addressRes = await client.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [address_id, req.user.id]
    );
    if (addressRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Address not found' });
    }
    const address = addressRes.rows[0];


    let totalAmount = 0;
    for (const item of cartItems.rows) {
      totalAmount += parseFloat(item.price) * item.quantity;
    }


    const useIntegerOrderId = await isOrdersIdInteger(client);
    let newOrder;

    if (useIntegerOrderId) {
      newOrder = await client.query(
        `INSERT INTO orders
           (user_id, total_amount, status, payment_status, address_id, delivery_address,
            razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method)
         VALUES ($1, $2, 'confirmed', 'paid', $3, $4, $5, $6, $7, 'online')
         RETURNING *`,
        [
          req.user.id,
          totalAmount,
          address.id,
          JSON.stringify(address),
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        ]
      );
    } else {
      const orderId = generateOrderId();
      newOrder = await client.query(
        `INSERT INTO orders
           (id, user_id, total_amount, status, payment_status, address_id, delivery_address,
            razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method)
         VALUES ($1, $2, $3, 'confirmed', 'paid', $4, $5, $6, $7, $8, 'online')
         RETURNING *`,
        [
          orderId,
          req.user.id,
          totalAmount,
          address.id,
          JSON.stringify(address),
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        ]
      );
    }

    const placedOrderId = newOrder.rows[0].id;


    for (const item of cartItems.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [placedOrderId, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE inventory SET quantity_available = quantity_available - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }


    await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');


    try {
      const userRes = await pool.query('SELECT name, email, phone_number FROM users WHERE id = $1', [req.user.id]);
      const user = userRes.rows[0];

      const orderData = {
        id: placedOrderId,
        created_at: newOrder.rows[0].created_at,
        total_amount: totalAmount,
        payment_method: 'online',
        payment_status: 'paid',
        delivery_address: address
      };

      const pdfBuffer = await generateInvoicePDF(orderData, cartItems.rows, user);
      await sendInvoiceEmail(user.email, pdfBuffer, placedOrderId);
    } catch (emailErr) {
      console.error('Error generating/sending invoice email for /verify:', emailErr);
    }

    res.json({
      message: 'Payment verified and order placed successfully!',
      orderId: placedOrderId,
      razorpay_payment_id,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Payment verify error:', err.message);
    res.status(500).json({ message: 'Failed to save order after payment' });
  } finally {
    client.release();
  }
});




router.post('/place-order-cod', auth, async (req, res) => {
  const { address_id } = req.body;

  if (!address_id) {
    return res.status(400).json({ message: 'Delivery address is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');


    const cartItems = await client.query(
      `SELECT c.product_id, c.quantity, p.price, p.name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }


    const addressRes = await client.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [address_id, req.user.id]
    );
    if (addressRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Address not found' });
    }
    const address = addressRes.rows[0];


    let totalAmount = 0;
    for (const item of cartItems.rows) {
      totalAmount += parseFloat(item.price) * item.quantity;
    }


    const useIntegerOrderId = await isOrdersIdInteger(client);
    let newOrder;

    if (useIntegerOrderId) {
      newOrder = await client.query(
        `INSERT INTO orders
           (user_id, total_amount, status, payment_status, address_id, delivery_address, payment_method)
         VALUES ($1, $2, 'pending', 'pending', $3, $4, 'cod')
         RETURNING *`,
        [req.user.id, totalAmount, address.id, JSON.stringify(address)]
      );
    } else {
      const orderId = generateOrderId();
      newOrder = await client.query(
        `INSERT INTO orders
           (id, user_id, total_amount, status, payment_status, address_id, delivery_address, payment_method)
         VALUES ($1, $2, $3, 'pending', 'pending', $4, $5, 'cod')
         RETURNING *`,
        [orderId, req.user.id, totalAmount, address.id, JSON.stringify(address)]
      );
    }

    const placedOrderId = newOrder.rows[0].id;


    for (const item of cartItems.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [placedOrderId, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE inventory SET quantity_available = quantity_available - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }


    await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');


    try {
      const userRes = await pool.query('SELECT name, email, phone_number FROM users WHERE id = $1', [req.user.id]);
      const user = userRes.rows[0];

      const orderData = {
        id: placedOrderId,
        created_at: newOrder.rows[0].created_at,
        total_amount: totalAmount,
        payment_method: 'cod',
        payment_status: 'pending',
        delivery_address: address
      };

      const pdfBuffer = await generateInvoicePDF(orderData, cartItems.rows, user);
      await sendInvoiceEmail(user.email, pdfBuffer, placedOrderId);
    } catch (emailErr) {
      console.error('Error generating/sending invoice email for /place-order-cod:', emailErr);
    }

    res.json({
      message: 'COD Order placed successfully!',
      orderId: placedOrderId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('COD Order error:', err.message);
    res.status(500).json({ message: 'Failed to place COD order' });
  } finally {
    client.release();
  }
});

module.exports = router;
