const express = require('express');
const router = express.Router();
const { getBooks, getCategories, getBookById, getBookCover } = require('../controllers/bookController');

router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/:id', getBookById);
router.get('/:id/cover', getBookCover);

module.exports = router;
