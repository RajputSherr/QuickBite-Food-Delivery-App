const { Router } = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers');
const { protect } = require('../middleware/auth');

const router = Router();
router.get('/',           protect, getCart);
router.post('/',          protect, addToCart);
router.put('/:itemId',    protect, updateCartItem);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/',        protect, clearCart);
module.exports = router;
