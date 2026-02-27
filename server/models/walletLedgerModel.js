const mongoose = require('mongoose');

const walletLedgerSchema = new mongoose.Schema({
    wallet_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true,
    },
    transaction_type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    balance_before: {
        type: Number,
        required: true,
    },
    balance_after: {
        type: Number,
        required: true,
    },
    reference_type: {
        type: String,
        enum: ['order', 'transfer', 'topup', 'withdrawal', 'refund'],
        required: true,
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    description: String,
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

const WalletLedger = mongoose.model('WalletLedger', walletLedgerSchema);
module.exports = WalletLedger;
