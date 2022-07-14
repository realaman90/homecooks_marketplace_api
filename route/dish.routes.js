const express = require('express');
const router = express.Router();

const dishController = require('../controllers/dish.controller');

router.post('/', dishController.createDish);
router.get('/', dishController.getAllDishs);
router.get('/supplier/:supplierId', dishController.getAllDishsBySupplier);
router.get('/:dishId', dishController.getDish);
router.put('/:dishId', dishController.editDish);
router.delete('/:dishId', dishController.deleteDish);

module.exports = router;
