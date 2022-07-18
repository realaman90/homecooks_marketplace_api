const express = require('express');
const router = express.Router();

const kartController = require('../controllers/kart.controller');

router.get('/', kartController.getUserKart);
router.get('/inc/event/:eventId', kartController.addEventToKart);
router.get('/dec/event/:eventId', kartController.removeEventFrmKart);
router.get('/del/event/:eventId', kartController.deleteEventFromKart);
router.get('/clear', kartController.clearUserKart);

module.exports = router;
