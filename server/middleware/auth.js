const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/userModel');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Convert string ID back to MongoDB ObjectId
        const userId = mongoose.Types.ObjectId.isValid(decoded.id)
            ? new mongoose.Types.ObjectId(decoded.id)
            : decoded.id;

        const user = await User.findOne({ _id: userId }).lean();
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        // Attach user with id as string for consistency
        req.user = {
            ...user,
            id: user._id.toString(),
            _id: undefined,
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please login again.' });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
