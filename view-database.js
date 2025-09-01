const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('./models/Driver');
const Stop = require('./models/Stop');
const Route = require('./models/Route');
const BusLocation = require('./models/BusLocation');

async function viewDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // View Drivers
        console.log('👥 === DRIVERS ===');
        const drivers = await Driver.find({});
        if (drivers.length === 0) {
            console.log('   No drivers found');
        } else {
            drivers.forEach((driver, index) => {
                console.log(`   ${index + 1}. ${driver.name} (${driver.role})`);
                console.log(`      Username: ${driver.username}`);
                console.log(`      Bus: ${driver.busNumber || 'None'}`);
                console.log(`      On Shift: ${driver.onShift}`);
                console.log(`      Last Login: ${driver.lastLogin || 'Never'}`);
                console.log('');
            });
        }
        
        // View Stops
        console.log('\n🚏 === STOPS ===');
        const stops = await Stop.find({});
        if (stops.length === 0) {
            console.log('   No stops found');
        } else {
            stops.forEach((stop, index) => {
                const coords = stop.location.coordinates;
                console.log(`   ${index + 1}. ${stop.name}`);
                console.log(`      Coordinates: [${coords[1]}, ${coords[0]}]`);
                console.log(`      Active: ${stop.isActive}`);
                console.log(`      QR Code: ${stop.qrCodePath || 'Not generated'}`);
                console.log('');
            });
        }
        
        // View Routes
        console.log('\n🚌 === ROUTES ===');
        const routes = await Route.find({}).populate('stops');
        if (routes.length === 0) {
            console.log('   No routes found');
        } else {
            routes.forEach((route, index) => {
                console.log(`   ${index + 1}. ${route.name} (${route.stops.length} stops)`);
                console.log(`      Active: ${route.isActive}`);
                console.log(`      Stops:`);
                route.stops.forEach((stop, stopIndex) => {
                    console.log(`         ${stopIndex + 1}. ${stop.name}`);
                });
                console.log('');
            });
        }
        
        // View Bus Locations
        console.log('\n📍 === BUS LOCATIONS (Last 10) ===');
        const locations = await BusLocation.find({})
            .populate('driver')
            .sort({ timestamp: -1 })
            .limit(10);
        
        if (locations.length === 0) {
            console.log('   No bus locations found');
        } else {
            locations.forEach((location, index) => {
                const coords = location.location.coordinates;
                const time = new Date(location.timestamp).toLocaleString();
                console.log(`   ${index + 1}. Driver: ${location.driver?.name || 'Unknown'}`);
                console.log(`      Location: [${coords[1]}, ${coords[0]}]`);
                console.log(`      Time: ${time}`);
                console.log(`      Speed: ${location.speed || 0} km/h`);
                console.log('');
            });
        }
        
        // Summary
        console.log('\n📊 === SUMMARY ===');
        console.log(`📋 Collections:`);
        console.log(`   👥 Drivers: ${drivers.length}`);
        console.log(`   🚏 Stops: ${stops.length}`);
        console.log(`   🚌 Routes: ${routes.length}`);
        console.log(`   📍 Bus Locations: ${locations.length}`);
        
        // Active stats
        const activeDrivers = drivers.filter(d => d.onShift).length;
        const activeStops = stops.filter(s => s.isActive).length;
        const activeRoutes = routes.filter(r => r.isActive).length;
        
        console.log(`\n⚡ Active Status:`);
        console.log(`   👥 Active Drivers: ${activeDrivers}/${drivers.length}`);
        console.log(`   🚏 Active Stops: ${activeStops}/${stops.length}`);
        console.log(`   🚌 Active Routes: ${activeRoutes}/${routes.length}`);
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        console.log('\n🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('✅ Disconnected');
    }
}

// Add command line argument handling
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📋 SlugStop Database Viewer

Usage: node view-database.js [options]

Options:
  --help, -h     Show this help message
  --drivers      Show only drivers
  --stops        Show only stops
  --routes       Show only routes
  --locations    Show only bus locations
  --stats        Show only summary statistics

Examples:
  node view-database.js           # Show everything
  node view-database.js --drivers # Show only drivers
  node view-database.js --stats   # Show only statistics
`);
    process.exit(0);
}

viewDatabase();
