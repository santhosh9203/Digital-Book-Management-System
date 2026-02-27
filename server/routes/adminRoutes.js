const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');
const {
    getDashboard,
    getUsers,
    getOrders,
    getBooks,
    addBook,
    updateBook,
    deleteBook,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/orders', getOrders);
router.get('/books', getBooks);

router.post(
    '/books',
    upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
    ]),
    addBook
);

router.put(
    '/books/:id',
    upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
    ]),
    updateBook
);

router.delete('/books/:id', deleteBook);

module.exports = router;
