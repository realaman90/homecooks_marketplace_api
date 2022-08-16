const express = require('express');
const router = express.Router();

const itemController = require('../controllers/item.controller');

// api for user dashboard
router.get('/list', itemController.ListProducts);

router.get('/item', itemController.getAllItemsForAdmin);
router.get('/', itemController.getAllItems);
router.get('/supplier/:supplierId', itemController.getAllItemsBySupplier);
router.get('/:itemId', itemController.getItem);

module.exports = router;