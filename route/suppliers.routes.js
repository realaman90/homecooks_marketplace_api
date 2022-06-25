const express = require('express');

const {
    authenticateUser,
    authorizePermissions
} = require('../middleware/authentication');

const router = express.Router();

const {
    registerSupplier,
    updateSupplier,
    updateSupplierPhone,
    updateSupplierLocation,
    updateSupplierNotificationSettings,
    updateSupplierBusinessDetails,
    updateSupplierPassword,
    deleteSupplier,
    getAllSuppliers,
    getSingleSupplier,
} = require('../controllers/suppliers.controller');

router
    .route('/create')
    .post([authenticateUser, authorizePermissions('admin')], registerSupplier);
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
    .route('/:id/updatephone')
    .patch([authenticateUser, authorizePermissions('admin')], updateSupplierPhone);

router
    .route('/:id/updatelocation')
    .patch([authenticateUser, authorizePermissions('admin')], updateSupplierLocation);

router
    .route('/:id/updatenotifysettings')
    .patch([authenticateUser, authorizePermissions('admin')], updateSupplierNotificationSettings);
router
    .route('/:id/updatesupplierbusinessdetails')
    .patch([authenticateUser, authorizePermissions('admin')], updateSupplierBusinessDetails);
router
    .route('/:id/updatesupplierpassword')
    .patch([authenticateUser, authorizePermissions('admin')], updateSupplierPassword)

module.exports = router