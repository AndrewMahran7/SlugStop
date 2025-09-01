const mongoose = require('mongoose');
require('dotenv').config();

const MetroRoute = require('../models/MetroRoute');
const Stop = require('../models/Stop');

const metroRoutesData = {
    "1": {
        name: "Soquel / Cabrillo / Airport",
        headway: 20,
        offHoursHeadway: 30,
        stops: [
            { name: "Boardwalk", sequence: 1 },
            { name: "Soquel Ave & 17th Ave", sequence: 2, travelTime: 5 },
            { name: "Cabrillo College", sequence: 3, travelTime: 8 },
            { name: "Airport", sequence: 4, travelTime: 12 }
        ]
    },
    "2": {
        name: "Capitola / Cabrillo / Main",
        headway: 20,
        offHoursHeadway: 30,
        stops: [
            { name: "Downtown Santa Cruz", sequence: 1 },
            { name: "Capitola Village", sequence: 2, travelTime: 15 },
            { name: "Cabrillo College", sequence: 3, travelTime: 10 }
        ]
    },
    "11": {
        name: "UCSC via West Gate",
        headway: 15,
        stops: [
            { name: "Downtown Santa Cruz", sequence: 1 },
            { name: "West Gate", sequence: 2, travelTime: 20 },
            { name: "Crown/Merrill", sequence: 3, travelTime: 5 },
            { name: "Porter/Kresge", sequence: 4, travelTime: 7 },
            { name: "East Remote", sequence: 5, travelTime: 10 }
        ]
    },
    "18": {
        name: "UCSC via Main Gate (Mission Corridor)",
        headway: 15,
        stops: [
            { name: "Downtown Santa Cruz", sequence: 1 },
            { name: "Mission St Corridor", sequence: 2, travelTime: 10 },
            { name: "Main Entrance", sequence: 3, travelTime: 15 },
            { name: "Quarry Plaza", sequence: 4, travelTime: 5 },
            { name: "Science Hill", sequence: 5, travelTime: 8 }
        ]
    },
    "19": {
        name: "UCSC via West Gate (Lower Bay)",
        headway: 15,
        stops: [
            { name: "Lower Bay Area", sequence: 1 },
            { name: "West Gate", sequence: 2, travelTime: 25 },
            { name: "Crown/Merrill", sequence: 3, travelTime: 5 },
            { name: "Cowell/Stevenson", sequence: 4, travelTime: 8 }
        ]
    },
    "20": {
        name: "UCSC via Main Gate (Delaware / Western)",
        headway: 15,
        stops: [
            { name: "Delaware/Western Neighborhood", sequence: 1 },
            { name: "Main Entrance", sequence: 2, travelTime: 12 },
            { name: "Quarry Plaza", sequence: 3, travelTime: 5 },
            { name: "West Remote", sequence: 4, travelTime: 10 }
        ]
    },
    "35": {
        name: "Highway 9 / Scotts Valley",
        headway: 30,
        stops: [
            { name: "Downtown Santa Cruz", sequence: 1 },
            { name: "Highway 9 Corridor", sequence: 2, travelTime: 20 },
            { name: "Scotts Valley", sequence: 3, travelTime: 15 }
        ]
    },
    "75": {
        name: "Green Valley – Wheelock",
        headway: 60,
        stops: [
            { name: "Watsonville Transit Center", sequence: 1 },
            { name: "Green Valley", sequence: 2, travelTime: 25 },
            { name: "Wheelock", sequence: 3, travelTime: 20 }
        ]
    },
    "17": {
        name: "Highway 17 Express",
        headway: 60,
        peakHeadway: 30,
        stops: [
            { name: "Downtown Santa Cruz", sequence: 1 },
            { name: "Scotts Valley Transit Center", sequence: 2, travelTime: 15 },
            { name: "Pasatiempo", sequence: 3, travelTime: 10 },
            { name: "San Jose", sequence: 4, travelTime: 45 }
        ]
    }
};

