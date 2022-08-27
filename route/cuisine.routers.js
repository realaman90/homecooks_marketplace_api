const express = require('express');
const router = express.Router();

const cuisineController = require('../controllers/cuisine.controller');

router.post('/', cuisineController.createCuisine);
router.get('/list', cuisineController.getAllCuisine);

module.exports = router;