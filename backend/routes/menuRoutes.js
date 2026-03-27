const { Router } = require('express');
const { getItems, getCategories, createItem, updateItem, deleteItem } = require('../controllers');
const { protect, adminOnly } = require('../middleware/auth');

const router = Router();
router.get('/categories', getCategories);
router.get('/',    getItems);
router.post('/',   protect, adminOnly, createItem);
router.put('/:id', protect, adminOnly, updateItem);
router.delete('/:id', protect, adminOnly, deleteItem);
module.exports = router;
