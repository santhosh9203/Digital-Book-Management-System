/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, _next) => {
    console.error('Error:', err.message);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size exceeds the 50MB limit.' });
        }
        return res.status(400).json({ message: err.message });
    }

    if (err.code === '23505') {
        return res.status(409).json({ message: 'A record with this value already exists.' });
    }

    if (err.code === '23503') {
        return res.status(400).json({ message: 'Referenced record does not exist.' });
    }

    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Internal server error'
            : err.message || 'Internal server error';

    res.status(statusCode).json({ message });
};

module.exports = errorHandler;
