const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getTransactionPasswordStatus,
    setOrChangeTransactionPassword,
    requestTransactionPasswordReset,
    resetTransactionPassword,
} = require('../controllers/userController');

router.use(authenticate);

router.get('/transaction-password/status', getTransactionPasswordStatus);
router.put('/transaction-password', setOrChangeTransactionPassword);
router.post('/transaction-password/forgot', requestTransactionPasswordReset);
router.post('/transaction-password/reset', resetTransactionPassword);

module.exports = router;
