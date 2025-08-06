const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    stops: [{
        stop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stop',
            required: true
        },
        order: {
            type: Number,
            required: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    estimatedDuration: {
        type: Number, // in minutes
        default: 60
    }
}, {
    timestamps: true
});

// Ensure stops are ordered correctly
routeSchema.pre('save', function(next) {
    if (this.stops && this.stops.length > 0) {
        this.stops.sort((a, b) => a.order - b.order);
    }
    next();
});

// Method to get populated route with stops
routeSchema.methods.getPopulatedRoute = function() {
    return this.populate('driver stops.stop');
};

module.exports = mongoose.model('Route', routeSchema);
