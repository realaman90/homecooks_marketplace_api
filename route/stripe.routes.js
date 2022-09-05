const express = require('express');
const router = express.Router();

const stripeController = require('../controllers/stripe.controller');

router.get('/setup_intent', stripeController.setupIntent);

module.exports = router;
