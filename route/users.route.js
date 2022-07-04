const express = require('express');

const {
    authenticateUser,
    authorizePermissions
} = require('../middleware/full-auth');

const router = express.Router();

const {
    registerUser,
    updateUser,
    updateUserPhone,
    updateUserAddress,
    updateUserNotificationSettings,
    updateUserPassword,
    deleteUser,
    getAllUsers,
    getSingleUser,
} = require('../controllers/user.controller');

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
    .route('/:id/updateaddress')
    .patch([authenticateUser, authorizePermissions('admin')], updateUserAddress, );

router
    .route('/:id/updatenotifysettings')
    .patch([authenticateUser, authorizePermissions('admin')], updateUserNotificationSettings);

router
    .route('/:id/updateuserpassword')
    .patch([authenticateUser, authorizePermissions('admin')], updateUserPassword);

module.exports = router