const express = require('express');
const router = express.Router();

const groupController = require('../controllers/group.controller');

router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.get('/supplier/:supplierId', groupController.getSupplierGroups);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.editGroup);
router.delete('/:groupId', groupController.deleteGroup);

module.exports = router;
