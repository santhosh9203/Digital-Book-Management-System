const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getBookReviews, getReviewEligibility, createReview, getMyReviews } = require('../controllers/reviewController');

router.get('/my-reviews', authenticate, getMyReviews);
router.get('/book/:bookId', getBookReviews);
router.get('/eligibility/:bookId', authenticate, getReviewEligibility);
router.post('/', authenticate, createReview);

module.exports = router;
