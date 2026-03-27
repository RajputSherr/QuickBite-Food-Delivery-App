const jwt  = require('jsonwebtoken');
const wrap = require('express-async-handler');
const { User, MenuItem, Cart, Order } = require('../models');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const TAX  = 0.08;

// ── AUTH ──────────────────────────────────────────────────────────────────────
exports.register = wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error('All fields required'); }
  if (await User.findOne({ email })) { res.status(400); throw new Error('Email already registered'); }
  const user = await User.create({ name, email, password });
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: sign(user._id) });
});

exports.login = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Email and password required'); }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error('Invalid email or password'); }
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: sign(user._id) });
});

exports.getMe = wrap(async (req, res) => res.json(req.user));

// ── MENU ──────────────────────────────────────────────────────────────────────
exports.getItems = wrap(async (req, res) => {
  const { category, search } = req.query;
  const q = { isAvailable: true };
  if (category && category !== 'All') q.category = category;
  if (search) q.$text = { $search: search };
  res.json(await MenuItem.find(q).sort('-isPopular -rating'));
});

exports.getCategories = wrap(async (req, res) => {
  const cats = await MenuItem.distinct('category');
  res.json(['All', ...cats]);
});

exports.createItem  = wrap(async (req, res) => res.status(201).json(await MenuItem.create(req.body)));
exports.updateItem  = wrap(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) { res.status(404); throw new Error('Item not found'); }
  res.json(item);
});
exports.deleteItem  = wrap(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) { res.status(404); throw new Error('Item not found'); }
  res.json({ message: 'Deleted' });
});

// ── CART ──────────────────────────────────────────────────────────────────────
exports.getCart = wrap(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json(cart || { items: [], total: 0 });
});

exports.addToCart = wrap(async (req, res) => {
  const { menuItemId, quantity = 1 } = req.body;
  const mi = await MenuItem.findById(menuItemId);
  if (!mi || !mi.isAvailable) { res.status(404); throw new Error('Item not available'); }

  let cart = await Cart.findOne({ user: req.user._id }) || new Cart({ user: req.user._id, items: [] });
  const existing = cart.items.find(i => i.menuItem.toString() === menuItemId);
  if (existing) { existing.quantity += quantity; }
  else { cart.items.push({ menuItem: mi._id, name: mi.name, emoji: mi.emoji, price: mi.price, quantity }); }
  await cart.save();
  res.json(cart);
});

exports.updateCartItem = wrap(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }
  const item = cart.items.id(req.params.itemId);
  if (!item) { res.status(404); throw new Error('Item not in cart'); }
  if (req.body.quantity <= 0) item.deleteOne();
  else item.quantity = req.body.quantity;
  await cart.save();
  res.json(cart);
});

exports.removeFromCart = wrap(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }
  const item = cart.items.id(req.params.itemId);
  if (!item) { res.status(404); throw new Error('Item not in cart'); }
  item.deleteOne();
  await cart.save();
  res.json(cart);
});

exports.clearCart = wrap(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ message: 'Cart cleared' });
});

// ── ORDERS ────────────────────────────────────────────────────────────────────
exports.placeOrder = wrap(async (req, res) => {
  const { items, deliveryAddress, phone, paymentMethod } = req.body;
  if (!items?.length) { res.status(400); throw new Error('No items in order'); }

  const orderItems = await Promise.all(items.map(async i => {
    const mi = await MenuItem.findById(i.menuItem);
    if (!mi) throw new Error(`Item ${i.menuItem} not found`);
    return { menuItem: mi._id, name: mi.name, emoji: mi.emoji, price: mi.price, quantity: i.quantity };
  }));

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax      = +(subtotal * TAX).toFixed(2);
  const total    = +(subtotal + tax).toFixed(2);

  const order = await Order.create({
    user: req.user._id, items: orderItems, subtotal, tax, total,
    deliveryAddress, phone, paymentMethod,
    estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000),
    statusHistory: [{ status: 'placed' }],
    deliveryPartner: { name: 'Ravi Kumar', phone: '+91 98765 43210', rating: 4.9 },
  });

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.status(201).json(order);
});

exports.getOrders = wrap(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort('-createdAt'));
});

exports.getOrder = wrap(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  res.json(order);
});

exports.cancelOrder = wrap(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  if (['out_for_delivery','delivered'].includes(order.status)) { res.status(400); throw new Error('Cannot cancel at this stage'); }
  order.status = 'cancelled';
  await order.save();
  res.json(order);
});

exports.updateStatus = wrap(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (req.body.status === 'delivered') { order.deliveredAt = new Date(); await order.save(); }
  res.json(order);
});
