const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function (pw) { return bcrypt.compare(pw, this.password); };

// ── MenuItem ──────────────────────────────────────────────────────────────────
const menuSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  price:        { type: Number, required: true, min: 0 },
  category:     { type: String, required: true, enum: ['Burgers','Pizza','Asian','Mexican','Healthy','Italian','Desserts','Drinks'] },
  emoji:        { type: String, default: '🍽️' },
  image:        { type: String, default: '' },
  rating:       { type: Number, default: 4.5, min: 0, max: 5 },
  deliveryTime: { type: String, default: '20-30' },
  isPopular:    { type: Boolean, default: false },
  isAvailable:  { type: Boolean, default: true },
  calories:     { type: Number },
}, { timestamps: true });

menuSchema.index({ name: 'text', description: 'text' });

// ── Cart ──────────────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:     { type: String, required: true },
  emoji:    { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
});

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

cartSchema.virtual('total').get(function () {
  return this.items.reduce((s, i) => s + i.price * i.quantity, 0);
});
cartSchema.set('toJSON', { virtuals: true });

// ── Order ─────────────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:     { type: String, required: true },
  emoji:    { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:    [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax:      { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  total:    { type: Number, required: true },
  deliveryAddress: {
    street: { type: String, required: true },
    city:   { type: String, required: true },
    zip:    { type: String, required: true },
  },
  phone:         { type: String, required: true },
  paymentMethod: { type: String, enum: ['card','cash','wallet'], default: 'card' },
  status:        { type: String, enum: ['placed','preparing','out_for_delivery','delivered','cancelled'], default: 'placed' },
  statusHistory: [{ status: String, timestamp: { type: Date, default: Date.now } }],
  deliveryPartner: { name: String, phone: String, rating: Number },
  estimatedDelivery: Date,
  deliveredAt:       Date,
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (this.isModified('status')) this.statusHistory.push({ status: this.status });
  next();
});

module.exports = {
  User:     mongoose.model('User', userSchema),
  MenuItem: mongoose.model('MenuItem', menuSchema),
  Cart:     mongoose.model('Cart', cartSchema),
  Order:    mongoose.model('Order', orderSchema),
};
