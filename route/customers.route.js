const express = require('express');

const {
    authenticateUser,
    authorizePermissions
} = require('../middleware/authentication');

const router = express.Router();

const {
    registerUser,
    updateUser,
    updateUserPhone,
    updateUserLocation,
    updateUserNotificationSettings,
    updateUserPassword,
    deleteUser,
    getAllUsers,
    getSingleUser,
} = require('../controllers/customer.controller');

router
    .route('/create')
    .post([authenticateUser, authorizePermissions('admin')], registerUser);
router.route('/').get([authenticateUser, authorizePermissions('admin')], getAllUsers);


router
    .route('/:id')
    .patch(
        [authenticateUser, authorizePermissions('admin')],
        updateUser
    )
    .delete([authenticateUser, authorizePermissions('admin')], deleteUser)
    .get([authenticateUser, authorizePermissions('admin')], getSingleUser);
router
    .route('/:id/updatephone')
    .patch([authenticateUser, authorizePermissions('admin')], updateUserPhone);

router
    .route('/:id/updatelocation')
    .patch([authenticateUser, authorizePermissions('admin')], updateUserLocation);

router
    .route('/:id/updatenotifysettings')
    .patch([authenticateUser, authorizePermissions('admin')], updateUserNotificationSettings);

router
    .route('/:id/updateuserpassword')
    .patch([authenticateUser, authorizePermissions('admin')], updateUserPassword);

module.exports = router