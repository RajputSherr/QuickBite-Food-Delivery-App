const { Router } = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const { Order, MenuItem, User } = require('../models');
const wrap = require('express-async-handler');

const router = Router();

// GET dashboard stats
router.get('/stats', protect, adminOnly, wrap(async (req, res) => {
  const [totalOrders, pendingOrders, deliveringOrders, deliveredOrders, cancelledOrders, revenueData, totalUsers, totalMenuItems, recentOrders] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'placed' }),
    Order.countDocuments({ status: { $in: ['preparing', 'out_for_delivery'] } }),
    Order.countDocuments({ status: 'delivered' }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    User.countDocuments({ role: 'user' }),
    MenuItem.countDocuments({ isAvailable: true }),
    Order.find().sort('-createdAt').limit(5).populate('user', 'name email'),
  ]);
  res.json({ totalOrders, pendingOrders, deliveringOrders, deliveredOrders, cancelledOrders, totalRevenue: revenueData[0]?.total || 0, totalUsers, totalMenuItems, recentOrders });
}));

// GET all orders
router.get('/orders', protect, adminOnly, wrap(async (req, res) => {
  const { status } = req.query;
  const query = status && status !== 'all' ? { status } : {};
  const orders = await Order.find(query).sort('-createdAt').populate('user', 'name email phone');
  res.json(orders);
}));

// UPDATE order status
router.patch('/orders/:id/status', protect, adminOnly, wrap(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.status = status;
  if (status === 'delivered') order.deliveredAt = new Date();
  await order.save();
  res.json(order);
}));

// GET all menu items (admin)
router.get('/menu', protect, adminOnly, wrap(async (req, res) => {
  res.json(await MenuItem.find().sort('-createdAt'));
}));

// CREATE menu item
router.post('/menu', protect, adminOnly, wrap(async (req, res) => {
  res.status(201).json(await MenuItem.create(req.body));
}));

// UPDATE menu item
router.put('/menu/:id', protect, adminOnly, wrap(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) { res.status(404); throw new Error('Item not found'); }
  res.json(item);
}));

// DELETE menu item
router.delete('/menu/:id', protect, adminOnly, wrap(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) { res.status(404); throw new Error('Item not found'); }
  res.json({ message: 'Deleted' });
}));

// GET all users
router.get('/users', protect, adminOnly, wrap(async (req, res) => {
  res.json(await User.find({ role: 'user' }).sort('-createdAt').select('-password'));
}));

module.exports = router;
