const crypto = require('crypto');


const generateOrderId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
 
  const randomBytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
};

module.exports = { generateOrderId };
