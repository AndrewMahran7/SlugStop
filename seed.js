require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Stop = require('./models/Stop');
const Route = require('./models/Route');
const { logger } = require('./middleware/logger');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/slugstop');
        logger.info('Connected to database for seeding');

        // Clear existing data
        await Driver.deleteMany({});
        await Stop.deleteMany({});
        await Route.deleteMany({});
        logger.info('Cleared existing data');

        // Create default drivers
        const drivers = await Driver.create([
            { name: 'John', code: '1234' },
            { name: 'Jane', code: '5678' },
            { name: 'Sam', code: 'abcd' }
        ]);
        logger.info('Created default drivers');

        // Create default stops with GeoJSON Point format
        const stops = await Stop.create([
            { 
                name: 'East Remote', 
                location: { type: 'Point', coordinates: [-117.63200957809731, 33.56842576541127] },
                description: 'East Remote Parking Lot'
            },
            { 
                name: 'Science Hill', 
                location: { type: 'Point', coordinates: [-122.0586, 36.9991] },
                description: 'Science Hill Campus'
            },
            { 
                name: 'Bookstore', 
                location: { type: 'Point', coordinates: [-122.0308, 36.9741] },
                description: 'Campus Bookstore'
            },
            { 
                name: 'Roundabout', 
                location: { type: 'Point', coordinates: [-117.638597, 33.570721] },
                description: 'Main Campus Roundabout'
            },
            { 
                name: 'CV1', 
                location: { type: 'Point', coordinates: [-117.631989, 33.56643] },
                description: 'Campus Village 1'
            },
            { 
                name: 'CV2', 
                location: { type: 'Point', coordinates: [-117.643576, 33.565071] },
                description: 'Campus Village 2'
            }
        ]);
        logger.info('Created default stops');

        // Create a default route
        const defaultRoute = await Route.create({
            name: 'Main Campus Loop',
            driver: drivers[0]._id,
            stops: [
                { stop: stops.find(s => s.name === 'CV1')._id, order: 1 },
                { stop: stops.find(s => s.name === 'CV2')._id, order: 2 },
                { stop: stops.find(s => s.name === 'Roundabout')._id, order: 3 }
            ],
            estimatedDuration: 45
        });
        logger.info('Created default route');

        logger.info('Database seeding completed successfully');
        process.exit(0);

    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedData();
}

module.exports = seedData;
