const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        book_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        comment: {
            type: String,
            default: '',
            trim: true,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

reviewSchema.index({ user_id: 1, book_id: 1 }, { unique: true });
reviewSchema.index({ book_id: 1, created_at: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
