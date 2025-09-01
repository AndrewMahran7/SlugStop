// Premium Bus Tracking Application with Smart Features
class PremiumTrackingApp {
    constructor() {
        this.map = null;
        this.busMarker = null;
        this.userMarker = null;
        this.routePolyline = null;
        this.followingBus = false;
        this.notificationsEnabled = false;
        this.updateInterval = null;
        this.currentRoute = null;
        this.userLocation = null;
        this.lastETATime = null;
        this.etaTrend = 'stable'; // 'improving', 'stable', 'worsening'
        
        this.init();
    }

    async init() {
        this.showLoadingOverlay();
        await this.parseUrlParameters();
        await this.requestLocation();
        this.initializeMap();
        this.bindEventListeners();
        await this.loadRouteData();
        this.startRealtimeUpdates();
        this.hideLoadingOverlay();
    }

    parseUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        this.routeId = urlParams.get('route');
        this.busId = urlParams.get('bus');
        
        if (urlParams.get('lat') && urlParams.get('lng')) {
            this.userLocation = {
                lat: parseFloat(urlParams.get('lat')),
                lng: parseFloat(urlParams.get('lng'))
            };
        }
    }

    async requestLocation() {
        if (!this.userLocation && navigator.geolocation) {
            try {
                const position = await this.getCurrentPosition();
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
            } catch (error) {
                console.warn('Location access denied:', error);
                // Use UCSC default location
                this.userLocation = { lat: 36.9741, lng: -122.0308 };
            }
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    initializeMap() {
        const defaultLocation = this.userLocation || { lat: 36.9741, lng: -122.0308 };
        
        this.map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([defaultLocation.lat, defaultLocation.lng], 14);

        // Premium map tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add user location if available
        if (this.userLocation) {
            this.addUserMarker();
        }

        // Add custom styles for markers
        this.addMapStyles();
    }

    addUserMarker() {
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
                <div class="user-location-pulse">
                    <div class="user-location-dot"></div>
                </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
            icon: userIcon,
            zIndexOffset: 1000
        }).addTo(this.map).bindPopup("Your Location");
    }

    addMapStyles() {
        if (document.getElementById('map-custom-styles')) return;

        const style = document.createElement('style');
        style.id = 'map-custom-styles';
        style.textContent = `
            .user-location-marker {
                background: transparent;
            }
            .user-location-pulse {
                width: 20px;
                height: 20px;
                position: relative;
            }
            .user-location-dot {
                width: 12px;
                height: 12px;
                background: #4299e1;
                border: 2px solid white;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.7);
                animation: user-pulse 2s infinite;
            }
            @keyframes user-pulse {
                0% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(66, 153, 225, 0); }
                100% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0); }
            }
            .bus-marker {
                background: transparent;
            }
            .bus-marker-container {
                width: 50px;
                height: 50px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .bus-icon {
                font-size: 28px;
                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
                animation: bus-float 3s ease-in-out infinite;
            }
            .bus-route-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ffd700;
                color: #2d3748;
                font-size: 11px;
                font-weight: bold;
                padding: 3px 6px;
                border-radius: 8px;
                min-width: 20px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            @keyframes bus-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
            }
        `;
        document.head.appendChild(style);
    }

    async loadRouteData() {
        try {
            // Load route information
            const routesResponse = await fetch('/api/metro/routes');
            const routes = await routesResponse.json();
            
            if (this.routeId) {
                this.currentRoute = routes.find(r => r._id === this.routeId);
                if (this.currentRoute) {
                    this.updateRouteHeader();
                    await this.loadBusData();
                    await this.loadETAData();
                    this.loadStopsData();
                }
            } else {
                // If no specific route, find the nearest bus
                await this.findNearestBus(routes);
            }
        } catch (error) {
            console.error('Failed to load route data:', error);
            this.showToast('Failed to load route information', 'error');
        }
    }

    updateRouteHeader() {
        if (!this.currentRoute) return;

        document.getElementById('routeNumber').textContent = this.currentRoute.number;
        document.getElementById('routeName').textContent = this.currentRoute.name || 'Santa Cruz METRO Route';
    }

    async loadBusData() {
        if (!this.currentRoute) return;

        try {
            const response = await fetch(`/api/metro/routes/${this.currentRoute._id}/buses`);
            const buses = await response.json();
            
            if (buses.length > 0) {
                const bus = this.busId ? buses.find(b => b._id === this.busId) : buses[0];
                if (bus) {
                    this.updateBusMarker(bus);
                    this.updateBusInfo(bus);
                }
            } else {
                this.showToast('No active buses on this route', 'warning');
            }
        } catch (error) {
            console.error('Failed to load bus data:', error);
            this.showToast('Failed to load bus location', 'error');
        }
    }

    updateBusMarker(bus) {
        const busIcon = L.divIcon({
            className: 'bus-marker',
            html: `
                <div class="bus-marker-container">
                    <div class="bus-icon">🚌</div>
                    <div class="bus-route-badge">${this.currentRoute.number}</div>
                </div>
            `,
            iconSize: [50, 50],
            iconAnchor: [25, 25]
        });

        if (this.busMarker) {
            this.map.removeLayer(this.busMarker);
        }

        this.busMarker = L.marker([bus.latitude, bus.longitude], {
            icon: busIcon,
            zIndexOffset: 500
        }).addTo(this.map);

        // Update map view to include both user and bus
        if (this.userLocation) {
            const group = L.featureGroup([this.busMarker, this.userMarker]);
            this.map.fitBounds(group.getBounds().pad(0.1));
        } else {
            this.map.setView([bus.latitude, bus.longitude], 15);
        }

        // Add click handler for bus info
        this.busMarker.on('click', () => {
            this.showBusInfoOverlay(bus);
        });
    }

    updateBusInfo(bus) {
        // Calculate and display bus speed
        const speed = bus.speed || Math.round(Math.random() * 30 + 15); // Mock speed if not available
        document.getElementById('busSpeed').textContent = `${speed} mph`;

        // Update distance to bus
        if (this.userLocation) {
            const distance = this.calculateDistance(
                this.userLocation.lat, this.userLocation.lng,
                bus.latitude, bus.longitude
            );
            document.getElementById('walkingDistance').textContent = `${distance.toFixed(1)} miles away`;
        }

        // Update last update time
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Update capacity (mock data)
        const capacities = ['Low', 'Moderate', 'High'];
        const capacity = capacities[Math.floor(Math.random() * capacities.length)];
        document.getElementById('busCapacity').textContent = capacity;
    }

    async loadETAData() {
        if (!this.currentRoute || !this.userLocation) return;

        try {
            const response = await fetch(`/api/metro/routes/${this.currentRoute._id}/etas?lat=${this.userLocation.lat}&lng=${this.userLocation.lng}`);
            const etaData = await response.json();
            
            if (etaData.etas && etaData.etas.length > 0) {
                const closestETA = etaData.etas[0]; // First is usually closest
                this.updateETADisplay(closestETA);
                this.updateNextStop(closestETA.stop.name);
            }
        } catch (error) {
            console.error('Failed to load ETA data:', error);
            document.getElementById('realTimeETA').textContent = '--';
            document.getElementById('scheduledETA').textContent = '--';
        }
    }

    updateETADisplay(etaData) {
        const realTimeETA = Math.round(etaData.realTimeETA);
        const scheduledETA = Math.round(etaData.scheduledETA);
        
        document.getElementById('realTimeETA').textContent = `${realTimeETA} min`;
        document.getElementById('scheduledETA').textContent = `${scheduledETA} min`;

        // Calculate and display ETA trend
        if (this.lastETATime !== null) {
            const diff = realTimeETA - this.lastETATime;
            const trendIcon = document.getElementById('etaTrend').querySelector('i');
            
            if (diff < -1) {
                this.etaTrend = 'improving';
                trendIcon.className = 'fas fa-arrow-down';
                trendIcon.style.color = 'var(--accent-green)';
            } else if (diff > 1) {
                this.etaTrend = 'worsening';
                trendIcon.className = 'fas fa-arrow-up';
                trendIcon.style.color = 'var(--accent-red)';
            } else {
                this.etaTrend = 'stable';
                trendIcon.className = 'fas fa-minus';
                trendIcon.style.color = 'var(--accent-gold)';
            }
        }
        
        this.lastETATime = realTimeETA;

        // Update schedule status
        const scheduleStatus = document.getElementById('scheduleStatus');
        const statusBadge = scheduleStatus.querySelector('.status-badge');
        
        const diff = realTimeETA - scheduledETA;
        if (Math.abs(diff) <= 2) {
            statusBadge.textContent = 'On Time';
            statusBadge.className = 'status-badge on-time';
        } else if (diff > 2) {
            statusBadge.textContent = `${diff} min Late`;
            statusBadge.className = 'status-badge delayed';
        } else {
            statusBadge.textContent = `${Math.abs(diff)} min Early`;
            statusBadge.className = 'status-badge early';
        }

        // Show notification if ETA is 5 minutes or less
        if (this.notificationsEnabled && realTimeETA <= 5 && realTimeETA > 0) {
            this.showBusArrivalNotification(realTimeETA);
        }
    }

    updateNextStop(stopName) {
        document.getElementById('nextStop').textContent = stopName;
    }

    loadStopsData() {
        // Create mock stops timeline for demonstration
        const stops = [
            { name: 'Science Hill', eta: 'Passed', passed: true },
            { name: 'Crown/Merrill', eta: 'Current', current: true },
            { name: 'Porter/Kresge', eta: '3 min', distance: '0.8 mi' },
            { name: 'UCSC Main Entrance', eta: '7 min', distance: '1.2 mi' },
            { name: 'Downtown Santa Cruz', eta: '15 min', distance: '3.1 mi' }
        ];

        const timeline = document.getElementById('stopsTimeline');
        timeline.innerHTML = stops.map((stop, index) => `
            <div class="stop-item">
                <div class="stop-marker ${stop.passed ? 'passed' : ''} ${stop.current ? 'current' : ''}">
                    ${stop.current ? '<i class="fas fa-bus"></i>' : index + 1}
                </div>
                <div class="stop-info">
                    <div class="stop-name">${stop.name}</div>
                    <div class="stop-eta">${stop.eta}</div>
                    ${stop.distance ? `<div class="stop-distance">${stop.distance}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    showBusInfoOverlay(bus) {
        const overlay = document.getElementById('busInfoOverlay');
        overlay.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 5000);
    }

    bindEventListeners() {
        // Map control buttons
        document.getElementById('followBusBtn').addEventListener('click', () => {
            this.toggleFollowBus();
        });
        
        document.getElementById('centerUserBtn').addEventListener('click', () => {
            this.centerOnUser();
        });
        
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Header buttons
        document.getElementById('notificationBtn').addEventListener('click', () => {
            this.toggleNotifications();
        });
        
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareLocation();
        });

        // Quick action buttons
        document.getElementById('nextBusBtn').addEventListener('click', () => {
            this.findNextBus();
        });
        
        document.getElementById('routeInfoBtn').addEventListener('click', () => {
            this.showRouteInfo();
        });
        
        document.getElementById('alternativesBtn').addEventListener('click', () => {
            this.showAlternatives();
        });

        // Notifications
        document.getElementById('enableNotificationsBtn').addEventListener('click', () => {
            this.enableNotifications();
        });

        // View all stops
        document.getElementById('viewAllStopsBtn').addEventListener('click', () => {
            this.showAllStops();
        });

        // Close action sheet
        document.getElementById('closeActionSheet').addEventListener('click', () => {
            this.hideActionSheet();
        });

        // Hide bus info overlay on map click
        this.map?.on('click', () => {
            document.getElementById('busInfoOverlay').style.display = 'none';
        });
    }

    toggleFollowBus() {
        this.followingBus = !this.followingBus;
        const btn = document.getElementById('followBusBtn');
        
        if (this.followingBus) {
            btn.classList.add('active');
            this.showToast('Following bus', 'success');
        } else {
            btn.classList.remove('active');
            this.showToast('Stopped following', 'info');
        }
    }

    centerOnUser() {
        if (this.userLocation && this.userMarker) {
            this.map.setView([this.userLocation.lat, this.userLocation.lng], 16);
            this.showToast('Centered on your location', 'info');
        } else {
            this.showToast('Location not available', 'warning');
        }
    }

    toggleFullscreen() {
        const mapContainer = document.querySelector('.map-container');
        
        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen().then(() => {
                document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i>';
                this.showToast('Entered fullscreen', 'info');
                // Invalidate map size for proper rendering
                setTimeout(() => this.map.invalidateSize(), 100);
            });
        } else {
            document.exitFullscreen().then(() => {
                document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i>';
                setTimeout(() => this.map.invalidateSize(), 100);
            });
        }
    }

    async toggleNotifications() {
        if (!('Notification' in window)) {
            this.showToast('Notifications not supported', 'error');
            return;
        }

        if (Notification.permission === 'granted') {
            this.notificationsEnabled = !this.notificationsEnabled;
            const status = this.notificationsEnabled ? 'enabled' : 'disabled';
            this.showToast(`Notifications ${status}`, 'success');
            
            // Update button appearance
            const btn = document.getElementById('notificationBtn');
            if (this.notificationsEnabled) {
                btn.style.color = 'var(--accent-gold)';
            } else {
                btn.style.color = '';
            }
        } else if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                this.showToast('Notifications enabled', 'success');
            }
        }
    }

    async enableNotifications() {
        await this.toggleNotifications();
    }

    shareLocation() {
        if (navigator.share && this.currentRoute) {
            navigator.share({
                title: `SlugStop - Route ${this.currentRoute.number}`,
                text: `Track my bus on Route ${this.currentRoute.number}`,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('Link copied to clipboard', 'success');
            });
        }
    }

    async findNextBus() {
        this.showToast('Finding next bus...', 'info');
        // Implementation would find the next bus on this route
        setTimeout(() => {
            this.showToast('Next bus arrives in 25 minutes', 'info');
        }, 1000);
    }

    showRouteInfo() {
        const content = `
            <div class="route-info-content">
                <h2>Route ${this.currentRoute?.number || '--'} Information</h2>
                <div class="route-details">
                    <div class="detail-section">
                        <h3><i class="fas fa-clock"></i> Operating Hours</h3>
                        <p>Monday - Friday: 6:00 AM - 11:00 PM</p>
                        <p>Saturday: 7:00 AM - 10:00 PM</p>
                        <p>Sunday: 8:00 AM - 9:00 PM</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3><i class="fas fa-dollar-sign"></i> Fare Information</h3>
                        <p>Adult: $2.00</p>
                        <p>Student/Senior: $1.00</p>
                        <p>UCSC Students: Free with ID</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3><i class="fas fa-wheelchair"></i> Accessibility</h3>
                        <p>All buses are wheelchair accessible</p>
                        <p>Audio announcements available</p>
                    </div>
                </div>
            </div>
        `;
        this.showActionSheet(content);
    }

    showAlternatives() {
        const content = `
            <div class="alternatives-content">
                <h2><i class="fas fa-route"></i> Alternative Routes</h2>
                <div class="alternative-routes">
                    <div class="alt-route-card">
                        <div class="route-number">18</div>
                        <div class="route-info">
                            <h3>METRO Route 18</h3>
                            <p>Similar destination • 12 min ETA</p>
                        </div>
                        <button class="btn btn-primary btn-sm">Track</button>
                    </div>
                    
                    <div class="alt-route-card">
                        <div class="route-number">20</div>
                        <div class="route-info">
                            <h3>METRO Route 20</h3>
                            <p>Express service • 8 min ETA</p>
                        </div>
                        <button class="btn btn-primary btn-sm">Track</button>
                    </div>
                </div>
                
                <div class="other-options">
                    <h3>Other Options</h3>
                    <div class="option-item">
                        <i class="fas fa-walking"></i>
                        <span>Walk to nearest stop (0.3 miles, 6 min)</span>
                    </div>
                    <div class="option-item">
                        <i class="fas fa-bicycle"></i>
                        <span>Bike share available nearby</span>
                    </div>
                </div>
            </div>
        `;
        this.showActionSheet(content);
    }

    showAllStops() {
        const content = `
            <div class="all-stops-content">
                <h2><i class="fas fa-list"></i> All Route Stops</h2>
                <div class="stops-list">
                    ${Array.from({ length: 12 }, (_, i) => `
                        <div class="stop-list-item">
                            <div class="stop-marker-small">${i + 1}</div>
                            <div class="stop-details">
                                <h4>Stop ${i + 1} Name</h4>
                                <p>123 Street Name, Santa Cruz</p>
                                <span class="amenities">
                                    <i class="fas fa-wheelchair" title="Wheelchair accessible"></i>
                                    <i class="fas fa-clock" title="Real-time info"></i>
                                </span>
                            </div>
                            <div class="stop-eta">
                                ${i === 0 ? 'Current' : `${(i * 3) + 2} min`}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.showActionSheet(content);
    }

    showActionSheet(content) {
        const actionSheet = document.getElementById('actionSheet');
        const contentEl = document.getElementById('actionSheetContent');
        
        contentEl.innerHTML = content;
        actionSheet.classList.add('active');
        actionSheet.classList.remove('hidden');
    }

    hideActionSheet() {
        const actionSheet = document.getElementById('actionSheet');
        actionSheet.classList.remove('active');
        setTimeout(() => {
            actionSheet.classList.add('hidden');
        }, 300);
    }

    showBusArrivalNotification(eta) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(`Bus Arriving Soon!`, {
                body: `Your Route ${this.currentRoute?.number || '--'} bus arrives in ${eta} minute${eta !== 1 ? 's' : ''}`,
                icon: '/static/icon-192.png',
                tag: 'bus-arrival'
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        }
    }

    startRealtimeUpdates() {
        // Update every 15 seconds for real-time data
        this.updateInterval = setInterval(async () => {
            await this.loadBusData();
            await this.loadETAData();
        }, 15000);
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 3958.8; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    showLoadingOverlay() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoadingOverlay() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        icon.className = `toast-icon ${icons[type] || icons.info}`;
        messageEl.textContent = message;
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    // Cleanup on page unload
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize the tracking app
let trackingApp;
document.addEventListener('DOMContentLoaded', () => {
    trackingApp = new PremiumTrackingApp();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        trackingApp.cleanup();
    });
});

// Global access for debugging
window.trackingApp = trackingApp;
