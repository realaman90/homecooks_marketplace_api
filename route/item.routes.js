const express = require('express');
const router = express.Router();

const itemController = require('../controllers/item.controller');
const supplierController = require('../controllers/suppliers.controller');


// api for user dashboard
router.get('/list', itemController.ListProducts);
router.get('/date_filters', itemController.ListProductDateFilters);
router.get('/:itemId/details', itemController.GetProductDetails);

// used by admin
router.get('/item', itemController.getAllItemsForAdmin);
router.get('/', itemController.getAllItems);
router.get('/supplier/:supplierId/details', supplierController.getSingleSupplier);
router.get('/supplier/:supplierId', itemController.getAllItemsBySupplier);
router.get('/:itemId', itemController.getItem);

// get filer list for products
router.get('/filters/cuisine', itemController.getAvailableCuisines);
router.get('/filters/eventDate', itemController.getAvailableEventDates);

module.exports = router;