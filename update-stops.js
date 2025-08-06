const mongoose = require('mongoose');
require('dotenv').config();

const Stop = require('./models/Stop');

const realUCSCStops = [
    {
        name: "Main Entrance",
        location: {
            type: "Point",
            coordinates: [-122.0584, 36.9916]
        },
        description: "UCSC Main Entrance - Bay & High Street"
    },
    {
        name: "Quarry Plaza",
        location: {
            type: "Point", 
            coordinates: [-122.0647, 36.9994]
        },
        description: "Student Services and Dining"
    },
    {
        name: "Science Hill",
        location: {
            type: "Point",
            coordinates: [-122.0586, 36.9991]
        },
        description: "Physical & Biological Sciences"
    },
    {
        name: "Crown/Merrill",
        location: {
            type: "Point",
            coordinates: [-122.0505, 37.0042]
        },
        description: "Crown and Merrill Colleges"
    },
    {
        name: "Porter/Kresge",
        location: {
            type: "Point",
            coordinates: [-122.0665, 37.0011]
        },
        description: "Porter and Kresge Colleges"
    },
    {
        name: "Cowell/Stevenson",
        location: {
            type: "Point",
            coordinates: [-122.0544, 36.9968]
        },
        description: "Cowell and Stevenson Colleges"
    },
    {
        name: "East Remote",
        location: {
            type: "Point",
            coordinates: [-122.0520, 36.9899]
        },
        description: "East Remote Parking Lot"
    },
    {
        name: "West Remote",
        location: {
            type: "Point",
            coordinates: [-122.0692, 36.9953]
        },
        description: "West Remote Parking Lot"
    },
    {
        name: "Village",
        location: {
            type: "Point",
            coordinates: [-122.0634, 37.0028]
        },
        description: "Graduate Student Housing"
    },
    {
        name: "Bookstore",
        location: {
            type: "Point",
            coordinates: [-122.0635, 36.9985]
        },
        description: "Campus Bookstore & Bay Tree Building"
    },
    {
        name: "Health Center",
        location: {
            type: "Point",
            coordinates: [-122.0618, 36.9976]
        },
        description: "Student Health Center"
    },
    {
        name: "Recreation Center",
        location: {
            type: "Point",
            coordinates: [-122.0609, 36.9976]
        },
        description: "East Field House & Recreation"
    }
];

async function updateStops() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');
        
        console.log('Updating bus stops with real UCSC coordinates...');
        
        // Clear existing stops
        await Stop.deleteMany({});
        console.log('Cleared existing stops');
        
        // Insert new stops
        const stops = await Stop.insertMany(realUCSCStops);
        console.log(`✅ Created ${stops.length} bus stops with real UCSC coordinates`);
        
        console.log('\nBus stops created:');
        stops.forEach(stop => {
            console.log(`   📍 ${stop.name} - ${stop.description}`);
        });
        
        console.log('\n✅ Bus stop update complete!');
        
    } catch (error) {
        console.error('❌ Error updating stops:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Handle command line execution
if (require.main === module) {
    updateStops().catch(error => {
        console.error('❌ Update failed:', error.message);
        process.exit(1);
    });
}

module.exports = { updateStops, realUCSCStops };
