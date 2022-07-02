const express = require('express');
const router = express.Router();

const bikerPickupPointController = require('../controllers/bikerPickupPoint.controller');

router.post('/', bikerPickupPointController.createBikerPickupPoint);
router.get('/', bikerPickupPointController.getAllBikerPickupPoint);
router.get('/supplier/:supplierId', bikerPickupPointController.getAllBikerPickupPointForSupplier);
router.get('/:bikerPickupPointId', bikerPickupPointController.getBikerPickupPoint);
router.put('/:bikerPickupPointId', bikerPickupPointController.editBikerPickupPoint);
router.delete('/:bikerPickupPointId', bikerPickupPointController.deleteBikerPickupPoint);

module.exports = router;
