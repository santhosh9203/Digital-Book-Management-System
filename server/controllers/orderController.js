const crypto = require('crypto');
const mongoose = require('mongoose');
const paymentSimulator = require('../utils/paymentSimulator');
const Order = require('../models/orderModel');
const Book = require('../models/bookModel');
const Wallet = require('../models/walletModel');
const WalletLedger = require('../models/walletLedgerModel');

/**
 * POST /api/orders/create-order
 * Create simulated order
 */
const createOrder = async (req, res, next) => {
    try {
        const { book_id } = req.body;

        if (!book_id) {
            return res.status(400).json({ message: 'Book ID is required.' });
        }

        // Convert string ID to MongoDB ObjectId
        let bookObjectId;
        try {
            bookObjectId = new mongoose.Types.ObjectId(book_id);
        } catch {
            return res.status(400).json({ message: 'Invalid book ID.' });
        }

        const book = await Book.findOne({ _id: bookObjectId });
        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        // Wallet Balance Check (Prevention before payment)
        const wallet = await Wallet.findOne({ user_id: req.user.id });
        const walletBalance = wallet ? Number(wallet.balance) : 0;
        if (walletBalance < Number(book.price)) {
            return res.status(400).json({
                message: `Insufficient balance (add money on wallet).`
            });
        }

        // Check if already purchased
        const existingOrder = await Order.findByUserAndBook(
            new mongoose.Types.ObjectId(req.user.id),
            bookObjectId
        );
        if (existingOrder) {
            return res.status(400).json({ message: 'You have already purchased this book.' });
        }

        // Create Simulated order
        const simOrder = await paymentSimulator.createOrder(
            book.price,
            'INR',
            `receipt_${Date.now()}`
        );

        // Save order in database
        const order = await Order.create({
            user_id: new mongoose.Types.ObjectId(req.user.id),
            book_id: bookObjectId,
            razorpay_order_id: simOrder.id, // Keeping field name for compatibility
            amount: book.price,
        });

        res.status(201).json({
            order,
            razorpay_order_id: simOrder.id,
            amount: simOrder.amount,
            currency: simOrder.currency,
            is_simulation: true
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/orders/verify
 * Verify simulated payment signature and handle wallet ledger
 */
const verifyPayment = async (req, res, next) => {
    let session = null;
    try {
        // Handle cases where sessions/transactions might not be supported (standalone MongoDB)
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            session = null;
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ message: 'Missing payment verification data.' });
        }

        // Verify simulated signature
        const isValid = paymentSimulator.verifySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            await Order.findOneAndUpdate(
                { razorpay_order_id },
                { payment_id: razorpay_payment_id, status: 'failed' },
                { session }
            );
            if (session) await session.abortTransaction();
            return res.status(400).json({ message: 'Payment verification failed.' });
        }

        // Update order status to paid and populate book details for ledger description
        const order = await Order.findOneAndUpdate(
            { razorpay_order_id },
            { payment_id: razorpay_payment_id, status: 'paid' },
            { new: true, session }
        ).populate('book_id', 'title');

        if (!order) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Simulate Wallet Ledger Entry
        let wallet = await Wallet.findOne({ user_id: req.user.id }).session(session);
        if (!wallet) {
            const walletData = { user_id: req.user.id, balance: 0 };
            if (session) {
                wallet = (await Wallet.create([walletData], { session }))[0];
            } else {
                wallet = await Wallet.create(walletData);
            }
        }

        // Deduct from wallet atomically
        const balanceBefore = Number(wallet.balance);
        const orderAmount = Number(order.amount);
        const newBalance = balanceBefore - orderAmount;

        if (newBalance < 0) {
            if (session) await session.abortTransaction();
            // Optional: Log failure
            await Order.findOneAndUpdate({ _id: order._id }, { status: 'failed' });
            return res.status(400).json({
                message: 'Insufficient balance (add money on wallet).'
            });
        }

        await Wallet.findOneAndUpdate(
            { _id: wallet._id },
            { $set: { balance: newBalance } },
            { session }
        );

        // Record the transaction in ledger
        const ledgerData = {
            wallet_id: wallet._id,
            transaction_type: 'debit',
            amount: orderAmount,
            balance_before: balanceBefore,
            balance_after: newBalance,
            reference_type: 'order',
            reference_id: order._id,
            description: `Purchase of book: ${order.book_id?.title || 'Unknown Book'}`,
            metadata: { gateway: 'simulated', payment_id: razorpay_payment_id }
        };

        if (session) {
            await WalletLedger.create([ledgerData], { session });
            await session.commitTransaction();
            session.endSession();
        } else {
            await WalletLedger.create(ledgerData);
        }

        res.json({
            message: 'Payment verified successfully (Simulated)',
            order: await Order.findById(order._id).populate('book_id'),
        });
    } catch (error) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (e) {
                // Ignore error if already aborted
            }
            session.endSession();
        }
        next(error);
    }
};

/**
 * GET /api/orders/my-orders
 */
const getMyOrders = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const orders = await Order.findByUserId(userId);
        res.json({ orders });
    } catch (error) {
        next(error);
    }
};

module.exports = { createOrder, verifyPayment, getMyOrders };
