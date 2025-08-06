const express = require('express');
const router = express.Router();
const stopsState = require('../state/stopsState');
const busState = require('../state/busState');

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

// Get stops
router.get('/stops', (req, res) => {
  res.json(stopsState.getStops());
});

// Find closest stop and get driver options
router.post('/find-closest', (req, res) => {
  const { lat, lon } = req.body;
  
  if (lat == null || lon == null) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }
  
  const stops = stopsState.getStops();
  const closest = stops.reduce((prev, curr) => {
    const prevDist = haversine(lat, lon, prev.lat, prev.lon);
    const currDist = haversine(lat, lon, curr.lat, curr.lon);
    return currDist < prevDist ? curr : prev;
  });
  
  res.json({ stop: closest });
});

// Get available drivers with ETA
router.post('/drivers', (req, res) => {
  const { stop_lat, stop_lon } = req.body;
  
  if (stop_lat == null || stop_lon == null) {
    return res.status(400).json({ error: 'Missing stop coordinates' });
  }
  
  const busData = busState.getBusData();
  const drivers = [];
  
  for (const [name, bus] of Object.entries(busData)) {
    const dist = haversine(bus.lat, bus.lon, stop_lat, stop_lon);
    const eta = Math.round((dist / 20) * 60); // Assuming 20 mph average speed
    
    drivers.push({
      name: name,
      eta: eta,
      lat: bus.lat,
      lon: bus.lon
    });
  }
  
  drivers.sort((a, b) => a.eta - b.eta);
  res.json({ drivers });
});

module.exports = router;
