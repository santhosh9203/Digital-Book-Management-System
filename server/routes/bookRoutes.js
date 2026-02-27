const express = require('express');
const router = express.Router();
const { getBooks, getCategories, getBookById, getBookCover, downloadBook } = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');

router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/:id', getBookById);
router.get('/:id/cover', getBookCover);
router.get('/:id/download', authenticate, downloadBook);

module.exports = router;
