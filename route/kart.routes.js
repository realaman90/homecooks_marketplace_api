const express = require('express');
const router = express.Router();

const kartController = require('../controllers/kart.controller');

router.get('/', kartController.getUserKart);
router.get('/inc/item/:itemId', kartController.addItemToKart);
router.get('/dec/item/:itemId', kartController.removeItemFrmKart);
router.get('/del/item/:itemId', kartController.deleteItemFromKart);
router.get('/clear', kartController.clearUserKart);


module.exports = router;
