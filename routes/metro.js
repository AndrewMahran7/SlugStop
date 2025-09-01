const express = require('express');
const router = express.Router();
const MetroRoute = require('../models/MetroRoute');
const MetroBusLocation = require('../models/MetroBusLocation');
const ETAService = require('../services/ETAService');

// Get all METRO routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await MetroRoute.find({ isActive: true })
            .populate('stops.stopId', 'name location description')
            .sort({ routeId: 1 });
        
        res.json({
            success: true,
            routes: routes.map(route => ({
                routeId: route.routeId,
                name: route.name,
                headway: route.getCurrentHeadway(),
                stops: route.stops.map(stop => ({
                    id: stop.stopId._id,
                    name: stop.stopId.name,
                    location: stop.stopId.location,
                    sequence: stop.sequence,
                    travelTime: stop.travelTimeFromPrevious
                }))
            }))
        });
    } catch (error) {
        console.error('Error fetching METRO routes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch routes' });
    }
});

// Get specific route details
router.get('/routes/:routeId', async (req, res) => {
    try {
        const route = await MetroRoute.findOne({ 
            routeId: req.params.routeId, 
            isActive: true 
        }).populate('stops.stopId');

        if (!route) {
            return res.status(404).json({ success: false, error: 'Route not found' });
        }

        res.json({
            success: true,
            route: {
                routeId: route.routeId,
                name: route.name,
                headway: route.getCurrentHeadway(),
                operatingHours: route.operatingHours,
                stops: route.stops.map(stop => ({
                    id: stop.stopId._id,
                    name: stop.stopId.name,
                    location: stop.stopId.location,
                    sequence: stop.sequence,
                    travelTime: stop.travelTimeFromPrevious
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch route' });
    }
});

// Get ETAs for a specific route
router.get('/routes/:routeId/etas', async (req, res) => {
    try {
        const etas = await ETAService.getRouteETAs(req.params.routeId);
        
        if (!etas) {
            return res.status(404).json({ success: false, error: 'Route not found' });
        }

        res.json({
            success: true,
            ...etas
        });
    } catch (error) {
        console.error('Error fetching ETAs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ETAs' });
    }
});

// Get ETA for specific stop on route
router.get('/routes/:routeId/stops/:stopId/eta', async (req, res) => {
    try {
        const eta = await ETAService.getBestETA(req.params.routeId, req.params.stopId);
        
        res.json({
            success: true,
            routeId: req.params.routeId,
            stopId: req.params.stopId,
            eta: eta
        });
    } catch (error) {
        console.error('Error fetching stop ETA:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ETA' });
    }
});

// Get active buses on route
router.get('/routes/:routeId/buses', async (req, res) => {
    try {
        const buses = await MetroBusLocation.find({
            routeId: req.params.routeId,
            timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
        }).sort({ timestamp: -1 });

        res.json({
            success: true,
            routeId: req.params.routeId,
            buses: buses.map(bus => ({
                busId: bus.busId,
                location: {
                    latitude: bus.location.coordinates[1],
                    longitude: bus.location.coordinates[0]
                },
                speed: bus.speed,
                heading: bus.heading,
                lastUpdate: bus.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch buses' });
    }
});

module.exports = router;
