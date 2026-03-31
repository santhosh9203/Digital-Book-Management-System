const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');

const getBookReviews = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.bookId)) {
            return res.status(400).json({ message: 'Invalid book ID.' });
        }
        const bookId = new mongoose.Types.ObjectId(req.params.bookId);
        const reviews = await Review.find({ book_id: bookId })
            .populate('user_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        const count = reviews.length;
        const avg = count ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count : 0;

        res.json({ reviews, summary: { count, average: avg } });
    } catch (error) {
        next(error);
    }
};

const getReviewEligibility = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.bookId)) {
            return res.status(400).json({ message: 'Invalid book ID.' });
        }
        const bookId = new mongoose.Types.ObjectId(req.params.bookId);
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const existing = await Review.findOne({ book_id: bookId, user_id: userId }).lean();
        if (existing) {
            return res.json({ eligible: false, reason: 'already_reviewed' });
        }

        const deliveredOrder = await Order.findOne({
            user_id: userId,
            book_id: bookId,
            status: 'paid',
            fulfillment_status: 'delivered',
        }).lean();

        if (!deliveredOrder) {
            return res.json({ eligible: false, reason: 'not_delivered' });
        }

        res.json({ eligible: true });
    } catch (error) {
        next(error);
    }
};

const createReview = async (req, res, next) => {
    try {
        const { book_id, rating, comment } = req.body;
        if (!book_id || !mongoose.Types.ObjectId.isValid(book_id)) {
            return res.status(400).json({ message: 'Invalid book ID.' });
        }
        const numericRating = Number(rating);
        if (!numericRating || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const bookId = new mongoose.Types.ObjectId(book_id);
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const existing = await Review.findOne({ book_id: bookId, user_id: userId }).lean();
        if (existing) {
            return res.status(400).json({ message: 'You have already reviewed this book.' });
        }

        const deliveredOrder = await Order.findOne({
            user_id: userId,
            book_id: bookId,
            status: 'paid',
            fulfillment_status: 'delivered',
        }).lean();

        if (!deliveredOrder) {
            return res.status(403).json({ message: 'Only delivered orders can be reviewed.' });
        }

        const review = await Review.create({
            user_id: userId,
            book_id: bookId,
            rating: numericRating,
            comment: comment || '',
        });

        res.status(201).json({ message: 'Review submitted', review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this book.' });
        }
        next(error);
    }
};

const getMyReviews = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const reviews = await Review.find({ user_id: userId }).select('book_id').lean();
        const bookIds = reviews.map((r) => (r.book_id?._id || r.book_id).toString());
        res.json({ bookIds });
    } catch (error) {
        next(error);
    }
};

module.exports = { getBookReviews, getReviewEligibility, createReview, getMyReviews };
