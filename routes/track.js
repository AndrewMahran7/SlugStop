const express = require('express');
const router = express.Router();
const busState = require('../state/busState');
const adminState = require('../state/adminState');

// Get tracking data
router.get('/data', (req, res) => {
  const buses = busState.getBusData();
  const stops = adminState.getStops();
  res.json({ buses, stops });
});

module.exports = router;
