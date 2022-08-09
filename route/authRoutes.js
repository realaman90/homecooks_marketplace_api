const express = require('express');
const { route } = require('express/lib/router');


const router = express.Router()

const { register, login, resetPasswordOTP, resetPassword } = require('../controllers/auth.controller');


router.post('/register', register);
router.post('/login', login);
router.post('/resetPasswordOTP', resetPasswordOTP)
router.post('/resetPassword', resetPassword);



module.exports = router