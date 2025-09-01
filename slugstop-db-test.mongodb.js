/* global use, db */
// SlugStop MongoDB Playground - Test your database connection and queries
// Make sure you are connected to your SlugStop database to run these queries

// Select the SlugStop database
use('slugstop');

// Test 1: Check if collections exist
console.log('=== SlugStop Database Collections ===');
db.getCollectionNames();

// Test 2: Check Metro Routes
console.log('\n=== Metro Routes ===');
db.getCollection('metroroutes').find({}).limit(5);

// Test 3: Check if there are any drivers
console.log('\n=== Drivers ===');
db.getCollection('drivers').find({}).limit(3);

// Test 4: Check bus locations
console.log('\n=== Recent Bus Locations ===');
db.getCollection('metrobuslocations').find({}).sort({timestamp: -1}).limit(5);

// Test 5: Check admin users
console.log('\n=== Admin Users (passwords hidden) ===');
db.getCollection('users').find({role: 'admin'}, {password: 0});

// Test 6: Create sample bus location for testing
const sampleLocation = {
  routeId: 'route_20',
  routeName: '20 - Mission/Watsonville',
  busId: 'bus_20_01',
  latitude: 36.9741,
  longitude: -122.0308,
  timestamp: new Date(),
  speed: 25.5,
  heading: 180,
  status: 'active'
};

console.log('\n=== Inserting Sample Bus Location ===');
db.getCollection('metrobuslocations').insertOne(sampleLocation);

// Test 7: Query buses near UCSC (example geospatial query)
console.log('\n=== Buses Near UCSC Campus ===');
db.getCollection('metrobuslocations').find({
  latitude: { $gte: 36.97, $lte: 37.00 },
  longitude: { $gte: -122.07, $lte: -122.05 }
}).limit(10);

// Test 8: Create geospatial index for location queries (run only once)
console.log('\n=== Creating Geospatial Index ===');
try {
  db.getCollection('metrobuslocations').createIndex({
    "location": "2dsphere"
  });
  console.log('Geospatial index created successfully');
} catch (error) {
  console.log('Index might already exist:', error.message);
}

// Test 9: Advanced geospatial query - find buses within 1km of UCSC
console.log('\n=== Buses Within 1km of UCSC ===');
db.getCollection('metrobuslocations').find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-122.0585, 36.9916] // UCSC coordinates [longitude, latitude]
      },
      $maxDistance: 1000 // 1000 meters = 1km
    }
  }
}).limit(5);

// Test 10: Check if metro routes have been seeded
console.log('\n=== Metro Route Count ===');
const routeCount = db.getCollection('metroroutes').countDocuments();
console.log(`Total Metro Routes: ${routeCount}`);

if (routeCount === 0) {
  console.log('\n⚠️ No metro routes found! Run the seeding script:');
  console.log('node scripts/seedMetroRoutes.js');
}
