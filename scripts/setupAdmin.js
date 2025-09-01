// Production Admin Setup Script
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();

// Admin Schema
const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'admin' },
    permissions: [{
        type: String,
        enum: ['dashboard', 'drivers', 'routes', 'stops', 'users', 'analytics']
    }],
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function setupAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/slugstop');
        console.log('Connected to MongoDB');

        // Create super admin
        const hashedPassword = await bcrypt.hash('admin123!@#', 12);
        
        const superAdmin = new Admin({
            email: 'admin@slugstop.com',
            password: hashedPassword,
            name: 'Super Administrator',
            role: 'super_admin',
            permissions: ['dashboard', 'drivers', 'routes', 'stops', 'users', 'analytics'],
            isActive: true
        });

        await superAdmin.save();
        console.log('✅ Super admin created successfully');
        console.log('Email: admin@slugstop.com');
        console.log('Password: admin123!@# (CHANGE THIS IMMEDIATELY)');

        // Create additional admin accounts as needed
        const additionalAdmins = [
            {
                email: 'operations@slugstop.com',
                password: await bcrypt.hash('ops123secure', 12),
                name: 'Operations Manager',
                permissions: ['dashboard', 'drivers', 'routes']
            },
            {
                email: 'support@slugstop.com',
                password: await bcrypt.hash('support123secure', 12),
                name: 'Support Administrator',
                permissions: ['dashboard', 'users']
            }
        ];

        for (const adminData of additionalAdmins) {
            const admin = new Admin(adminData);
            await admin.save();
            console.log(`✅ Admin created: ${admin.email}`);
        }

        console.log('\n🔐 IMPORTANT: Change all default passwords immediately!');
        console.log('📧 Set up proper email notifications for password resets');
        
    } catch (error) {
        console.error('Error setting up admins:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the setup
if (require.main === module) {
    setupAdmins();
}

module.exports = { Admin };
