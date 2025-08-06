const express = require('express');
const router = express.Router();
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const { validateStop, validateRoute } = require('../middleware/validation');
const { authenticateToken, requireAdmin, generateToken } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    
    // Find admin user
    const admin = await Driver.findOne({ 
      name: name.trim(),
      role: 'admin'
    });
    
    if (!admin || !await admin.compareCode(code)) {
      logger.warn('Admin login failed', { name, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    // Generate token
    const token = generateToken({
      id: admin._id,
      name: admin.name,
      role: admin.role
    });
    
    logger.info('Admin logged in successfully', { 
      adminId: admin._id,
      name: admin.name 
    });
    
    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        role: admin.role
      }
    });
    
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Apply authentication to all routes below
router.use(authenticateToken);
router.use(requireAdmin);

// Get admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const activeDrivers = await Driver.findActiveDrivers();
    const totalStops = await Stop.countDocuments({ isActive: true });
    const totalRoutes = await Route.countDocuments({ isActive: true });
    const totalDrivers = await Driver.countDocuments({ role: 'driver' });
    
    res.json({
      stats: {
        activeDrivers: activeDrivers.length,
        totalStops,
        totalRoutes,
        totalDrivers
      },
      activeDrivers: activeDrivers.map(driver => ({
        id: driver._id,
        name: driver.name,
        busNumber: driver.busNumber,
        onShift: driver.onShift,
        currentLocation: driver.currentLocation ? {
          latitude: driver.currentLatitude,
          longitude: driver.currentLongitude,
          timestamp: driver.currentLocation.timestamp
        } : null
      }))
    });
    
  } catch (error) {
    logger.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get admin data
router.get('/data', async (req, res) => {
  try {
    const stops = await Stop.find({ isActive: true }).sort({ name: 1 });
    const routes = await Route.find({ isActive: true })
      .populate('driver')
      .populate('stops.stop');
    
    // Format stops for frontend
    const formattedStops = stops.map(stop => ({
      id: stop._id,
      name: stop.name,
      lat: stop.location.coordinates[1], // latitude
      lon: stop.location.coordinates[0], // longitude
      description: stop.description
    }));
    
    // Format routes for frontend
    const formattedRoutes = routes.map(route => ({
      id: route._id,
      name: route.name,
      driver: route.driver ? route.driver.name : 'Unassigned',
      driverId: route.driver ? route.driver._id : null,
      stops: route.stops.map(s => ({
        name: s.stop.name,
        order: s.order
      }))
    }));
    
    res.json({ 
      stops: formattedStops, 
      routes: formattedRoutes 
    });
  } catch (error) {
    logger.error('Get admin data error:', error);
    res.status(500).json({ error: 'Failed to get admin data' });
  }
});

// Save stop
router.post('/save_stop', validateStop, async (req, res) => {
  try {
    const { name, lat, lon, description } = req.body;
    
    // Check if stop already exists
    const existingStop = await Stop.findOne({ name: name.trim() });
    if (existingStop) {
      return res.status(400).json({ error: 'Stop already exists' });
    }
    
    // Create new stop with GeoJSON format
    const stop = new Stop({
      name: name.trim(),
      location: {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)] // [longitude, latitude]
      },
      description: description || ''
    });
    
    await stop.save();
    
    logger.info('Stop created', {
      stopId: stop._id,
      name: stop.name,
      adminId: req.user.id
    });
    
    res.json({ 
      message: 'Stop saved successfully',
      stop: {
        id: stop._id,
        name: stop.name,
        lat: stop.location.coordinates[1],
        lon: stop.location.coordinates[0],
        description: stop.description
      }
    });
    
  } catch (error) {
    logger.error('Save stop error:', error);
    res.status(500).json({ error: 'Failed to save stop' });
  }
});

// Get all drivers
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find({ role: 'driver' }).select('name busNumber onShift isActive');
    res.json({ drivers });
  } catch (error) {
    logger.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
});

// Update driver
router.put('/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, busNumber, isActive } = req.body;
    
    const driver = await Driver.findByIdAndUpdate(
      id,
      { name, busNumber, isActive },
      { new: true, runValidators: true }
    );
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    logger.info('Driver updated', {
      driverId: driver._id,
      name: driver.name,
      adminId: req.user.id
    });
    
    res.json({ 
      message: 'Driver updated successfully',
      driver: {
        id: driver._id,
        name: driver.name,
        busNumber: driver.busNumber,
        isActive: driver.isActive
      }
    });
    
  } catch (error) {
    logger.error('Update driver error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// Save route
router.post('/save_route', validateRoute, async (req, res) => {
  try {
    const { route_name, stops, driver } = req.body;
    
    // Find driver
    let driverDoc = await Driver.findOne({ name: driver.trim(), role: 'driver' });
    if (!driverDoc) {
      return res.status(400).json({ error: 'Driver not found' });
    }
    
    // Find stop IDs
    const stopDocs = await Stop.find({ 
      name: { $in: stops },
      isActive: true 
    });
    
    if (stopDocs.length !== stops.length) {
      return res.status(400).json({ error: 'Some stops not found' });
    }
    
    // Create route with ordered stops
    const routeStops = stops.map((stopName, index) => {
      const stopDoc = stopDocs.find(s => s.name === stopName);
      return {
        stop: stopDoc._id,
        order: index + 1
      };
    });
    
    const route = new Route({
      name: route_name.trim(),
      driver: driverDoc._id,
      stops: routeStops
    });
    
    await route.save();
    
    logger.info('Route created', {
      routeId: route._id,
      name: route.name,
      adminId: req.user.id
    });
    
    res.json({ 
      message: 'Route saved successfully',
      route: {
        id: route._id,
        name: route.name,
        driver: driverDoc.name,
        stops: stops
      }
    });
    
  } catch (error) {
    logger.error('Save route error:', error);
    res.status(500).json({ error: 'Failed to save route' });
  }
});

module.exports = router;
