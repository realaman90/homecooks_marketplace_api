const express = require('express');
const router = express.Router();

const enquiryController = require('../controllers/enquiry.controller');

// api for user dashboard
router.post('/', enquiryController.create);

module.exports = router;
