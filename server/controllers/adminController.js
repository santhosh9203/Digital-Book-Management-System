const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Book = require('../models/bookModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

const orderStatusLabels = {
    order_placed: 'Order placed',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
};

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
                const coverFile = req.files.cover[0];
                const coverFilePath = coverFile.path;
                const coverData = fs.readFileSync(coverFilePath);
                const coverType = coverFile.mimetype;
                
                // Store in DB, then remove local temp file
                var cover_image_data = coverData;
                var cover_image_type = coverType;
                var has_cover = true;
                
                try {
                    fs.unlinkSync(coverFilePath);
                } catch (err) {
                    console.error('Error deleting temp cover file:', err);
                }
            }
        }

        const book = await Book.create({
            title,
            author,
            category,
            price: parseFloat(price),
            description,
            pdf_url,
            cover_image_data,
            cover_image_type,
            has_cover,
        });

        const users = await User.find({ role: 'user' }).select('_id').lean();
        if (users.length > 0) {
            const notifications = users.map((u) => ({
                user_id: u._id,
                title: 'New arrival',
                message: `New book \"${book.title}\" is now available.`,
                type: 'book',
                link: `/books/${book._id.toString()}`,
            }));
            await Notification.insertMany(notifications);
        }

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
                const coverFile = req.files.cover[0];
                const coverFilePath = coverFile.path;
                updates.cover_image_data = fs.readFileSync(coverFilePath);
                updates.cover_image_type = coverFile.mimetype;
                updates.has_cover = true;
                
                try {
                    fs.unlinkSync(coverFilePath);
                } catch (err) {
                    console.error('Error deleting temp cover file:', err);
                }
                
                // Remove the URL if it somehow existed before
                updates.cover_image_url = undefined; 
            }
        }

        const book = await Book.findByIdAndUpdate(bookId, updates, { new: true })
            .select('-cover_image_data') // Don't send buffer back in response
            .lean();
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

        // Delete associated local files (PDF only)
        if (book.pdf_url) {
            const pdfPath = path.join(__dirname, '..', book.pdf_url);
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        }

        await Book.deleteOne({ _id: bookId });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/admin/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const { status, note, tracking_number } = req.body;
        if (!status || !orderStatusLabels[status]) {
            return res.status(400).json({ message: 'Invalid order status.' });
        }

        const orderId = new mongoose.Types.ObjectId(req.params.id);
        const order = await Order.findOne({ _id: orderId }).populate('book_id', 'title');
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        order.fulfillment_status = status;
        if (tracking_number !== undefined) {
            order.tracking_number = tracking_number || '';
        }
        if (status === 'delivered' && !order.delivery_date) {
            order.delivery_date = new Date();
        }
        if (status === 'cancelled') {
            order.cancelled_at = new Date();
        }
        if (status === 'returned' && !order.returned_at) {
            order.returned_at = new Date();
        }

        const entry = {
            status,
            label: orderStatusLabels[status],
            note: note || '',
            timestamp: new Date(),
        };

        if (!Array.isArray(order.tracking_history)) {
            order.tracking_history = [];
        }
        order.tracking_history.push(entry);

        await order.save();

        if (order.user_id) {
            await Notification.create({
                user_id: order.user_id,
                title: 'Order update',
                message: `Your order for \"${order.book_id?.title || 'Book'}\" is now ${orderStatusLabels[status]}.`,
                type: 'order',
                link: `/orders?highlight=${order._id.toString()}`,
                metadata: { status },
            });
            if (status === 'delivered' && order.book_id?._id) {
                await Notification.create({
                    user_id: order.user_id,
                    title: 'Rate your purchase',
                    message: `Your order for \"${order.book_id?.title || 'Book'}\" was delivered. Leave a review.`,
                    type: 'order',
                    link: `/books/${order.book_id._id.toString()}`,
                    metadata: { book_id: order.book_id._id.toString(), order_id: order._id.toString() },
                });
            }
        }

        res.json({ message: 'Order updated successfully', order });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getUsers,
    getOrders,
    getBooks,
    addBook,
    updateBook,
    deleteBook,
    updateOrderStatus,
};
