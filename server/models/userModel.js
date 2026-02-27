const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// virtual id
userSchema.virtual('id').get(function () {
    return this._id.toString();
});

userSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        delete ret._id;
        return ret;
    },
});

// static helpers that mimic previous API
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email }).lean();
};

userSchema.statics.findById = function (id) {
    // return limited fields
    return this.findOne({ _id: id })
        .select('name email role created_at')
        .lean();
};

userSchema.statics.findAll = function () {
    return this.find()
        .select('name email role created_at')
        .sort({ created_at: -1 })
        .lean();
};

userSchema.statics.count = function () {
    return this.countDocuments();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
