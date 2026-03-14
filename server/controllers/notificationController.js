const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');

/**
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const notifications = await Notification.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(50)
            .lean();
        res.json({ notifications });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/notifications/:id/read
 */
const markNotificationRead = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid notification ID format.' });
        }
        const notificationId = new mongoose.Types.ObjectId(req.params.id);
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user_id: userId },
            { read: true },
            { new: true }
        ).lean();

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        res.json({ notification });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        await Notification.updateMany({ user_id: userId, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotifications, markNotificationRead, markAllRead };
