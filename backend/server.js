require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/authRoutes'));
app.use('/api/menu',   require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart',   require('./routes/cartRoutes'));
app.use('/api/admin',  require('./routes/adminRoutes')); // ← NEW


app.get('/api/health', (_, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const code = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.name === 'CastError')       return res.status(400).json({ message: 'Invalid ID' });
  if (err.code === 11000)             return res.status(400).json({ message: `${Object.keys(err.keyValue)[0]} already in use` });
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  res.status(code).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT} [${process.env.NODE_ENV}]`));
