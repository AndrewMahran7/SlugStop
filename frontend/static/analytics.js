// SlugStop Analytics & Personalization Engine
class SlugStopAnalytics {
    constructor() {
        this.userId = this.getOrCreateUserId();
        this.sessionId = this.generateSessionId();
        this.events = [];
        this.preferences = this.loadUserPreferences();
        this.patterns = this.loadUsagePatterns();
        this.initialized = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startSessionTracking();
        this.analyzePatternsOnStartup();
        this.initialized = true;
        
        console.log('[Analytics] Initialized for user:', this.userId.slice(0, 8) + '...');
    }

    // User Identification
    getOrCreateUserId() {
        let userId = localStorage.getItem('slugstop_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('slugstop_user_id', userId);
        }
        return userId;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    // Event Tracking
    trackEvent(eventName, properties = {}) {
        const event = {
            id: this.generateEventId(),
            name: eventName,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                userId: this.userId,
                sessionId: this.sessionId,
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };

        this.events.push(event);
        this.processEventForPatterns(event);
        this.saveEventToLocal(event);
        
        // Send to server if online
        if (navigator.onLine) {
            this.sendEventToServer(event);
        } else {
            this.queueEventForSync(event);
        }

        console.log('[Analytics] Event tracked:', eventName, properties);
    }

    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    // Smart Event Processing
    processEventForPatterns(event) {
        switch (event.name) {
            case 'route_viewed':
                this.updateRouteFrequency(event.properties.routeId);
                break;
            case 'trip_planned':
                this.updateTripPattern(event.properties.from, event.properties.to);
                break;
            case 'bus_tracked':
                this.updateTrackingPreferences(event.properties);
                break;
            case 'location_used':
                this.updateLocationPatterns(event.properties.location);
                break;
            case 'time_preference':
                this.updateTimePatterns(event.properties.time);
                break;
        }
    }

    // Usage Pattern Analysis
    updateRouteFrequency(routeId) {
        if (!this.patterns.routes) this.patterns.routes = {};
        if (!this.patterns.routes[routeId]) {
            this.patterns.routes[routeId] = { count: 0, lastUsed: null };
        }
        
        this.patterns.routes[routeId].count++;
        this.patterns.routes[routeId].lastUsed = new Date().toISOString();
        this.saveUsagePatterns();
    }

    updateTripPattern(from, to) {
        if (!this.patterns.trips) this.patterns.trips = {};
        const tripKey = `${from}_to_${to}`;
        
        if (!this.patterns.trips[tripKey]) {
            this.patterns.trips[tripKey] = { count: 0, lastUsed: null };
        }
        
        this.patterns.trips[tripKey].count++;
        this.patterns.trips[tripKey].lastUsed = new Date().toISOString();
        this.saveUsagePatterns();
    }

    updateTimePatterns(time) {
        if (!this.patterns.timePreferences) this.patterns.timePreferences = {};
        const hour = new Date(time).getHours();
        const dayOfWeek = new Date(time).getDay();
        
        const timeKey = `${dayOfWeek}_${hour}`;
        if (!this.patterns.timePreferences[timeKey]) {
            this.patterns.timePreferences[timeKey] = 0;
        }
        
        this.patterns.timePreferences[timeKey]++;
        this.saveUsagePatterns();
    }

    // Personalization Engine
    getPersonalizedRecommendations() {
        const recommendations = {
            favoriteRoutes: this.getFavoriteRoutes(),
            frequentTrips: this.getFrequentTrips(),
            predictedNeeds: this.getPredictedNeeds(),
            timeBasedSuggestions: this.getTimeBasedSuggestions()
        };

        console.log('[Analytics] Generated personalized recommendations:', recommendations);
        return recommendations;
    }

    getFavoriteRoutes() {
        if (!this.patterns.routes) return [];
        
        return Object.entries(this.patterns.routes)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 5)
            .map(([routeId, data]) => ({
                routeId,
                usageCount: data.count,
                lastUsed: data.lastUsed
            }));
    }

