const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Stop = require('../models/Stop');
const { logger } = require('../middleware/logger');

// Get tracking data
router.get('/data', async (req, res) => {
  try {
    // Get active drivers with current locations
    const activeDrivers = await Driver.find({ 
      isActive: true,
      'currentLocation.latitude': { $exists: true }
    }).select('name currentLocation');
    
    // Get all stops
    const stops = await Stop.find({ isActive: true });
    
    // Format data for frontend
    const buses = {};
    activeDrivers.forEach(driver => {
      if (driver.currentLocation) {
        buses[driver.name] = {
          lat: driver.currentLocation.latitude,
          lon: driver.currentLocation.longitude,
          last_update: driver.currentLocation.timestamp
        };
      }
    });
    
    const formattedStops = stops.map(stop => ({
      name: stop.name,
      lat: stop.location.latitude,
      lon: stop.location.longitude
    }));
    
    res.json({ buses, stops: formattedStops });
  } catch (error) {
    logger.error('Get tracking data error:', error);
    res.status(500).json({ error: 'Failed to get tracking data' });
  }
});

module.exports = router;
