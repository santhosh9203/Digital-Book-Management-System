const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getBookReviews, getReviewEligibility, createReview } = require('../controllers/reviewController');

router.get('/book/:bookId', getBookReviews);
router.get('/eligibility/:bookId', authenticate, getReviewEligibility);
router.post('/', authenticate, createReview);

module.exports = router;
