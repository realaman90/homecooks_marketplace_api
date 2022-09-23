const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');

router.get('/', orderController.getCheckout);
router.put('/:paymentId/pick_up_address', orderController.updatePickupAddressOnOrder);
router.put('/:paymentId/payment_method', orderController.updatePaymentMethod);
router.get('/:paymentId/place_order', orderController.placeOrder);

// create payment intent
router.get('/:paymentId/payment_intent', orderController.CreatePaymentIntent);

module.exports = router;
