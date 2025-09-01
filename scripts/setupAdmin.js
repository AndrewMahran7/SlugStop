const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Driver = require('../models/Driver');

async function setupAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/slugstop');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Driver.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log('   Username: admin');
            console.log('   To reset password, delete the existing admin and run this script again');
            return;
        }

        // Create admin user
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        const admin = new Driver({
            username: 'admin',
            password: hashedPassword,
            name: 'System Administrator',
            role: 'admin',
            isActive: true,
            code: 'ADMIN-001'
        });

        await admin.save();
        
        console.log('🎉 Admin user created successfully!');
        console.log('');
        console.log('📋 Admin Credentials:');
        console.log('   Username: admin');
        console.log(`   Password: ${adminPassword}`);
        console.log('');
        console.log('⚠️  IMPORTANT: Change the default password after first login!');
        console.log('   Login at: /admin/login');
        
    } catch (error) {
        console.error('❌ Error setting up admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

if (require.main === module) {
    setupAdmin();
}

module.exports = { setupAdmin };
