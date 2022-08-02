const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');

router.get('/', notificationController.getUserNotifications);
router.get('/:notificationId/mark_read', notificationController.markRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
