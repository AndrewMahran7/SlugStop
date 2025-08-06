const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Driver = require('./models/Driver');

async function createAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');
        
        // Check if admin already exists
        const existingAdmin = await Driver.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('⚠️  Admin account already exists');
            console.log(`   Username: ${existingAdmin.name}`);
            console.log('   Use this account to login to the admin panel');
            process.exit(0);
        }
        
        // Create admin account
        const admin = new Driver({
            name: 'admin',
            code: 'admin123', // Will be hashed automatically
            role: 'admin',
            busNumber: null,
            onShift: false,
            isActive: true
        });
        
        await admin.save();
        console.log('✅ Admin account created successfully!');
        console.log('');
        console.log('Admin Login Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('');
        console.log('Access admin panel at: http://localhost:3001/admin');
        console.log('');
        console.log('⚠️  IMPORTANT: Change the default password after first login!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin account:', error.message);
        if (error.code === 11000) {
            console.log('   Admin with this name already exists');
        }
        process.exit(1);
    }
}

async function createDriver(name, password, busNumber) {
    try {
        const driver = new Driver({
            name: name,
            code: password, // Will be hashed automatically
            role: 'driver',
            busNumber: busNumber,
            onShift: false,
            isActive: true
        });
        
        await driver.save();
        console.log(`✅ Driver created: ${name} assigned to Bus ${busNumber}`);
        return driver;
    } catch (error) {
        console.error(`❌ Error creating driver ${name}:`, error.message);
        throw error;
    }
}

async function createDrivers() {
    try {
        console.log('Creating driver accounts...');
        
        const drivers = [
            { name: 'driver1', password: 'driver123', busNumber: '101' },
            { name: 'driver2', password: 'driver456', busNumber: '102' },
            { name: 'driver3', password: 'driver789', busNumber: '103' },
            { name: 'driver4', password: 'driver101', busNumber: '104' }
        ];
        
        for (const driverData of drivers) {
            try {
                await createDriver(driverData.name, driverData.password, driverData.busNumber);
            } catch (error) {
                if (error.code === 11000) {
                    console.log(`   Driver ${driverData.name} already exists`);
                }
            }
        }
        
        console.log('✅ Driver accounts setup complete!');
        
    } catch (error) {
        console.error('❌ Error creating drivers:', error.message);
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--drivers-only')) {
        await createDrivers();
    } else if (args.includes('--admin-only')) {
        await createAdmin();
    } else {
        await createAdmin();
        await createDrivers();
    }
    
    await mongoose.disconnect();
}

// Handle command line execution
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    });
}

module.exports = { createAdmin, createDriver, createDrivers };
