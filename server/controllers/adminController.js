const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Book = require('../models/bookModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

/**
 * GET /api/admin/dashboard
 */
const getDashboard = async (_req, res, next) => {
    try {
        const [totalUsers, totalBooks, totalOrders, totalRevenue, monthlyRevenue, topBooks] =
            await Promise.all([
                User.countDocuments(),
                Book.countDocuments(),
                Order.count(),
                Order.totalRevenue(),
                Order.monthlyRevenue(),
                Book.topSelling(5),
            ]);

        res.json({
            totalUsers,
            totalBooks,
            totalOrders,
            totalRevenue,
            monthlyRevenue,
            topBooks,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/users
 */
const getUsers = async (_req, res, next) => {
    try {
        const users = await User.find()
            .select('name email role created_at')
            .sort({ created_at: -1 })
            .lean();
        res.json({ users });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/orders
 */
const getOrders = async (_req, res, next) => {
    try {
        const orders = await Order.findAll();
        res.json({ orders });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/books
 */
const getBooks = async (_req, res, next) => {
    try {
        const result = await Book.findAll({ page: 1, limit: 1000 });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/admin/books
 */
const addBook = async (req, res, next) => {
    try {
        const { title, author, category, price, description } = req.body;
        let pdf_url = null;
        let cover_image_url = null;

        if (req.files) {
            if (req.files.pdf && req.files.pdf[0]) {
                pdf_url = `uploads/books/${req.files.pdf[0].filename}`;
            }
            if (req.files.cover && req.files.cover[0]) {
                cover_image_url = `uploads/books/${req.files.cover[0].filename}`;
            }
        }

        const book = await Book.create({
            title,
            author,
            category,
            price: parseFloat(price),
            description,
            pdf_url,
            cover_image_url,
        });

        res.status(201).json({ message: 'Book added successfully', book });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/books/:id
 */
const updateBook = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        const bookId = new mongoose.Types.ObjectId(req.params.id);
        const existing = await Book.findOne({ _id: bookId });
        if (!existing) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        const updates = { ...req.body };
        if (updates.price) updates.price = parseFloat(updates.price);

        if (req.files) {
            if (req.files.pdf && req.files.pdf[0]) {
                // Delete old PDF if exists
                if (existing.pdf_url) {
                    const oldPath = path.join(__dirname, '..', existing.pdf_url);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updates.pdf_url = `uploads/books/${req.files.pdf[0].filename}`;
            }
            if (req.files.cover && req.files.cover[0]) {
                // Delete old cover if exists
                if (existing.cover_image_url) {
                    const oldPath = path.join(__dirname, '..', existing.cover_image_url);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updates.cover_image_url = `uploads/books/${req.files.cover[0].filename}`;
            }
        }

        const book = await Book.findByIdAndUpdate(bookId, updates, { new: true }).lean();
        res.json({ message: 'Book updated successfully', book });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/admin/books/:id
 */
const deleteBook = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        const bookId = new mongoose.Types.ObjectId(req.params.id);
        const book = await Book.findOne({ _id: bookId });
        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        // Delete associated files
        if (book.pdf_url) {
            const pdfPath = path.join(__dirname, '..', book.pdf_url);
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        }
        if (book.cover_image_url) {
            const coverPath = path.join(__dirname, '..', book.cover_image_url);
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }

        await Book.deleteOne({ _id: bookId });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboard, getUsers, getOrders, getBooks, addBook, updateBook, deleteBook };
