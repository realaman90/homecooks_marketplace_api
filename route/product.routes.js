const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');

router.post('/', productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/supplier/:supplierId', productController.getAllProductsBySupplier);
router.get('/:productId', productController.getProduct);
router.put('/:productId', productController.editProduct);
router.delete('/:productId', productController.deleteProduct);

module.exports = router;
