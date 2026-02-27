const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
    },
    frozen_balance: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'frozen', 'closed'],
        default: 'active',
    },
    currency: {
        type: String,
        default: 'INR',
    }
}, { timestamps: true });

// Ensure balance is never negative
walletSchema.pre('save', function (next) {
    if (this.balance < 0) {
        return next(new Error('Insufficient balance'));
    }
    next();
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
