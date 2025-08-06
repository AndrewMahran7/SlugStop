const express = require('express');
const router = express.Router();
const BusLocation = require('../models/BusLocation');
const Driver = require('../models/Driver');
const { validateLocation } = require('../middleware/validation');
const { logger } = require('../middleware/logger');

// Update location
router.post('/', validateLocation, async (req, res) => {
  try {
    const { name, lat, lon, timestamp } = req.body;
    
    // Find driver by name
    const driver = await Driver.findOne({ name: name.trim(), isActive: true });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found or inactive' });
    }
    
    // Create new location record
    const location = new BusLocation({
      driver: driver._id,
      location: {
        latitude: lat,
        longitude: lon
      },
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    
    await location.save();
    
    // Update driver's current location
    await driver.updateLocation(lat, lon);
    
    logger.debug(`Location updated for driver: ${name}`, { lat, lon });
    res.json({ status: 'Location updated' });
    
  } catch (error) {
    logger.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get all current locations
router.get('/', async (req, res) => {
  try {
    const activeDrivers = await Driver.find({ 
      isActive: true,
      'currentLocation.latitude': { $exists: true }
    }).select('name currentLocation');
    
    const locationData = {};
    activeDrivers.forEach(driver => {
      if (driver.currentLocation) {
        locationData[driver.name] = {
          lat: driver.currentLocation.latitude,
          lon: driver.currentLocation.longitude,
          last_update: driver.currentLocation.timestamp
        };
      }
    });
    
    res.json(locationData);
    
  } catch (error) {
    logger.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
});

// Get location history for a specific driver
router.get('/history/:driverName', async (req, res) => {
  try {
    const { driverName } = req.params;
    const hours = parseInt(req.query.hours) || 1;
    
    const driver = await Driver.findOne({ name: driverName });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    const locations = await BusLocation.getLocationHistory(driver._id, hours);
    res.json(locations);
    
  } catch (error) {
    logger.error('Get location history error:', error);
    res.status(500).json({ error: 'Failed to get location history' });
  }
});

module.exports = router;
