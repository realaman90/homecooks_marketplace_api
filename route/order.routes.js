const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);

router.get('/:orderId', orderController.getOrderById);
router.put('/:orderId', orderController.editOrder);
router.delete('/:orderId', orderController.deleteOrder);

// customer orders
// router.get('/customer/:customerId', orderController.getCustomerOrders);
// group orders
// router.get('/group/:groupId', orderController.getCustomerOrders);
// supplier orders
// router.get('/supplier/:supplierId', orderController.getCustomerOrders);

module.exports = router;
