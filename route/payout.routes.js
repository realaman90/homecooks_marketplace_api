const express = require('express');
const router = express.Router();

const payoutComtroller = require('../controllers/payout.controller');

router.get('/', payoutComtroller.getListOfPayouts);

// get supplier payouts
router.get('/supplier/:supplierId', payoutComtroller.getSupplierPayouts);

// update payout status 
router.put('/:payoutId/update_status', payoutComtroller.updatePayoutStatus);

// payout by item

// update status

module.exports = router;