    getFrequentTrips() {
        if (!this.patterns.trips) return [];
        
        return Object.entries(this.patterns.trips)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 3)
            .map(([tripKey, data]) => {
                const [from, to] = tripKey.split('_to_');
                return {
                    from,
                    to,
                    frequency: data.count,
                    lastUsed: data.lastUsed
                };
            });
    }

    getPredictedNeeds() {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        // Predict based on current time patterns
        const predictions = [];
        
        // Morning commute prediction
        if (hour >= 7 && hour <= 9 && dayOfWeek >= 1 && dayOfWeek <= 5) {
            predictions.push({
                type: 'commute',
                suggestion: 'to_campus',
                confidence: 0.8,
                message: 'Looks like your morning commute time!'
            });
        }
        
        // Evening return prediction
        if (hour >= 17 && hour <= 19 && dayOfWeek >= 1 && dayOfWeek <= 5) {
            predictions.push({
                type: 'return',
                suggestion: 'from_campus',
                confidence: 0.7,
                message: 'Time to head home?'
            });
        }
        
        // Weekend suggestions
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            predictions.push({
                type: 'leisure',
                suggestion: 'downtown_or_beach',
                confidence: 0.6,
                message: 'Weekend adventure awaiting!'
            });
        }
        
        return predictions;
    }

    getTimeBasedSuggestions() {
        if (!this.patterns.timePreferences) return [];
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();
        
        // Find similar time patterns
        const suggestions = [];
        Object.entries(this.patterns.timePreferences).forEach(([timeKey, count]) => {
            const [day, hour] = timeKey.split('_').map(Number);
            
            // If this is a frequently used time slot
            if (count >= 3 && day === currentDay && Math.abs(hour - currentHour) <= 1) {
                suggestions.push({
                    timeSlot: `${day}_${hour}`,
                    frequency: count,
                    suggestion: `You often use SlugStop around ${hour}:00 on ${this.getDayName(day)}`
                });
            }
        });
        
        return suggestions.slice(0, 3);
    }

    // Smart Notifications
    shouldShowSmartNotification(type, context = {}) {
        const lastNotification = this.getLastNotificationTime(type);
        const cooldownPeriod = this.getNotificationCooldown(type);
        
        // Check cooldown
        if (lastNotification && (Date.now() - lastNotification) < cooldownPeriod) {
            return false;
        }
        
        // Check user preferences
        if (!this.preferences.notifications?.[type]) {
            return false;
        }
        
        // Context-specific logic
        switch (type) {
            case 'commute_reminder':
                return this.shouldShowCommuteReminder(context);
            case 'route_suggestion':
                return this.shouldShowRouteSuggestion(context);
            case 'delay_alert':
                return this.shouldShowDelayAlert(context);
            default:
                return true;
        }
    }

    shouldShowCommuteReminder(context) {
        const patterns = this.getCommutePatterns();
        const now = new Date();
        const currentTime = `${now.getDay()}_${now.getHours()}`;
        
        return patterns.includes(currentTime);
    }

    getCommutePatterns() {
        if (!this.patterns.timePreferences) return [];
        
        return Object.entries(this.patterns.timePreferences)
            .filter(([, count]) => count >= 3)
            .map(([timeKey]) => timeKey);
    }

    // Predictive Features
    predictNextAction() {
        const recentEvents = this.events.slice(-10);
        const eventSequence = recentEvents.map(e => e.name);
        
        // Simple pattern matching for next likely action
        const commonSequences = {
            'app_opened,location_requested': 'find_buses',
            'route_viewed,eta_checked': 'start_tracking',
            'trip_planned,route_selected': 'track_journey',
            'bus_tracked,arrival_imminent': 'prepare_to_board'
        };
        
        for (const [sequence, prediction] of Object.entries(commonSequences)) {
            const sequenceArray = sequence.split(',');
            if (this.matchesSequence(eventSequence, sequenceArray)) {
                return {
                    prediction,
                    confidence: 0.7,
                    reasoning: `Based on your recent actions: ${sequenceArray.join(' → ')}`
                };
            }
        }
        
        return null;
    }

    matchesSequence(events, pattern) {
        if (events.length < pattern.length) return false;
        
        const recentEvents = events.slice(-pattern.length);
        return pattern.every((action, index) => recentEvents[index] === action);
    }

    // A/B Testing Framework
    getExperimentVariant(experimentName) {
        const userId = this.userId;
        const hash = this.hashString(userId + experimentName);
        const bucket = hash % 100;
        
        // Define experiments
        const experiments = {
            'eta_display_format': {
                'control': { bucket: [0, 49], variant: 'minutes_only' },
                'test': { bucket: [50, 99], variant: 'minutes_and_seconds' }
            },
            'map_default_zoom': {
                'control': { bucket: [0, 49], variant: 14 },
                'test': { bucket: [50, 99], variant: 15 }
            },
            'notification_timing': {
                'control': { bucket: [0, 33], variant: '5_minutes' },
                'test_a': { bucket: [34, 66], variant: '3_minutes' },
                'test_b': { bucket: [67, 99], variant: '7_minutes' }
            }
        };
        
        const experiment = experiments[experimentName];
        if (!experiment) return null;
        
        for (const [variantName, config] of Object.entries(experiment)) {
            const [min, max] = config.bucket;
            if (bucket >= min && bucket <= max) {
                return {
                    experiment: experimentName,
                    variant: variantName,
                    config: config.variant
                };
            }
        }
        
        return null;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    // Privacy & Consent Management
    updatePrivacySettings(settings) {
        this.preferences.privacy = {
            ...this.preferences.privacy,
            ...settings,
            updatedAt: new Date().toISOString()
        };
        
        this.saveUserPreferences();
        
        // If analytics disabled, clear stored data
        if (!settings.analytics) {
            this.clearAnalyticsData();
        }
    }

    clearAnalyticsData() {
        localStorage.removeItem('slugstop_events');
        localStorage.removeItem('slugstop_patterns');
        this.events = [];
        this.patterns = {};
        
        console.log('[Analytics] User data cleared per privacy settings');
    }

    // Data Persistence
    saveEventToLocal(event) {
        const events = JSON.parse(localStorage.getItem('slugstop_events') || '[]');
        events.push(event);
        
        // Keep only last 1000 events to manage storage
        if (events.length > 1000) {
            events.splice(0, events.length - 1000);
        }
        
        localStorage.setItem('slugstop_events', JSON.stringify(events));
    }

    saveUsagePatterns() {
        localStorage.setItem('slugstop_patterns', JSON.stringify(this.patterns));
    }

    loadUsagePatterns() {
        return JSON.parse(localStorage.getItem('slugstop_patterns') || '{}');
    }

    saveUserPreferences() {
        localStorage.setItem('slugstop_preferences', JSON.stringify(this.preferences));
    }

    loadUserPreferences() {
        return JSON.parse(localStorage.getItem('slugstop_preferences') || JSON.stringify({
            notifications: {
                commute_reminder: true,
                route_suggestion: true,
                delay_alert: true,
                arrival_notification: true
            },
            privacy: {
                analytics: true,
                location_tracking: true,
                personalization: true
            },
            display: {
                theme: 'auto',
                eta_format: 'minutes',
                map_zoom: 14
            }
        }));
    }

    // Server Communication
    async sendEventToServer(event) {
        try {
            await fetch('/api/analytics/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.log('[Analytics] Failed to send event to server:', error);
            this.queueEventForSync(event);
        }
    }

    queueEventForSync(event) {
        const queue = JSON.parse(localStorage.getItem('slugstop_sync_queue') || '[]');
        queue.push(event);
        localStorage.setItem('slugstop_sync_queue', JSON.stringify(queue));
    }

    // Utility Methods
    getDayName(dayIndex) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex];
    }

    getLastNotificationTime(type) {
        const notifications = JSON.parse(localStorage.getItem('slugstop_notifications') || '{}');
        return notifications[type];
    }

    getNotificationCooldown(type) {
        const cooldowns = {
            'commute_reminder': 60 * 60 * 1000, // 1 hour
            'route_suggestion': 30 * 60 * 1000, // 30 minutes
            'delay_alert': 15 * 60 * 1000,      // 15 minutes
            'arrival_notification': 5 * 60 * 1000 // 5 minutes
        };
        return cooldowns[type] || 60 * 60 * 1000;
    }

    setupEventListeners() {
        // Track page views
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_unload', {
                timeOnPage: Date.now() - this.sessionStartTime,
                url: window.location.href
            });
        });

        // Track user interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-track]')) {
                const trackingData = e.target.closest('[data-track]').dataset;
                this.trackEvent('user_interaction', trackingData);
            }
        });

        // Track errors
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        });
    }

    startSessionTracking() {
        this.sessionStartTime = Date.now();
        this.trackEvent('session_start', {
            referrer: document.referrer,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }

    analyzePatternsOnStartup() {
        // Run pattern analysis on app startup
        setTimeout(() => {
            const recommendations = this.getPersonalizedRecommendations();
            const prediction = this.predictNextAction();
            
            // Dispatch custom event with insights
            window.dispatchEvent(new CustomEvent('slugstop:insights', {
                detail: {
                    recommendations,
                    prediction
                }
            }));
        }, 1000);
    }
}

// Global analytics instance
window.SlugStopAnalytics = new SlugStopAnalytics();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SlugStopAnalytics;
}