async function seedMetroRoutes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/slugstop');
        console.log('Connected to MongoDB');

        // Clear existing metro routes
        await MetroRoute.deleteMany({});
        console.log('Cleared existing Metro routes');

        // Create routes with stops
        for (const [routeId, routeData] of Object.entries(metroRoutesData)) {
            console.log(`\nCreating route ${routeId}: ${routeData.name}`);
            
            const route = new MetroRoute({
                routeId: routeId,
                name: routeData.name,
                headway: routeData.headway,
                offHoursHeadway: routeData.offHoursHeadway,
                peakHeadway: routeData.peakHeadway,
                stops: [],
                operatingHours: {
                    weekday: { start: "05:00", end: "23:00" },
                    weekend: { start: "06:00", end: "22:00" }
                }
            });

            // Find or create stops and add to route
            for (const stopData of routeData.stops) {
                let stop = await Stop.findOne({ name: stopData.name });
                
                if (!stop) {
                    // Create new stop with estimated coordinates
                    const coordinates = getEstimatedCoordinates(stopData.name);
                    stop = new Stop({
                        name: stopData.name,
                        location: {
                            type: "Point",
                            coordinates: coordinates
                        },
                        description: `${stopData.name} - Metro Route ${routeId} stop`
                    });
                    await stop.save();
                    console.log(`  Created stop: ${stopData.name}`);
                } else {
                    console.log(`  Found existing stop: ${stopData.name}`);
                }

                route.stops.push({
                    stopId: stop._id,
                    sequence: stopData.sequence,
                    travelTimeFromPrevious: stopData.travelTime || 0
                });
            }

            await route.save();
            console.log(`✅ Created Metro Route ${routeId}: ${routeData.name} with ${route.stops.length} stops`);
        }

        console.log('\n🎉 Metro routes seeded successfully!');
        
    } catch (error) {
        console.error('Error seeding Metro routes:', error);
    } finally {
        mongoose.disconnect();
    }
}

function getEstimatedCoordinates(stopName) {
    // Estimated coordinates for Santa Cruz area stops
    const stopCoordinates = {
        "Downtown Santa Cruz": [-122.0308, 36.9741],
        "Boardwalk": [-122.0175, 36.9627],
        "Main Entrance": [-122.0584, 36.9916],
        "Quarry Plaza": [-122.0647, 36.9994],
        "Science Hill": [-122.0636, 37.0006],
        "Crown/Merrill": [-122.0503, 36.9989],
        "Porter/Kresge": [-122.0647, 37.0011],
        "Cowell/Stevenson": [-122.0584, 36.9955],
        "East Remote": [-122.0442, 36.9983],
        "West Remote": [-122.0707, 36.9972],
        "West Gate": [-122.0707, 36.9950],
        "Capitola Village": [-121.9552, 36.9752],
        "Cabrillo College": [-121.9190, 36.9146],
        "Airport": [-121.8447, 36.9878],
        "Soquel Ave & 17th Ave": [-122.0100, 36.9700],
        "Mission St Corridor": [-122.0250, 36.9750],
        "Lower Bay Area": [-122.0100, 36.9500],
        "Delaware/Western Neighborhood": [-122.0400, 36.9800],
        "Highway 9 Corridor": [-122.0500, 37.0200],
        "Scotts Valley": [-122.0147, 37.0510],
        "Scotts Valley Transit Center": [-122.0147, 37.0510],
        "Pasatiempo": [-121.9000, 37.0000],
        "San Jose": [-121.8863, 37.3382],
        "Watsonville Transit Center": [-121.7569, 36.9107],
        "Green Valley": [-121.7800, 36.9300],
        "Wheelock": [-121.8000, 36.9500]
    };

    return stopCoordinates[stopName] || [-122.0308, 36.9741]; // Default to downtown Santa Cruz
}

if (require.main === module) {
    seedMetroRoutes();
}

module.exports = { seedMetroRoutes };
