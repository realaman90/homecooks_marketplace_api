const express = require('express');
const router = express.Router();

const clientPickupPointController = require('../controllers/clientPickupPoint.controller');

router.post('/', clientPickupPointController.createClientPickupPoint);
router.get('/', clientPickupPointController.getAllClientPickupPoint);
router.get('/:clientPickupPointId', clientPickupPointController.getClientPickupPoint);
router.put('/:clientPickupPointId', clientPickupPointController.editClientPickupPoint);
router.delete('/:clientPickupPointId', clientPickupPointController.deleteClientPickupPoint);

module.exports = router;


