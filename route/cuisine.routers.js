const express = require('express');
const router = express.Router();

const cuisineController = require('../controllers/cuisine.controller');

router.post('/', cuisineController.createCuisine);
router.get('/list', cuisineController.getAllCuisine);
router.put('/update/:id', cuisineController.editCuisine)

module.exports = router;