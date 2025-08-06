const express = require('express');
const router = express.Router();
const adminState = require('../state/adminState');

// Get admin data
router.get('/data', (req, res) => {
  const stops = adminState.getStops().sort((a, b) => a.name.localeCompare(b.name));
  const routes = adminState.getRoutes();
  res.json({ stops, routes });
});

// Save stop
router.post('/save_stop', (req, res) => {
  const { name, lat, lon } = req.body;
  
  if (!name || lat == null || lon == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const stop = {
    name: name,
    lat: parseFloat(lat),
    lon: parseFloat(lon)
  };
  
  const success = adminState.addStop(stop);
  if (success) {
    res.json({ success: true, stops: adminState.getStops() });
  } else {
    res.status(400).json({ error: 'Stop already exists' });
  }
});

// Save route
router.post('/save_route', (req, res) => {
  const { route_name, stops, driver } = req.body;
  
  if (!route_name || !driver) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const route = {
    name: route_name,
    stops: Array.isArray(stops) ? stops : [stops].filter(Boolean),
    driver: driver
  };
  
  adminState.addRoute(route);
  res.json({ success: true, routes: adminState.getRoutes() });
});

module.exports = router;
