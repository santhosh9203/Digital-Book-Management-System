const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyOrders, cancelOrder, returnOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/my-orders', authenticate, getMyOrders);
router.patch('/:id/cancel', authenticate, cancelOrder);
router.patch('/:id/return', authenticate, returnOrder);

module.exports = router;
