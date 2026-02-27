const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        author: { type: String, required: true, trim: true },
        category: { type: String, required: true, lowercase: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: '' },
        pdf_url: { type: String, default: null },
        cover_image_url: { type: String, default: null },
        total_pages: { type: Number, default: 0 },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// virtual id
bookSchema.virtual('id').get(function () {
    return this._id.toString();
});

bookSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
});

// indexes
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ category: 1 });

// static methods
bookSchema.statics.findAll = async function ({ search, category, page = 1, limit = 12 }) {
    const skip = (page - 1) * limit;
    let filter = {};

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
        ];
    }

    if (category) {
        filter.category = category.toLowerCase();
    }

    const total = await this.countDocuments(filter);
    const bookDocs = await this.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

    const books = bookDocs.map(doc => doc.toJSON());

    return {
        books,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
    };
};

bookSchema.statics.findById = function (id) {
    return this.findOne({ _id: id }).lean();
};

bookSchema.statics.update = function (id, updates) {
    return this.findByIdAndUpdate(id, updates, { new: true }).lean();
};

bookSchema.statics.delete = function (id) {
    return this.findByIdAndDelete(id).lean();
};

bookSchema.statics.getCategories = async function () {
    const docs = await this.find().select('category').distinct('category');
    return docs.sort();
};

bookSchema.statics.count = function () {
    return this.countDocuments();
};

bookSchema.statics.topSelling = async function (limit = 5) {
    const Order = mongoose.model('Order');
    const books = await this.aggregate([
        {
            $lookup: {
                from: 'orders',
                let: { book_id: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$book_id', '$$book_id'] },
                            status: 'paid',
                        },
                    },
                ],
                as: 'orders',
            },
        },
        {
            $addFields: {
                sales_count: { $size: '$orders' },
                total_revenue: { $sum: '$orders.amount' },
            },
        },
        { $sort: { sales_count: -1 } },
        { $limit: limit },
        { $project: { orders: 0 } },
    ]);
    return books;
};

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
