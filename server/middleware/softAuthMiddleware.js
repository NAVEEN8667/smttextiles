const jwt = require('jsonwebtoken');
require('dotenv').config();



const softAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const hiddenDecoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = hiddenDecoded.user || null;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

module.exports = { softAuth };
