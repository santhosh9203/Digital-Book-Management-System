const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const mongoose = require('mongoose');
const Book = require('../models/bookModel');
const Order = require('../models/orderModel');

/**
 * GET /api/books
 */
const getBooks = async (req, res, next) => {
    try {
        const { search, category, page = 1, limit = 12 } = req.query;
        const result = await Book.findAll({ search, category, page, limit });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/books/categories
 */
const getCategories = async (_req, res, next) => {
    try {
        const categories = await Book.getCategories();
        res.json({ categories });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/books/:id
 */
const getBookById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        const bookId = new mongoose.Types.ObjectId(req.params.id);
        const book = await Book.findOne({ _id: bookId });
        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        // AUTO-DETECT PAGES if missing (Premium sync)
        if (!book.total_pages || book.total_pages <= 0) {
            if (book.pdf_url) {
                try {
                    const filePath = path.join(__dirname, '..', book.pdf_url);
                    if (fs.existsSync(filePath)) {
                        const existingPdfBytes = fs.readFileSync(filePath);
                        const pdfDoc = await PDFDocument.load(existingPdfBytes, {
                            ignoreEncryption: true
                        });
                        const pageCount = pdfDoc.getPageCount();

                        // Update DB so we don't have to do this again
                        book.total_pages = pageCount;
                        await book.save();
                    }
                } catch (pdfError) {
                    console.error('Error counting PDF pages:', pdfError);
                    // Fallback to a default if error, but don't crash
                }
            }
        }

        res.json({ book });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/books/:id/cover
 * Serve cover image publicly
 */
const getBookCover = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        const bookId = new mongoose.Types.ObjectId(req.params.id);
        const book = await Book.findOne({ _id: bookId });
        if (!book || !book.cover_image_url) {
            return res.status(404).json({ message: 'Cover not found.' });
        }

        const filePath = path.join(__dirname, '..', book.cover_image_url);
        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/books/:id/download
 * Secure download — only for paid users
 */
const downloadBook = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        const bookId = new mongoose.Types.ObjectId(req.params.id);
        const book = await Book.findOne({ _id: bookId });
        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        // Check if user has purchased this book
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const order = await Order.findByUserAndBook(userId, bookId);
        if (!order) {
            return res.status(403).json({ message: 'You have not purchased this book.' });
        }

        if (!book.pdf_url) {
            return res.status(404).json({ message: 'PDF file not available.' });
        }

        const filePath = path.join(__dirname, '..', book.pdf_url);
        const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.download(filePath, filename);
    } catch (error) {
        next(error);
    }
};

module.exports = { getBooks, getCategories, getBookById, getBookCover, downloadBook };
