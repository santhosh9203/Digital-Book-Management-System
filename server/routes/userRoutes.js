const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getTransactionPasswordStatus,
    getProfile,
    setOrChangeTransactionPassword,
    requestTransactionPasswordReset,
    resetTransactionPassword,
    completeTutorial,
} = require('../controllers/userController');

router.use(authenticate);

router.get('/profile', getProfile);
router.get('/transaction-password/status', getTransactionPasswordStatus);
router.put('/transaction-password', setOrChangeTransactionPassword);
router.post('/transaction-password/forgot', requestTransactionPasswordReset);
router.post('/transaction-password/reset', resetTransactionPassword);
router.post('/tutorial/complete', completeTutorial);

module.exports = router;
