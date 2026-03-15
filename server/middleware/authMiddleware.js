const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {

  const token = req.header('x-auth-token');


  if (!token) {
    console.log('Auth Middleware: No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log(`Auth Middleware: Token verified for user ${req.user.id}, role: ${req.user.role}`);
    next();
  } catch (err) {
    console.error('Auth Middleware: Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' });
  }
};

module.exports = { auth, admin };
