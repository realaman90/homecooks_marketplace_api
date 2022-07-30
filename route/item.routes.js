const express = require('express');
const router = express.Router();

const itemController = require('../controllers/item.controller');

router.get('/', itemController.getAllItems);
router.get('/supplier/:supplierId', itemController.getAllItemsBySupplier);
router.get('/:itemId', itemController.getItem);

module.exports = router;
