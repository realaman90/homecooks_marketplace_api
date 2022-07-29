const express = require('express');
const router = express.Router();

const pickupAreaController = require('../controllers/pickupArea.controller');

// manage client pickup point
router.post('/', pickupAreaController.createPickUpArea);
router.get('/', pickupAreaController.getAllPickupAreas);
router.get('/:pickupAreaId', pickupAreaController.getById);
router.put('/:pickupAreaId', pickupAreaController.updatePickUpArea);
router.delete('/:pickupAreaId', pickupAreaController.removeById);

module.exports = router;
