#!/usr/bin/env node

const mongoose = require('mongoose');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

const { createAdmin, createDrivers } = require('./create-admin');
const { updateStops } = require('./update-stops');
const { generateQRCodes } = require('./generate-qr-codes');

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n📋 Step ${step}: ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

async function checkMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logSuccess('MongoDB connection successful');
        await mongoose.disconnect();
        return true;
    } catch (error) {
        logError(`MongoDB connection failed: ${error.message}`);
        log('Please make sure MongoDB is running on localhost:27017', 'yellow');
        return false;
    }
}

async function setupAdmin() {
    logStep(1, 'Setting up admin and driver accounts');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Create admin
        await createAdmin();
        logSuccess('Admin account created');
        
        // Create drivers
        await createDrivers();
        logSuccess('Driver accounts created');
        
        await mongoose.disconnect();
        return true;
    } catch (error) {
        logError(`Account setup failed: ${error.message}`);
        return false;
    }
}

async function setupStops() {
    logStep(2, 'Setting up UCSC bus stops with real coordinates');
    
    try {
        await updateStops();
        logSuccess('Bus stops updated with real UCSC coordinates');
        return true;
    } catch (error) {
        logError(`Stop setup failed: ${error.message}`);
        return false;
    }
}

async function setupQRCodes() {
    logStep(3, 'Generating QR codes for bus stops');
    
    try {
        await generateQRCodes();
        logSuccess('QR codes generated successfully');
        return true;
    } catch (error) {
        logError(`QR code generation failed: ${error.message}`);
        return false;
    }
}

async function installDependencies() {
    logStep(0, 'Installing missing dependencies');
    
    try {
        const { stdout } = await execAsync('npm install qrcode');
        logSuccess('Dependencies installed');
        return true;
    } catch (error) {
        logError(`Dependency installation failed: ${error.message}`);
        return false;
    }
}

async function main() {
    log(`
🚌 SlugStop Admin Setup Script
=============================
This script will set up your SlugStop admin environment with:
- Admin and driver accounts
- Real UCSC bus stop coordinates  
- QR codes for all stops
- Complete admin dashboard
`, 'bright');

    // Check prerequisites
    log('\n🔍 Checking prerequisites...', 'blue');
    
    if (!await checkMongoDB()) {
        process.exit(1);
    }
    
    // Install dependencies
    if (!await installDependencies()) {
        process.exit(1);
    }
    
    // Setup admin accounts
    if (!await setupAdmin()) {
        process.exit(1);
    }
    
    // Setup bus stops
    if (!await setupStops()) {
        process.exit(1);
    }
    
    // Generate QR codes
    if (!await setupQRCodes()) {
        process.exit(1);
    }
    
    // Final success message
    log(`
🎉 SlugStop Admin Setup Complete!
=================================

Your SlugStop system is now ready for production use:

📋 ADMIN ACCESS:
   • Username: admin
   • Password: admin123
   • URL: http://localhost:3001/admin

🚌 DRIVER ACCOUNTS CREATED:
   • driver1 / driver123 (Bus 101)
   • driver2 / driver456 (Bus 102) 
   • driver3 / driver789 (Bus 103)
   • driver4 / driver101 (Bus 104)

📍 BUS STOPS:
   • ${12} real UCSC locations configured
   • Geospatial indexing enabled

🔗 QR CODES:
   • Generated for all bus stops
   • Print sheet: /qrcodes/generated/print_all_qr_codes.html

⚠️  NEXT STEPS:
   1. Change default admin password after first login
   2. Print and post QR codes at physical bus stops
   3. Test driver login and location tracking
   4. Configure production environment variables

🚀 Start your application:
   npm start

Access admin dashboard: http://localhost:3001/admin
`, 'green');
}

// Handle command line execution
if (require.main === module) {
    main().catch(error => {
        logError(`Setup failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main };
