const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['order', 'book', 'system'],
            default: 'system',
        },
        link: { type: String, default: '' },
        read: { type: Boolean, default: false },
        metadata: { type: Object, default: {} },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

notificationSchema.virtual('id').get(function () {
    return this._id.toString();
});

notificationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
});

notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
