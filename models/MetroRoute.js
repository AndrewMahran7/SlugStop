const mongoose = require('mongoose');

const metroRouteSchema = new mongoose.Schema({
    routeId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    headway: {
        type: Number, // minutes between buses during normal hours
        required: true
    },
    offHoursHeadway: {
        type: Number, // minutes between buses during off-hours
        default: null
    },
    peakHeadway: {
        type: Number, // minutes between buses during peak hours
        default: null
    },
    stops: [{
        stopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
        sequence: Number,
        travelTimeFromPrevious: Number // minutes from previous stop
    }],
    operatingHours: {
        weekday: {
            start: String, // "05:00"
            end: String    // "23:00"
        },
        weekend: {
            start: String,
            end: String
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

metroRouteSchema.methods.getCurrentHeadway = function() {
    const now = new Date();
    const hour = now.getHours();
    
    // Peak hours: 7-9 AM, 4-6 PM on weekdays
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    if (isPeakHour && isWeekday && this.peakHeadway) {
        return this.peakHeadway;
    }
    
    // Off hours: before 7 AM or after 8 PM
    const isOffHours = hour < 7 || hour > 20;
    if (isOffHours && this.offHoursHeadway) {
        return this.offHoursHeadway;
    }
    
    return this.headway;
};

metroRouteSchema.methods.getScheduledETA = function(stopSequence) {
    const headway = this.getCurrentHeadway();
    const now = new Date();
    const minutesPastHour = now.getMinutes();
    
    // Calculate when next bus should arrive based on headway
    const nextBusMinutes = headway - (minutesPastHour % headway);
    
    return nextBusMinutes;
};

module.exports = mongoose.model('MetroRoute', metroRouteSchema);
