const express = require('express');
const router = express.Router();

const payoutComtroller = require('../controllers/payout.controller');

router.get('/', payoutComtroller.getListOfPayouts);

// get supplier payouts (getSupplierPayouts)
router.get('/supplier/:supplierId', payoutComtroller.getSupplierPayouts);

// get payout status against item (getPayoutByItem)
router.get('/item/:itemId', payoutComtroller.getPayoutByItem);

// update payout status 
router.put('/:payoutId/update_status', payoutComtroller.updatePayoutStatus);

// update payout with items status (updatePayoutStatusForItem)
router.put('/item/:itemId/update_status', payoutComtroller.updatePayoutStatusForItem);

// payout by item
router.get('/supplier/:supplierId', payoutComtroller.getSupplierPayouts);

// update status

module.exports = router;
