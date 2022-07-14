const express = require('express');
const router = express.Router();

const eventController = require('../controllers/event.controller');

router.post('/', eventController.createEvent);
router.get('/', eventController.getAllEvents);
router.get('/supplier/:supplierId', eventController.getSupplierEvents);
router.get('/:eventId', eventController.getEventById);
router.put('/:eventId', eventController.editEvent);
router.delete('/:eventId', eventController.deleteEvent);

// event template routes
router.post('/frm_tmp', eventController.createEventUsingEventTemplate);


module.exports = router;
