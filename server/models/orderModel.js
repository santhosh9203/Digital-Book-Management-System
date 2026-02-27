const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        book_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        razorpay_order_id: { type: String, required: true },
        payment_id: { type: String, default: null },
        amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['created', 'paid', 'failed'],
            default: 'created',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// virtual id
orderSchema.virtual('id').get(function () {
    return this._id.toString();
});

orderSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
});

// indexes
orderSchema.index({ razorpay_order_id: 1 });
orderSchema.index({ user_id: 1 });
orderSchema.index({ status: 1 });

// static methods
orderSchema.statics.findByRazorpayOrderId = function (razorpay_order_id) {
    return this.findOne({ razorpay_order_id }).lean();
};

orderSchema.statics.updatePaymentStatus = function (razorpay_order_id, { payment_id, status }) {
    return this.findOneAndUpdate(
        { razorpay_order_id },
        { payment_id, status },
        { new: true }
    ).lean();
};

orderSchema.statics.findByUserAndBook = function (user_id, book_id) {
    return this.findOne({
        user_id,
        book_id,
        status: 'paid',
    }).lean();
};

orderSchema.statics.findByUserId = function (user_id) {
    return this.find({ user_id })
        .populate('book_id', 'title author cover_image_url category')
        .sort({ created_at: -1 })
        .lean();
};

orderSchema.statics.findAll = function () {
    return this.find()
        .populate('user_id', 'name email')
        .populate('book_id', 'title author')
        .sort({ created_at: -1 })
        .lean();
};

orderSchema.statics.count = function () {
    return this.countDocuments({ status: 'paid' });
};

orderSchema.statics.totalRevenue = async function () {
    const result = await this.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
};

orderSchema.statics.monthlyRevenue = async function () {
    const result = await this.aggregate([
        { $match: { status: 'paid' } },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m',
                        date: '$created_at',
                    },
                },
                revenue: { $sum: '$amount' },
                order_count: { $sum: 1 },
            },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
        {
            $project: {
                month: '$_id',
                revenue: 1,
                order_count: 1,
                _id: 0,
            },
        },
    ]);
    return result;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
