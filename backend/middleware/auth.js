const jwt  = require('jsonwebtoken');
const wrap = require('express-async-handler');
const { User } = require('../models');

const protect = wrap(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) { res.status(401); throw new Error('No token'); }
  try {
    const { id } = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(id).select('-password');
    if (!req.user) { res.status(401); throw new Error('User not found'); }
    next();
  } catch {
    res.status(401); throw new Error('Invalid token');
  }
});

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403); throw new Error('Admins only');
};

module.exports = { protect, adminOnly };
