const express = require('express');
const router = express.Router();
const { getBalance, creditWallet, debitWallet, getTransactions } = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

router.get('/balance', authenticate, getBalance);
router.get('/transactions', authenticate, getTransactions);
router.post('/credit', authenticate, creditWallet);
router.post('/debit', authenticate, debitWallet);

module.exports = router;
