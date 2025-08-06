const express = require('express');
const router = express.Router();
const Stop = require('../models/Stop');
const Driver = require('../models/Driver');
const BusLocation = require('../models/BusLocation');
const { validateCoordinates } = require('../middleware/validation');
const { logger } = require('../middleware/logger');

// Haversine distance calculation
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
            Math.sin(dLon / 2) ** 2;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get all stops
router.get('/stops', async (req, res) => {
  try {
    const stops = await Stop.find({ isActive: true }).sort({ name: 1 });
    const formattedStops = stops.map(stop => ({
      name: stop.name,
      lat: stop.location.latitude,
      lon: stop.location.longitude
    }));
    res.json(formattedStops);
  } catch (error) {
    logger.error('Get stops error:', error);
    res.status(500).json({ error: 'Failed to get stops' });
  }
});

// Find closest stop and get driver options
router.post('/find-closest', validateCoordinates, async (req, res) => {
  try {
    const { lat, lon } = req.body;
    
    const stops = await Stop.find({ isActive: true });
    if (stops.length === 0) {
      return res.status(404).json({ error: 'No stops available' });
    }
    
    const closest = stops.reduce((prev, curr) => {
      const prevDist = haversine(lat, lon, prev.location.latitude, prev.location.longitude);
      const currDist = haversine(lat, lon, curr.location.latitude, curr.location.longitude);
      return currDist < prevDist ? curr : prev;
    });
    
    res.json({ 
      stop: {
        name: closest.name,
        lat: closest.location.latitude,
        lon: closest.location.longitude
      }
    });
  } catch (error) {
    logger.error('Find closest stop error:', error);
    res.status(500).json({ error: 'Failed to find closest stop' });
  }
});

// Get available drivers with ETA
router.post('/drivers', validateCoordinates, async (req, res) => {
  try {
    const { stop_lat, stop_lon } = req.body;
    
    // Get active drivers with current locations
    const activeDrivers = await Driver.find({ 
      isActive: true,
      'currentLocation.latitude': { $exists: true }
    });
    
    const drivers = [];
    
    for (const driver of activeDrivers) {
      if (driver.currentLocation) {
        const dist = haversine(
          driver.currentLocation.latitude, 
          driver.currentLocation.longitude, 
          stop_lat, 
          stop_lon
        );
        const eta = Math.max(1, Math.round((dist / 20) * 60)); // Assuming 20 mph average speed, minimum 1 minute
        
        drivers.push({
          name: driver.name,
          eta: eta,
          lat: driver.currentLocation.latitude,
          lon: driver.currentLocation.longitude
        });
      }
    }
    
    drivers.sort((a, b) => a.eta - b.eta);
    res.json({ drivers });
  } catch (error) {
    logger.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
});

module.exports = router;
