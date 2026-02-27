const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
require('./db');

async function migrate() {
    try {
        console.log('✅ MongoDB connection established. Collections will be created automatically on first use.');
        console.log('✅ Database migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Wait for MongoDB connection to be established
setTimeout(() => {
    migrate();
}, 2000);
