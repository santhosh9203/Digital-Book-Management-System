const Wallet = require('../models/walletModel');
const WalletLedger = require('../models/walletLedgerModel');
const mongoose = require('mongoose');

/**
 * GET /api/wallet/balance
 */
const getBalance = async (req, res, next) => {
    try {
        let wallet = await Wallet.findOne({ user_id: req.user.id });
        if (!wallet) {
            wallet = await Wallet.create({ user_id: req.user.id, balance: 0 });
        }
        res.json({ balance: wallet.balance, status: wallet.status });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/wallet/credit
 * Manually credit wallet (simulated)
 */
const creditWallet = async (req, res, next) => {
    let session = null;
    try {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }

        const { amount, description } = req.body;
        if (!amount || amount <= 0) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        let wallet = await Wallet.findOne({ user_id: req.user.id }).session(session);
        if (!wallet) {
            const walletData = { user_id: req.user.id, balance: 0 };
            if (session) {
                wallet = (await Wallet.create([walletData], { session }))[0];
            } else {
                wallet = await Wallet.create(walletData);
            }
        }

        const balanceBefore = wallet.balance;
        wallet.balance += Number(amount);
        await wallet.save({ session });

        const ledgerData = {
            wallet_id: wallet._id,
            transaction_type: 'credit',
            amount: Number(amount),
            balance_before: balanceBefore,
            balance_after: wallet.balance,
            reference_type: 'topup',
            reference_id: wallet._id,
            description: description || 'Wallet Topup (Simulated)',
            metadata: { method: 'admin_manual' }
        };

        if (session) {
            await WalletLedger.create([ledgerData], { session });
            await session.commitTransaction();
            session.endSession();
        } else {
            await WalletLedger.create(ledgerData);
        }

        res.json({ message: 'Wallet credited successfully', balance: wallet.balance });
    } catch (error) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (e) { }
            session.endSession();
        }
        next(error);
    }
};

/**
 * POST /api/wallet/debit
 * Manually debit wallet (simulated)
 */
const debitWallet = async (req, res, next) => {
    let session = null;
    try {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }

        const { amount, description } = req.body;
        if (!amount || amount <= 0) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        let wallet = await Wallet.findOne({ user_id: req.user.id }).session(session);
        if (!wallet || wallet.balance < amount) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        const balanceBefore = wallet.balance;
        wallet.balance -= Number(amount);
        await wallet.save({ session });

        const ledgerData = {
            wallet_id: wallet._id,
            transaction_type: 'debit',
            amount: Number(amount),
            balance_before: balanceBefore,
            balance_after: wallet.balance,
            reference_type: 'withdrawal',
            reference_id: wallet._id,
            description: description || 'Wallet Debit (Simulated)',
            metadata: { method: 'admin_manual' }
        };

        if (session) {
            await WalletLedger.create([ledgerData], { session });
            await session.commitTransaction();
            session.endSession();
        } else {
            await WalletLedger.create(ledgerData);
        }

        res.json({ message: 'Wallet debited successfully', balance: wallet.balance });
    } catch (error) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (e) { }
            session.endSession();
        }
        next(error);
    }
};

/**
 * GET /api/wallet/transactions
 */
const getTransactions = async (req, res, next) => {
    try {
        const wallet = await Wallet.findOne({ user_id: req.user.id });
        if (!wallet) {
            return res.json({ transactions: [] });
        }
        const transactions = await WalletLedger.find({ wallet_id: wallet._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ transactions });
    } catch (error) {
        next(error);
    }
};

module.exports = { getBalance, creditWallet, debitWallet, getTransactions };
