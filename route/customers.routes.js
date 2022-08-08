const express = require('express');

const {
    authenticateUser,
    authorizePermissions
} = require('../middleware/full-auth');

const router = express.Router();

const {
    getAllCustomers,
    getSingleCustomer,
} = require('../controllers/user.controller');
const { registerUser, login, resetPasswordOTP, resetPassword } = require('../controllers/auth.controller');
const { verfyOTP } = require('../controllers/verification.otp');

router.get('/', getAllCustomers);
router.get('/:id', getSingleCustomer);
router.route('/register').post(registerUser);
router.post('/login', login);
router.post('/resetPasswordOTP', resetPasswordOTP)
router.post('/resetPassword', resetPassword)
router.post('/verify', verfyOTP)


module.exports = router;