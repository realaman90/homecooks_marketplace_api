const express = require('express');
const router = express.Router();

const stripeController = require('../controllers/stripe.controller');

router.get('/payment_methods', stripeController.paymentMethodList);
router.get('/setup_intent', stripeController.setupIntent);
router.get('/attach_pm/:payment_method', stripeController.attachPaymentMethod);
router.get('/detach_pm/:payment_method', stripeController.detachPaymentMethod);


module.exports = router;
