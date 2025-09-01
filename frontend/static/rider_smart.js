// Smart Rider Experience with All UX Enhancements
class SmartRiderApp {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.busMarkers = [];
        this.routePolylines = [];
        this.favorites = JSON.parse(localStorage.getItem('slugstop_favorites') || '[]');
        this.notificationsEnabled = false;
        this.updateInterval = null;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        this.showLoadingScreen();
        await this.requestLocationPermission();
        this.initializeMap();
        this.bindEventListeners();
        this.startDataUpdates();
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('progressBar');
        
        loadingScreen.classList.remove('hidden');
        
        // Simulate loading progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) {
                progress = 100;
                clearInterval(progressInterval);
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    }

    async requestLocationPermission() {
        if (!navigator.geolocation) {
            this.showManualLocationSelection();
            return;
        }

        try {
            const position = await this.getCurrentPosition();
            this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            await this.updateLocationDisplay();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Location access denied:', error);
            this.showPermissionScreen();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    showPermissionScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('permissionScreen').classList.remove('hidden');
    }

    showManualLocationSelection() {
        this.showToast('GPS not available. Please select location manually.', 'warning');
        // Show map-based location picker
        this.hideLoadingScreen();
        this.initializeMap();
        this.showLocationPicker();
    }

    async updateLocationDisplay() {
        const locationElement = document.getElementById('currentLocation');
        const accuracyElement = document.getElementById('locationAccuracy');
        
        if (this.userLocation) {
            try {
                // Reverse geocoding for readable address
                const address = await this.reverseGeocode(this.userLocation.lat, this.userLocation.lng);
                locationElement.textContent = address || 'Current Location';
                
                const accuracy = Math.round(this.userLocation.accuracy);
                accuracyElement.textContent = `Accuracy: ±${accuracy}m`;
            } catch (error) {
                locationElement.textContent = 'Current Location';
                accuracyElement.textContent = 'GPS location detected';
            }
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.display_name) {
                // Extract meaningful parts of address
                const address = data.address;
                const parts = [];
                
                if (address.building || address.house_number) {
                    parts.push(address.building || address.house_number);
                }
                if (address.road) {
                    parts.push(address.road);
                }
                if (address.neighbourhood || address.suburb) {
                    parts.push(address.neighbourhood || address.suburb);
                }
                
                return parts.slice(0, 2).join(', ') || data.display_name.split(',')[0];
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
        }
        return null;
    }

    initializeMap() {
        const mapContainer = document.getElementById('map');
        const defaultLocation = this.userLocation || { lat: 36.9741, lng: -122.0308 }; // UCSC default
        
        this.map = L.map(mapContainer, {
            zoomControl: false,
            attributionControl: false
        }).setView([defaultLocation.lat, defaultLocation.lng], 15);

        // Premium map tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add custom controls
        this.addMapControls();
        
        // Add user location marker if available
        if (this.userLocation) {
            this.addUserLocationMarker();
        }

        // Load and display routes
        this.loadRoutesOnMap();
    }

    addMapControls() {
        // Center map button
        document.getElementById('centerMapBtn').addEventListener('click', () => {
            if (this.userLocation) {
                this.map.setView([this.userLocation.lat, this.userLocation.lng], 16);
            }
        });

        // Layer toggle button
        document.getElementById('layerToggleBtn').addEventListener('click', () => {
            // Toggle between different map views
            this.toggleMapLayers();
        });
    }

    addUserLocationMarker() {
        if (!this.userLocation) return;

        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-location-dot"></div><div class="user-location-accuracy"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
            icon: userIcon,
            zIndexOffset: 1000
        }).addTo(this.map);

        // Add accuracy circle
        const accuracyCircle = L.circle([this.userLocation.lat, this.userLocation.lng], {
            radius: this.userLocation.accuracy || 50,
            fillColor: '#4299e1',
            color: '#4299e1',
            weight: 1,
            opacity: 0.3,
            fillOpacity: 0.1
        }).addTo(this.map);

        // Add CSS for user location marker
        this.addUserLocationStyles();
    }

    addUserLocationStyles() {
        if (document.getElementById('user-location-styles')) return;

        const style = document.createElement('style');
        style.id = 'user-location-styles';
        style.textContent = `
            .user-location-marker {
                background: transparent;
            }
            .user-location-dot {
                width: 16px;
                height: 16px;
                background: #4299e1;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(66, 153, 225, 0.4);
                animation: pulse-user 2s ease-in-out infinite;
            }
            @keyframes pulse-user {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }

    async loadRoutesOnMap() {
        try {
            const response = await fetch('/api/metro/routes');
            const routes = await response.json();
            
            // Load bus locations for all routes
            for (const route of routes) {
                await this.loadBusesForRoute(route);
            }
            
            this.updateRecommendations(routes);
            this.updateRoutesDisplay(routes);
            
        } catch (error) {
            console.error('Failed to load routes:', error);
            this.showToast('Failed to load route data', 'error');
        }
    }

    async loadBusesForRoute(route) {
        try {
            const response = await fetch(`/api/metro/routes/${route._id}/buses`);
            const buses = await response.json();
            
            buses.forEach(bus => {
                this.addBusMarker(bus, route);
            });
        } catch (error) {
            console.error(`Failed to load buses for route ${route.number}:`, error);
        }
    }

    addBusMarker(bus, route) {
        const busIcon = L.divIcon({
            className: 'bus-marker',
            html: `
                <div class="bus-marker-container">
                    <div class="bus-icon">🚌</div>
                    <div class="bus-route-number">${route.number}</div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([bus.latitude, bus.longitude], {
            icon: busIcon,
            zIndexOffset: 500
        }).addTo(this.map);

        // Add popup with bus info
        const popupContent = `
            <div class="bus-popup">
                <h3>Route ${route.number}</h3>
                <p><strong>${route.name}</strong></p>
                <p>Last updated: ${new Date(bus.timestamp).toLocaleTimeString()}</p>
                <button onclick="app.trackBus('${bus._id}', '${route.number}')" class="btn btn-primary btn-sm">
                    Track This Bus
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        this.busMarkers.push({ marker, bus, route });

        // Add bus marker styles
        this.addBusMarkerStyles();
    }

    addBusMarkerStyles() {
        if (document.getElementById('bus-marker-styles')) return;

        const style = document.createElement('style');
        style.id = 'bus-marker-styles';
        style.textContent = `
            .bus-marker {
                background: transparent;
            }
            .bus-marker-container {
                position: relative;
                width: 40px;
                height: 40px;
            }
            .bus-icon {
                font-size: 24px;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
            .bus-route-number {
                position: absolute;
                bottom: -2px;
                right: -2px;
                background: #ffd700;
                color: #2d3748;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 4px;
                border-radius: 6px;
                min-width: 16px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .bus-popup {
                text-align: center;
            }
            .bus-popup h3 {
                margin: 0 0 8px 0;
                color: #2d3748;
            }
            .bus-popup p {
                margin: 4px 0;
                color: #718096;
                font-size: 14px;
            }
            .btn-sm {
                padding: 6px 12px;
                font-size: 12px;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    async updateRecommendations(routes) {
        if (!this.userLocation) return;

        const recommendationsGrid = document.getElementById('recommendationsGrid');
        const recommendations = await this.getSmartRecommendations(routes);
        
        recommendationsGrid.innerHTML = recommendations.map(rec => this.createRouteCard(rec, true)).join('');
    }

    async getSmartRecommendations(routes) {
        const recommendations = [];
        
        for (const route of routes) {
            try {
                // Get ETAs for this route
                const etaResponse = await fetch(`/api/metro/routes/${route._id}/etas?lat=${this.userLocation.lat}&lng=${this.userLocation.lng}`);
                const etaData = await etaResponse.json();
                
                if (etaData.etas && etaData.etas.length > 0) {
                    const closestETA = etaData.etas.sort((a, b) => a.realTimeETA - b.realTimeETA)[0];
                    const distance = this.calculateDistance(
                        this.userLocation.lat, this.userLocation.lng,
                        closestETA.stop.coordinates[1], closestETA.stop.coordinates[0]
                    );
                    
                    // Smart filtering: relevant buses (< 30 min ETA, < 2 miles away)
                    if (closestETA.realTimeETA <= 30 && distance <= 2) {
                        recommendations.push({
                            ...route,
                            eta: closestETA,
                            distance: distance,
                            score: this.calculateRecommendationScore(closestETA.realTimeETA, distance)
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to get recommendations for route ${route.number}:`, error);
            }
        }
        
        // Sort by score (best recommendations first)
        return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    calculateRecommendationScore(eta, distance) {
        // Higher score for shorter ETA and closer distance
        const etaScore = Math.max(0, 30 - eta); // 0-30 points
        const distanceScore = Math.max(0, (2 - distance) * 10); // 0-20 points
        return etaScore + distanceScore;
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

    updateRoutesDisplay(routes) {
        const routesGrid = document.getElementById('routesGrid');
        routesGrid.innerHTML = routes.map(route => this.createRouteCard(route, false)).join('');
    }

    createRouteCard(route, isRecommended = false) {
        const etaDisplay = route.eta ? `
            <div class="eta-info">
                <div class="eta-item primary">
                    <span class="eta-value">${route.eta.realTimeETA}</span>
                    <span class="eta-label">min (real-time)</span>
                </div>
                <div class="eta-item">
                    <span class="eta-value">${route.eta.scheduledETA}</span>
                    <span class="eta-label">min (scheduled)</span>
                </div>
            </div>
            <div class="distance-info">
                <i class="fas fa-walking"></i>
                <span>${route.distance ? route.distance.toFixed(1) : '?'} miles to stop</span>
            </div>
        ` : '';

        const isFavorite = this.favorites.includes(route._id);
        
        return `
            <div class="route-card ${isRecommended ? 'recommended' : ''}" onclick="app.showRouteDetails('${route._id}')">
                <div class="route-header">
                    <div class="route-number">${route.number}</div>
                    <div class="route-status">
                        <span class="status-dot"></span>
                        <span>Active</span>
                    </div>
                </div>
                <div class="route-info">
                    <h3>${route.name}</h3>
                    <p>${route.description || 'Santa Cruz METRO Route'}</p>
                    ${etaDisplay}
                    <div class="route-actions">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleFavorite('${route._id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    bindEventListeners() {
        // Quick action buttons
        document.getElementById('nearestBusBtn').addEventListener('click', () => {
            this.findNearestBus();
        });
        
        document.getElementById('favoritesBtn').addEventListener('click', () => {
            this.showFavorites();
        });
        
        document.getElementById('notificationsBtn').addEventListener('click', () => {
            this.toggleNotifications();
        });

        // Location permission buttons
        document.getElementById('enableLocationBtn')?.addEventListener('click', () => {
            this.requestLocationPermission();
        });
        
        document.getElementById('manualLocationBtn')?.addEventListener('click', () => {
            this.showManualLocationSelection();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        // Change location button
        document.getElementById('changeLocationBtn').addEventListener('click', () => {
            this.showLocationPicker();
        });
    }

    async findNearestBus() {
        if (!this.userLocation) {
            this.showToast('Location required to find nearest bus', 'warning');
            return;
        }

        this.showToast('Finding nearest bus...', 'info');
        
        try {
            const response = await fetch('/api/metro/routes');
            const routes = await response.json();
            
            let nearestBus = null;
            let minDistance = Infinity;
            
            for (const route of routes) {
                const busResponse = await fetch(`/api/metro/routes/${route._id}/buses`);
                const buses = await busResponse.json();
                
                for (const bus of buses) {
                    const distance = this.calculateDistance(
                        this.userLocation.lat, this.userLocation.lng,
                        bus.latitude, bus.longitude
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestBus = { bus, route, distance };
                    }
                }
            }
            
            if (nearestBus) {
                this.map.setView([nearestBus.bus.latitude, nearestBus.bus.longitude], 16);
                this.showToast(`Nearest bus: Route ${nearestBus.route.number} (${nearestBus.distance.toFixed(1)} miles)`, 'success');
                this.trackBus(nearestBus.bus._id, nearestBus.route.number);
            } else {
                this.showToast('No active buses found', 'warning');
            }
        } catch (error) {
            console.error('Failed to find nearest bus:', error);
            this.showToast('Failed to find nearest bus', 'error');
        }
    }

    toggleFavorite(routeId) {
        if (this.favorites.includes(routeId)) {
            this.favorites = this.favorites.filter(id => id !== routeId);
            this.showToast('Removed from favorites', 'info');
        } else {
            this.favorites.push(routeId);
            this.showToast('Added to favorites', 'success');
        }
        
        localStorage.setItem('slugstop_favorites', JSON.stringify(this.favorites));
        this.refreshData(); // Refresh to update heart icons
    }

    showFavorites() {
        if (this.favorites.length === 0) {
            this.showToast('No favorite routes yet', 'info');
            return;
        }
        
        // Filter display to show only favorites
        this.showToast('Showing favorite routes', 'info');
        // Implementation for filtering UI
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
        } else if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                this.showToast('Notifications enabled', 'success');
            }
        }
    }

    async refreshData() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.classList.add('spinning');
        
        try {
            // Clear existing markers
            this.busMarkers.forEach(({ marker }) => this.map.removeLayer(marker));
            this.busMarkers = [];
            
            // Reload data
            await this.loadRoutesOnMap();
            this.showToast('Data refreshed', 'success');
        } catch (error) {
            console.error('Failed to refresh data:', error);
            this.showToast('Failed to refresh data', 'error');
        } finally {
            setTimeout(() => {
                refreshBtn.classList.remove('spinning');
            }, 1000);
        }
    }

    trackBus(busId, routeNumber) {
        this.showToast(`Tracking Route ${routeNumber}`, 'success');
        
        // Send notification if enabled
        if (this.notificationsEnabled && Notification.permission === 'granted') {
            new Notification(`Tracking Route ${routeNumber}`, {
                body: 'You will receive updates about this bus',
                icon: '/static/icon-192.png'
            });
        }
        
        // Set up tracking logic
        this.startBusTracking(busId, routeNumber);
    }

    startBusTracking(busId, routeNumber) {
        // Implementation for real-time bus tracking
        console.log(`Starting tracking for bus ${busId} on route ${routeNumber}`);
    }

    showRouteDetails(routeId) {
        // Show detailed route information in bottom sheet
        this.openBottomSheet(routeId);
    }

    async openBottomSheet(routeId) {
        const bottomSheet = document.getElementById('bottomSheet');
        const content = document.getElementById('bottomSheetContent');
        
        try {
            // Load detailed route information
            const response = await fetch(`/api/metro/routes`);
            const routes = await response.json();
            const route = routes.find(r => r._id === routeId);
            
            if (route) {
                content.innerHTML = `
                    <div class="route-details">
                        <div class="route-details-header">
                            <div class="route-number large">${route.number}</div>
                            <div>
                                <h2>${route.name}</h2>
                                <p>${route.description || 'Santa Cruz METRO Route'}</p>
                            </div>
                        </div>
                        
                        <div class="route-stops">
                            <h3><i class="fas fa-map-marker-alt"></i> Stops</h3>
                            <div class="stops-list">
                                ${route.stops ? route.stops.map(stop => `
                                    <div class="stop-item">
                                        <i class="fas fa-circle"></i>
                                        <span>${stop.name}</span>
                                    </div>
                                `).join('') : '<p>Stop information not available</p>'}
                            </div>
                        </div>
                        
                        <div class="route-actions">
                            <button class="btn btn-primary" onclick="app.trackRoute('${routeId}')">
                                <i class="fas fa-play"></i>
                                Track Route
                            </button>
                            <button class="btn btn-secondary" onclick="app.toggleFavorite('${routeId}')">
                                <i class="fas fa-heart"></i>
                                ${this.favorites.includes(routeId) ? 'Remove Favorite' : 'Add Favorite'}
                            </button>
                        </div>
                    </div>
                `;
                
                bottomSheet.classList.add('active');
            }
        } catch (error) {
            console.error('Failed to load route details:', error);
            this.showToast('Failed to load route details', 'error');
        }
        
        // Close button
        document.getElementById('closeSheetBtn').addEventListener('click', () => {
            bottomSheet.classList.remove('active');
        });
    }

    trackRoute(routeId) {
        // Navigate to tracking page
        window.location.href = `/track?route=${routeId}&lat=${this.userLocation?.lat}&lng=${this.userLocation?.lng}`;
    }

    startDataUpdates() {
        // Update data every 30 seconds
        this.updateInterval = setInterval(() => {
            this.refreshData();
        }, 30000);
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

    // Add touch gestures for mobile
    addTouchGestures() {
        let startY;
        const mainContent = document.getElementById('mainContent');
        
        mainContent.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        mainContent.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            
            // Pull to refresh
            if (diff < -100 && mainContent.scrollTop === 0) {
                this.refreshData();
            }
        }, { passive: true });
    }

    // Cleanup on page unload
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SmartRiderApp();
    
    // Add touch gestures
    app.addTouchGestures();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });
});

// Global functions for button clicks
window.app = app;
