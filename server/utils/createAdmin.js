const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/userModel');

async function createAdmin() {
    try {
        // Connect to MongoDB
        require('../config/db');

        const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
            process.exit(1);
        }

        const existing = await User.findByEmail(ADMIN_EMAIL);
        if (existing) {
            console.log('⚠️  Admin user already exists:', ADMIN_EMAIL);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
        const admin = await User.create({
            name: ADMIN_NAME || 'Admin',
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
        });

        console.log('✅ Admin created:', admin.email);
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create admin:', error.message);
        process.exit(1);
    }
}

createAdmin();
