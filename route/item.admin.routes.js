const express = require('express');
const router = express.Router();

const itemController = require('../controllers/item.controller');
router.get('/', itemController.getAllItemsForAdmin);
router.get('/:itemId', itemController.getItemByItemId);
module.exports = router;