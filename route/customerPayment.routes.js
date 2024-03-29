const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');

router.get('/', orderController.getPaymentsFrCustomer);
router.get('/:paymentId', orderController.getSinglePaymentFrCustomer);

// udpate order cancelled delivered
router.put('/update_order/:orderId', orderController.updateOrder);

module.exports = router;