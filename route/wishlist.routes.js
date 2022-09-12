const express = require('express');
const router = express.Router();

const wishlistController = require('../controllers/wishlist.controller');

router.get('/item/:item/toggle', wishlistController.ToggleAddToWishlist);

module.exports = router;