const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { sendOTP } = require('../utils/emailService');


const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


router.post('/register', async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;


  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long and include letters, numbers, and special characters.'
    });
  }

  try {

    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {

      if (userCheck.rows[0].is_verified) {
        return res.status(400).json({ message: 'User already exists' });
      }

    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();
    const otpSecret = otp;





    if (userCheck.rows.length > 0) {

      await pool.query(
        'UPDATE users SET name = $1, password_hash = $2, otp_secret = $3, phone_number = $4 WHERE email = $5',
        [name, bcryptPassword, otpSecret, phoneNumber, email]
      );
    } else {

      await pool.query(
        'INSERT INTO users (name, email, password_hash, otp_secret, is_verified, phone_number) VALUES ($1, $2, $3, $4, FALSE, $5)',
        [name, email, bcryptPassword, otpSecret, phoneNumber]
      );
    }


    const emailSent = await sendOTP(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Error sending OTP email' });
    }

    res.json({ message: 'OTP sent to your email. Please verify.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.rows[0].is_verified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.rows[0].otp_secret !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }


    await pool.query('UPDATE users SET is_verified = TRUE, otp_secret = NULL WHERE email = $1', [email]);


    const payload = {
      user: {
        id: user.rows[0].id,
        role: user.rows[0].role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          message: 'Account verified successfully!',
          user: {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
            role: user.rows[0].role,
            phone_number: user.rows[0].phone_number
          }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    if (!user.rows[0].is_verified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.rows[0].id,
        role: user.rows[0].role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
            role: user.rows[0].role,
            phone_number: user.rows[0].phone_number
          }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
