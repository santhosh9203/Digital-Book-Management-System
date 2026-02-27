const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../uploads/books');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (_req, file, cb) => {
    const allowedTypes = {
        'application/pdf': true,
        'image/jpeg': true,
        'image/jpg': true,
        'image/png': true,
        'image/webp': true,
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPEG, PNG, and WebP files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
    },
});

module.exports = upload;
