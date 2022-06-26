const express = require('express');

const {
    authenticateUser,
    authorizePermissions
} = require('../middleware/authentication');

const router = express.Router();

const {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getAllSuppliers,
    getSingleSupplier,
} = require('../controllers/suppliers.controller');

router
    .route('/create')
    .post([authenticateUser, authorizePermissions('admin')], createSupplier, );
router.route('/').get([authenticateUser, authorizePermissions('admin')], getAllSuppliers);


router
    .route('/:id')
    .patch(
        [authenticateUser, authorizePermissions('admin')],
        updateSupplier
    )
    .delete([authenticateUser, authorizePermissions('admin')], deleteSupplier)
    .get([authenticateUser, authorizePermissions('admin')], getSingleSupplier);

module.exports = router