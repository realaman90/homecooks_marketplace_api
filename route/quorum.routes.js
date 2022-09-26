const express = require('express');
const router = express.Router();

const quorumController = require('../controllers/quorum.controller');

router.get('/process/:dishItem', quorumController.CheckAndProcessQuorumApi);

module.exports = router;
