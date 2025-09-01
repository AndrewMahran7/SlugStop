const MetroRoute = require('../models/MetroRoute');
const MetroBusLocation = require('../models/MetroBusLocation');
const Stop = require('../models/Stop');

class ETAService {
    // Calculate distance between two coordinates using Haversine formula
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance;
    }

    static toRad(Value) {
        return Value * Math.PI / 180;
    }

    // Get real-time ETA based on bus location
    static async getRealTimeETA(routeId, stopId) {
        try {
            // Only look for real bus locations (exclude simulation buses)
            const busLocations = await MetroBusLocation.find({ 
                routeId: routeId,
                busId: { $not: { $regex: /^SIM-BUS-/ } }, // Exclude simulation buses
                timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes for production
            }).sort({ timestamp: -1 });

            if (busLocations.length === 0) {
                return null; // No real-time data available
            }

            const stop = await Stop.findById(stopId);
            if (!stop) return null;

            const stopLat = stop.location.coordinates[1];
            const stopLon = stop.location.coordinates[0];

            let shortestETA = Infinity;

            for (const busLocation of busLocations) {
                const busLat = busLocation.location.coordinates[1];
                const busLon = busLocation.location.coordinates[0];
                
                const distance = this.calculateDistance(busLat, busLon, stopLat, stopLon);
                
                // Estimate ETA based on reported speed or average city bus speed
                const avgSpeed = busLocation.speed > 0 ? busLocation.speed : 25;
                const estimatedETA = (distance / avgSpeed) * 60; // Convert to minutes
                
                if (estimatedETA < shortestETA) {
                    shortestETA = estimatedETA;
                }
            }

            return shortestETA === Infinity ? null : Math.round(shortestETA);
        } catch (error) {
            console.error('Error calculating real-time ETA:', error);
            return null;
        }
    }

    // Get scheduled ETA based on route headway
    static async getScheduledETA(routeId, stopId) {
        try {
            const route = await MetroRoute.findOne({ routeId: routeId }).populate('stops.stopId');
            if (!route) return null;

            const stopIndex = route.stops.findIndex(stop => 
                stop.stopId._id.toString() === stopId.toString()
            );
            
            if (stopIndex === -1) return null;

            // Calculate total travel time to this stop from route start
            let totalTravelTime = 0;
            for (let i = 1; i <= stopIndex; i++) {
                totalTravelTime += route.stops[i].travelTimeFromPrevious || 0;
            }

            const baseETA = route.getScheduledETA(stopIndex);
            return baseETA + totalTravelTime;
        } catch (error) {
            console.error('Error calculating scheduled ETA:', error);
            return null;
        }
    }

    // Get best ETA (combines real-time and scheduled)
    static async getBestETA(routeId, stopId) {
        const [realTimeETA, scheduledETA] = await Promise.all([
            this.getRealTimeETA(routeId, stopId),
            this.getScheduledETA(routeId, stopId)
        ]);

        const result = {
            realTime: realTimeETA,
            scheduled: scheduledETA,
            best: null,
            source: null
        };

        if (realTimeETA !== null && scheduledETA !== null) {
            // Use real-time if it's reasonable, otherwise fall back to scheduled
            if (realTimeETA <= scheduledETA * 1.5) { // Within 50% of scheduled
                result.best = realTimeETA;
                result.source = 'real-time';
            } else {
                result.best = scheduledETA;
                result.source = 'scheduled';
            }
        } else if (realTimeETA !== null) {
            result.best = realTimeETA;
            result.source = 'real-time';
        } else if (scheduledETA !== null) {
            result.best = scheduledETA;
            result.source = 'scheduled';
        }

        return result;
    }

    // Get ETAs for all stops on a route
    static async getRouteETAs(routeId) {
        try {
            const route = await MetroRoute.findOne({ routeId: routeId }).populate('stops.stopId');
            if (!route) return null;

            const etas = [];
            
            for (const stop of route.stops) {
                const eta = await this.getBestETA(routeId, stop.stopId._id);
                etas.push({
                    stop: {
                        id: stop.stopId._id,
                        name: stop.stopId.name,
                        sequence: stop.sequence
                    },
                    eta: eta
                });
            }

            return {
                routeId: routeId,
                routeName: route.name,
                stops: etas
            };
        } catch (error) {
            console.error('Error getting route ETAs:', error);
            return null;
        }
    }
}

module.exports = ETAService;
