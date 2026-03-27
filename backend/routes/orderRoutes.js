const { Router } = require('express');
const { placeOrder, getOrders, getOrder, cancelOrder, updateStatus } = require('../controllers');
const { protect, adminOnly } = require('../middleware/auth');

const router = Router();
router.post('/',            protect, placeOrder);
router.get('/',             protect, getOrders);
router.get('/:id',          protect, getOrder);
router.patch('/:id/cancel', protect, cancelOrder);
router.patch('/:id/status', protect, adminOnly, updateStatus);
module.exports = router;
