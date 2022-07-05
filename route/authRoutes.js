const express = require('express');
const { route } = require('express/lib/router');


const router = express.Router()

const { register, login, logout } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);


module.exports = router