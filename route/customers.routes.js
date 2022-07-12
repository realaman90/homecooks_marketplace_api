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

router.get('/', getAllCustomers);
router.get('/:id', getSingleCustomer)

module.exports = router;