const mongoose = require('mongoose');

const metroBusLocationSchema = new mongoose.Schema({
    busId: {
        type: String,
        required: true
    },
    routeId: {
        type: String,
        required: true,
        ref: 'MetroRoute'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    speed: {
        type: Number, // km/h
        default: 0
    },
    heading: {
        type: Number, // degrees
        default: 0
    },
    nextStopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stop'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: 300 // Remove after 5 minutes if not updated
    }
}, {
    timestamps: true
});

metroBusLocationSchema.index({ location: '2dsphere' });
metroBusLocationSchema.index({ routeId: 1 });
metroBusLocationSchema.index({ timestamp: 1 });

module.exports = mongoose.model('MetroBusLocation', metroBusLocationSchema);
