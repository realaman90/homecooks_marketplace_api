const express = require('express');

const {
    authenticateUser,
    authorizePermissions
} = require('../middleware/full-auth');

const router = express.Router();

const {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getAllSuppliers,
    getSingleSupplier,
} = require('../controllers/suppliers.controller');

const { getUserBySupplierId, updateUserBySupplierId } = require('../controllers/user.controller');

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
router
    .route('/getUserBySupplierId/:id')
    .get([authenticateUser, authorizePermissions('admin')], getUserBySupplierId)
    .patch([authenticateUser, authorizePermissions('admin')], updateUserBySupplierId)

module.exports = router