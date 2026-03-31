const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

const getTransactionPasswordStatus = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.user.id })
            .select('transaction_password_hash')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ isSet: !!user.transaction_password_hash });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            name: user.name,
            email: user.email,
            has_watched_tutorial: user.has_watched_tutorial
        });
    } catch (error) {
        next(error);
    }
};

const setOrChangeTransactionPassword = async (req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        if (!new_password || new_password.length < 4) {
            return res.status(400).json({ message: 'New password must be at least 4 characters.' });
        }

        const user = await User.findOne({ _id: req.user.id })
            .select('transaction_password_hash')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (user.transaction_password_hash) {
            if (!old_password) {
                return res.status(400).json({ message: 'Old password is required.' });
            }
            const isMatch = await bcrypt.compare(old_password, user.transaction_password_hash);
            if (!isMatch) {
                return res.status(403).json({ message: 'Old password is incorrect.' });
            }
        }

        const hashed = await bcrypt.hash(new_password, 12);
        await User.findByIdAndUpdate(req.user.id, {
            transaction_password_hash: hashed,
            transaction_password_set_at: new Date(),
            transaction_password_reset_otp: null,
            transaction_password_reset_expires: null,
        });

        res.json({ message: 'Transaction password updated.' });
    } catch (error) {
        next(error);
    }
};

const requestTransactionPasswordReset = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.user.id })
            .select('transaction_password_hash')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (!user.transaction_password_hash) {
            return res.status(400).json({ message: 'Transaction password is not set.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await User.findByIdAndUpdate(req.user.id, {
            transaction_password_reset_otp: otpHash,
            transaction_password_reset_expires: expires,
        });

        await Notification.create({
            user_id: req.user.id,
            title: 'OTP for transaction password reset',
            message: `Your OTP is ${otp}. It is valid for 10 minutes.`,
            type: 'system',
            link: '/wallet',
        });

        res.json({ message: 'OTP sent to notifications.' });
    } catch (error) {
        next(error);
    }
};

const resetTransactionPassword = async (req, res, next) => {
    try {
        const { otp, new_password } = req.body;
        if (!otp || !new_password) {
            return res.status(400).json({ message: 'OTP and new password are required.' });
        }

        const user = await User.findOne({ _id: req.user.id })
            .select('transaction_password_reset_otp transaction_password_reset_expires')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (!user.transaction_password_reset_otp || !user.transaction_password_reset_expires) {
            return res.status(400).json({ message: 'No reset request found.' });
        }
        if (new Date() > new Date(user.transaction_password_reset_expires)) {
            return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, user.transaction_password_reset_otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const hashed = await bcrypt.hash(new_password, 12);
        await User.findByIdAndUpdate(req.user.id, {
            transaction_password_hash: hashed,
            transaction_password_set_at: new Date(),
            transaction_password_reset_otp: null,
            transaction_password_reset_expires: null,
        });

        res.json({ message: 'Transaction password reset successfully.' });
    } catch (error) {
        next(error);
    }
};

const completeTutorial = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { has_watched_tutorial: true });
        res.json({ message: 'Tutorial completed.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTransactionPasswordStatus,
    getProfile,
    setOrChangeTransactionPassword,
    requestTransactionPasswordReset,
    resetTransactionPassword,
    completeTutorial,
};
