const express = require('express');
const router = express.Router();

const newsLetterController = require('../controllers/newsLetter.controller');

// api for user dashboard
router.post('/', newsLetterController.Subscribe);

module.exports = router;
