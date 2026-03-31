const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const paymentSimulator = require('../utils/paymentSimulator');
const Order = require('../models/orderModel');
const Book = require('../models/bookModel');
const Wallet = require('../models/walletModel');
const WalletLedger = require('../models/walletLedgerModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

/**
 * POST /api/orders/create-order
 * Create simulated order
 */
const createOrder = async (req, res, next) => {
    try {
        const { book_id, shipping_address } = req.body;

        if (!book_id) {
            return res.status(400).json({ message: 'Book ID is required.' });
        }

        if (!shipping_address || !shipping_address.full_name || !shipping_address.address_line || !shipping_address.city || !shipping_address.pincode || !shipping_address.phone) {
            return res.status(400).json({ message: 'Complete shipping address is required.' });
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
            shipping_address,
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

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, password } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ message: 'Missing payment verification data.' });
        }
        if (!password) {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            return res.status(400).json({ message: 'Password is required.' });
        }

        const user = await User.findOne({ _id: req.user.id }).select('transaction_password_hash').lean();
        if (!user) {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            return res.status(401).json({ message: 'User not found.' });
        }
        if (!user.transaction_password_hash) {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            return res.status(400).json({ message: 'Transaction password not set. Set it in Wallet.' });
        }
        const isMatch = await bcrypt.compare(password, user.transaction_password_hash);
        if (!isMatch) {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            return res.status(403).json({ message: 'Invalid transaction password.' });
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

        const trackingEntry = {
            status: 'order_placed',
            label: 'Order placed',
            note: 'Payment confirmed',
            timestamp: new Date(),
        };
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 5);

        // Update order status to paid and populate book details for ledger description
        const order = await Order.findOneAndUpdate(
            { razorpay_order_id },
            {
                $set: {
                    payment_id: razorpay_payment_id,
                    status: 'paid',
                    fulfillment_status: 'order_placed',
                    expected_delivery_date: expectedDeliveryDate,
                    delivery_extension_count: 0,
                    cancelled_at: null,
                },
                $push: { tracking_history: trackingEntry },
            },
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

        if (order?.user_id) {
            await Notification.create({
                user_id: order.user_id,
                title: 'Order placed',
                message: `Your order for \"${order.book_id?.title || 'Book'}\" has been placed.`,
                type: 'order',
                link: `/orders?highlight=${order._id.toString()}`,
            });
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
        const now = new Date();

        const updatedOrders = [];
        for (const order of orders) {
            let updatedOrder = order;
            const updates = {};
            let pushEntry = null;
            let notifyMessage = null;

            const isPaid = order.status === 'paid';
            const isFinal = ['delivered', 'cancelled', 'returned'].includes(order.fulfillment_status);

            if (isPaid) {
                if (!order.expected_delivery_date) {
                    const baseDate = new Date(order.created_at || now);
                    baseDate.setDate(baseDate.getDate() + 5);
                    updates.expected_delivery_date = baseDate;
                    updates.delivery_extension_count = order.delivery_extension_count || 0;
                    updatedOrder = { ...updatedOrder, expected_delivery_date: baseDate };
                }

                const expectedDate = updates.expected_delivery_date || order.expected_delivery_date;
                const extensionCount = order.delivery_extension_count || 0;
                if (!isFinal && expectedDate && now > expectedDate && extensionCount < 1) {
                    const newDate = new Date(expectedDate);
                    newDate.setDate(newDate.getDate() + 2);
                    updates.expected_delivery_date = newDate;
                    updates.delivery_extension_count = extensionCount + 1;

                    pushEntry = {
                        status: order.fulfillment_status || 'processing',
                        label: 'Delivery delayed',
                        note: `Expected delivery updated to ${newDate.toLocaleDateString()}`,
                        timestamp: now,
                    };

                    notifyMessage = `Delivery delayed for \"${order.book_id?.title || 'Book'}\". New expected delivery: ${newDate.toLocaleDateString()}.`;

                    updatedOrder = {
                        ...updatedOrder,
                        expected_delivery_date: newDate,
                        delivery_extension_count: updates.delivery_extension_count,
                        tracking_history: [...(order.tracking_history || []), pushEntry],
                    };
                }
            }

            if (Object.keys(updates).length > 0 || pushEntry) {
                const updateDoc = {};
                if (Object.keys(updates).length > 0) updateDoc.$set = updates;
                if (pushEntry) updateDoc.$push = { tracking_history: pushEntry };
                await Order.findByIdAndUpdate(order._id, updateDoc);

                if (notifyMessage) {
                    await Notification.create({
                        user_id: userId,
                        title: 'Delivery update',
                        message: notifyMessage,
                        type: 'order',
                        link: `/orders?highlight=${order._id.toString()}`,
                    });
                }
            }

            updatedOrders.push(updatedOrder);
        }

        res.json({ orders: updatedOrders });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
    let session = null;
    try {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
        const abortSession = async () => {
            if (session) {
                try {
                    await session.abortTransaction();
                } catch (e) { }
                session.endSession();
            }
        };

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            await abortSession();
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const orderId = new mongoose.Types.ObjectId(req.params.id);
        let orderQuery = Order.findOne({ _id: orderId, user_id: req.user.id })
            .populate('book_id', 'title');
        if (session) orderQuery = orderQuery.session(session);
        const order = await orderQuery;
        if (!order) {
            await abortSession();
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.status !== 'paid') {
            await abortSession();
            return res.status(400).json({ message: 'Only paid orders can be cancelled.' });
        }

        if (['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(order.fulfillment_status)) {
            await abortSession();
            return res.status(400).json({ message: 'This order can no longer be cancelled.' });
        }

        if (order.refunded_at) {
            await abortSession();
            return res.status(400).json({ message: 'Order already refunded.' });
        }

        const now = new Date();
        const refundAmount = Number(order.amount || 0);

        const cancelEntry = {
            status: 'cancelled',
            label: 'Cancelled',
            note: 'Order cancelled by user',
            timestamp: now,
        };

        let walletQuery = Wallet.findOne({ user_id: req.user.id });
        if (session) walletQuery = walletQuery.session(session);
        let wallet = await walletQuery;
        if (!wallet) {
            const walletData = { user_id: req.user.id, balance: 0 };
            if (session) {
                wallet = (await Wallet.create([walletData], { session }))[0];
            } else {
                wallet = await Wallet.create(walletData);
            }
        }

        const balanceBefore = Number(wallet.balance || 0);
        const balanceAfter = balanceBefore + refundAmount;

        if (session) {
            await Wallet.findOneAndUpdate(
                { _id: wallet._id },
                { $set: { balance: balanceAfter } },
                { session }
            );
        } else {
            wallet.balance = balanceAfter;
            await wallet.save();
        }

        const ledgerData = {
            wallet_id: wallet._id,
            transaction_type: 'credit',
            amount: refundAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            reference_type: 'refund',
            reference_id: order._id,
            description: `Refund for cancelled order: ${order.book_id?.title || 'Book'}`,
            metadata: { reason: 'cancelled' },
        };

        if (session) {
            await WalletLedger.create([ledgerData], { session });
        } else {
            await WalletLedger.create(ledgerData);
        }

        const updateDoc = {
            $set: {
                fulfillment_status: 'cancelled',
                cancelled_at: now,
                refunded_at: now,
                refund_amount: refundAmount,
            },
            $push: { tracking_history: cancelEntry },
        };

        if (session) {
            await Order.findByIdAndUpdate(order._id, updateDoc, { session });
        } else {
            order.fulfillment_status = 'cancelled';
            order.cancelled_at = now;
            order.refunded_at = now;
            order.refund_amount = refundAmount;
            order.tracking_history = Array.isArray(order.tracking_history)
                ? [...order.tracking_history, cancelEntry]
                : [cancelEntry];
            await order.save();
        }

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        const updatedOrder = await Order.findById(order._id).populate('book_id');

        await Notification.create({
            user_id: order.user_id,
            title: 'Refund processed',
            message: `Refunded ₹${refundAmount.toFixed(2)} to your wallet for cancelled order \"${order.book_id?.title || 'Book'}\".`,
            type: 'order',
            link: '/wallet',
            metadata: { order_id: order._id.toString(), amount: refundAmount, reason: 'cancelled' },
        });

        res.json({ message: 'Order cancelled', order: updatedOrder });
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
 * PATCH /api/orders/:id/return
 */
const returnOrder = async (req, res, next) => {
    let session = null;
    try {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
        const abortSession = async () => {
            if (session) {
                try {
                    await session.abortTransaction();
                } catch (e) { }
                session.endSession();
            }
        };

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            await abortSession();
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const orderId = new mongoose.Types.ObjectId(req.params.id);
        let orderQuery = Order.findOne({ _id: orderId, user_id: req.user.id })
            .populate('book_id', 'title');
        if (session) orderQuery = orderQuery.session(session);
        const order = await orderQuery;
        if (!order) {
            await abortSession();
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.status !== 'paid') {
            await abortSession();
            return res.status(400).json({ message: 'Only paid orders can be returned.' });
        }

        if (order.fulfillment_status !== 'delivered') {
            await abortSession();
            return res.status(400).json({ message: 'Only delivered orders can be returned.' });
        }

        if (!order.delivery_date) {
            await abortSession();
            return res.status(400).json({ message: 'Delivery date missing. Cannot process return.' });
        }

        if (order.refunded_at || order.fulfillment_status === 'returned') {
            await abortSession();
            return res.status(400).json({ message: 'Order already refunded.' });
        }

        const deliveredAt = new Date(order.delivery_date);
        const returnDeadline = new Date(deliveredAt.getTime() + 3 * 24 * 60 * 60 * 1000);
        const now = new Date();
        if (now > returnDeadline) {
            await abortSession();
            return res.status(400).json({ message: 'Return window expired. Returns allowed within 1 day of delivery.' });
        }

        const refundAmount = Number(order.amount || 0);
        const returnEntry = {
            status: 'returned',
            label: 'Returned',
            note: 'Return requested by user',
            timestamp: now,
        };

        let walletQuery = Wallet.findOne({ user_id: req.user.id });
        if (session) walletQuery = walletQuery.session(session);
        let wallet = await walletQuery;
        if (!wallet) {
            const walletData = { user_id: req.user.id, balance: 0 };
            if (session) {
                wallet = (await Wallet.create([walletData], { session }))[0];
            } else {
                wallet = await Wallet.create(walletData);
            }
        }

        const balanceBefore = Number(wallet.balance || 0);
        const balanceAfter = balanceBefore + refundAmount;

        if (session) {
            await Wallet.findOneAndUpdate(
                { _id: wallet._id },
                { $set: { balance: balanceAfter } },
                { session }
            );
        } else {
            wallet.balance = balanceAfter;
            await wallet.save();
        }

        const ledgerData = {
            wallet_id: wallet._id,
            transaction_type: 'credit',
            amount: refundAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            reference_type: 'refund',
            reference_id: order._id,
            description: `Refund for returned order: ${order.book_id?.title || 'Book'}`,
            metadata: { reason: 'returned' },
        };

        if (session) {
            await WalletLedger.create([ledgerData], { session });
        } else {
            await WalletLedger.create(ledgerData);
        }

        const updateDoc = {
            $set: {
                fulfillment_status: 'returned',
                returned_at: now,
                refunded_at: now,
                refund_amount: refundAmount,
            },
            $push: { tracking_history: returnEntry },
        };

        if (session) {
            await Order.findByIdAndUpdate(order._id, updateDoc, { session });
        } else {
            order.fulfillment_status = 'returned';
            order.returned_at = now;
            order.refunded_at = now;
            order.refund_amount = refundAmount;
            order.tracking_history = Array.isArray(order.tracking_history)
                ? [...order.tracking_history, returnEntry]
                : [returnEntry];
            await order.save();
        }

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        const updatedOrder = await Order.findById(order._id).populate('book_id');

        await Notification.create({
            user_id: order.user_id,
            title: 'Refund processed',
            message: `Refunded ₹${refundAmount.toFixed(2)} to your wallet for returned order \"${order.book_id?.title || 'Book'}\".`,
            type: 'order',
            link: '/wallet',
            metadata: { order_id: order._id.toString(), amount: refundAmount, reason: 'returned' },
        });

        res.json({ message: 'Order returned', order: updatedOrder });
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

module.exports = { createOrder, verifyPayment, getMyOrders, cancelOrder, returnOrder };
