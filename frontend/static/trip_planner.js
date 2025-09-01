// Trip Planner JavaScript
class TripPlanner {
    constructor() {
        this.preferences = new Set();
        this.selectedTimeOption = 'now';
        this.routes = [];
        this.init();
    }

    init() {
        this.setupTimeOptions();
        this.setupPreferences();
        this.setupLocationInputs();
        this.setupFormSubmission();
        this.setupQuickActions();
        this.detectUserLocation();
        this.loadRecentSearches();
    }

    setupTimeOptions() {
        const timeOptions = document.querySelectorAll('.time-option');
        timeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                timeOptions.forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedTimeOption = e.target.dataset.option;
                this.toggleTimeInputs();
            });
        });
    }

    toggleTimeInputs() {
        const timeInputContainer = document.getElementById('timeInputContainer');
        const timeInput = document.getElementById('timeInput');
        const timeLabel = document.getElementById('timeLabel');
        
        if (this.selectedTimeOption === 'now') {
            timeInputContainer.style.display = 'none';
        } else {
            timeInputContainer.style.display = 'block';
            timeInput.type = this.selectedTimeOption === 'depart' ? 'datetime-local' : 'datetime-local';
            timeLabel.textContent = this.selectedTimeOption === 'depart' ? 'Departure Time:' : 'Arrival Time:';
            
            // Set default time to current time + 30 minutes
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            timeInput.value = now.toISOString().slice(0, 16);
        }
    }

    setupPreferences() {
        const preferenceItems = document.querySelectorAll('.preference-item');
        preferenceItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const checkbox = item.querySelector('.preference-checkbox');
                const preference = item.dataset.preference;
                
                if (this.preferences.has(preference)) {
                    this.preferences.delete(preference);
                    checkbox.classList.remove('checked');
                } else {
                    this.preferences.add(preference);
                    checkbox.classList.add('checked');
                }
                
                this.updatePreferenceEffects(preference);
            });
        });
    }

    updatePreferenceEffects(preference) {
        // Visual feedback for preference selection
        if (preference === 'accessible') {
            this.showAccessibilityOptions();
        } else if (preference === 'budget') {
            this.highlightBudgetOptions();
        }
    }

    showAccessibilityOptions() {
        const message = document.createElement('div');
        message.className = 'preference-message';
        message.innerHTML = '♿ Accessibility routes will be prioritized';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            backdrop-filter: blur(10px);
            animation: slideInRight 0.5s ease-out;
            z-index: 1000;
        `;
        
        document.body.appendChild(message);
        setTimeout(() => {
            message.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => message.remove(), 500);
        }, 3000);
    }

    highlightBudgetOptions() {
        const message = document.createElement('div');
        message.className = 'preference-message';
        message.innerHTML = '💰 Budget-friendly routes will be prioritized';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 193, 7, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            backdrop-filter: blur(10px);
            animation: slideInRight 0.5s ease-out;
            z-index: 1000;
        `;
        
        document.body.appendChild(message);
        setTimeout(() => {
            message.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => message.remove(), 500);
        }, 3000);
    }

    setupLocationInputs() {
        const fromInput = document.getElementById('fromLocation');
        const toInput = document.getElementById('toLocation');
        
        // Add autocomplete functionality
        this.setupLocationAutocomplete(fromInput);
        this.setupLocationAutocomplete(toInput);
        
        // Add location swap functionality
        const swapBtn = document.querySelector('.location-swap');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                const temp = fromInput.value;
                fromInput.value = toInput.value;
                toInput.value = temp;
                this.animateSwap();
            });
        }
    }

    setupLocationAutocomplete(input) {
        const suggestions = [
            'UCSC Campus - Main Entrance',
            'UCSC Campus - East Remote Parking',
            'UCSC Campus - Science Hill',
            'UCSC Campus - Crown/Merrill Apartments',
            'Santa Cruz Metro Center',
            'Downtown Santa Cruz - Pacific Avenue',
            'Capitola Mall',
            'Watsonville Transit Center',
            'Santa Cruz Beach Boardwalk',
            'Pacific Avenue & Water Street',
            'Mission Street & Bay Street',
            'Soquel Avenue & 17th Avenue',
            'Westside Santa Cruz',
            'Live Oak - 17th Avenue',
            'Aptos Village',
            'Scotts Valley Town Center'
        ];

        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            this.showLocationSuggestions(input, suggestions.filter(s => 
                s.toLowerCase().includes(value) && value.length > 2
            ));
        });

        input.addEventListener('blur', () => {
            setTimeout(() => this.hideLocationSuggestions(input), 200);
        });
    }

    showLocationSuggestions(input, suggestions) {
        this.hideLocationSuggestions(input);
        
        if (suggestions.length === 0) return;

        const suggestionsList = document.createElement('div');
        suggestionsList.className = 'location-suggestions';
        suggestionsList.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            z-index: 100;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 5px;
        `;

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.style.cssText = `
                padding: 12px 15px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid rgba(0,0,0,0.1);
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(102, 126, 234, 0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            
            item.addEventListener('click', () => {
                input.value = suggestion;
                this.hideLocationSuggestions(input);
            });
            
            suggestionsList.appendChild(item);
        });

        const inputContainer = input.closest('.location-input');
        inputContainer.style.position = 'relative';
        inputContainer.appendChild(suggestionsList);
    }

    hideLocationSuggestions(input) {
        const inputContainer = input.closest('.location-input');
        const existing = inputContainer.querySelector('.location-suggestions');
        if (existing) {
            existing.remove();
        }
    }

    animateSwap() {
        const swapBtn = document.querySelector('.location-swap');
        swapBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            swapBtn.style.transform = 'rotate(0deg)';
        }, 300);
    }

    setupFormSubmission() {
        const form = document.getElementById('tripPlannerForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.planTrip();
        });
    }

    async planTrip() {
        const fromLocation = document.getElementById('fromLocation').value;
        const toLocation = document.getElementById('toLocation').value;
        
        if (!fromLocation || !toLocation) {
            this.showError('Please enter both origin and destination');
            return;
        }

        this.showLoading();
        this.saveRecentSearch(fromLocation, toLocation);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const routes = await this.calculateRoutes(fromLocation, toLocation);
            this.displayResults(routes);
        } catch (error) {
            this.showError('Unable to plan your trip. Please try again.');
        }
    }

    async calculateRoutes(from, to) {
        // Mock route calculation with realistic Santa Cruz METRO data
        const baseRoutes = [
            {
                id: 1,
                duration: '28 min',
                cost: '$2.00',
                steps: [
                    { icon: '🚶', text: 'Walk 4 min', detail: 'to bus stop' },
                    { icon: '🚌', text: 'Route 10', detail: '18 min ride' },
                    { icon: '🚶', text: 'Walk 6 min', detail: 'to destination' }
                ],
                details: 'Fastest route using Route 10 Express. Runs every 15 minutes.',
                walkingTime: 10,
                transfers: 0,
                accessibility: true
            },
            {
                id: 2,
                duration: '35 min',
                cost: '$2.00',
                steps: [
                    { icon: '🚶', text: 'Walk 3 min', detail: 'to bus stop' },
                    { icon: '🚌', text: 'Route 3', detail: '15 min ride' },
                    { icon: '🔄', text: 'Transfer', detail: '2 min wait' },
                    { icon: '🚌', text: 'Route 20', detail: '12 min ride' },
                    { icon: '🚶', text: 'Walk 3 min', detail: 'to destination' }
                ],
                details: 'Budget option with one transfer. More frequent service.',
                walkingTime: 6,
                transfers: 1,
                accessibility: true
            },
            {
                id: 3,
                duration: '42 min',
                cost: '$2.00',
                steps: [
                    { icon: '🚶', text: 'Walk 5 min', detail: 'to bus stop' },
                    { icon: '🚌', text: 'Route 7', detail: '32 min ride' },
                    { icon: '🚶', text: 'Walk 5 min', detail: 'to destination' }
                ],
                details: 'Direct route with scenic views. Less frequent but comfortable.',
                walkingTime: 10,
                transfers: 0,
                accessibility: false
            }
        ];

        // Apply preferences filter
        let routes = [...baseRoutes];
        
        if (this.preferences.has('accessible')) {
            routes = routes.filter(route => route.accessibility);
        }
        
        if (this.preferences.has('budget')) {
            routes.sort((a, b) => parseFloat(a.cost.slice(1)) - parseFloat(b.cost.slice(1)));
        }
        
        if (this.preferences.has('fast')) {
            routes.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
        }
        
        if (this.preferences.has('minimal-walking')) {
            routes.sort((a, b) => a.walkingTime - b.walkingTime);
        }

        return routes;
    }

    showLoading() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';
        resultsSection.classList.add('show');
        
        resultsSection.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Planning your perfect trip...</div>
            </div>
        `;
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayResults(routes) {
        const resultsSection = document.getElementById('resultsSection');
        
        let html = `
            <h2 class="results-title">
                <i class="fas fa-route"></i>
                Found ${routes.length} route${routes.length !== 1 ? 's' : ''}
            </h2>
        `;
        
        routes.forEach((route, index) => {
            html += `
                <div class="route-card" style="animation-delay: ${index * 0.1}s">
                    <div class="route-header">
                        <div class="route-duration">${route.duration}</div>
                        <div class="route-cost">${route.cost}</div>
                    </div>
                    <div class="route-steps">
                        ${route.steps.map(step => `
                            <div class="route-step">
                                <span class="step-icon">${step.icon}</span>
                                <div>
                                    <div style="font-weight: 600;">${step.text}</div>
                                    <div style="font-size: 0.8em; opacity: 0.8;">${step.detail}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="route-details">
                        ${route.details}
                        ${route.transfers > 0 ? `<br><strong>${route.transfers} transfer${route.transfers !== 1 ? 's' : ''}</strong>` : '<br><strong>Direct route</strong>'}
                        ${route.accessibility ? '<br>♿ Wheelchair accessible' : ''}
                    </div>
                    <div class="route-actions" style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="route-btn" onclick="tripPlanner.selectRoute(${route.id})">
                            <i class="fas fa-check"></i> Select Route
                        </button>
                        <button class="route-btn secondary" onclick="tripPlanner.showRouteMap(${route.id})">
                            <i class="fas fa-map"></i> View Map
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultsSection.innerHTML = html;
        
        // Add route button styling
        const style = document.createElement('style');
        style.textContent = `
            .route-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 25px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9em;
            }
            .route-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            .route-btn.secondary {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .route-btn.secondary:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    selectRoute(routeId) {
        // Store selected route and navigate to tracking
        localStorage.setItem('selectedRoute', JSON.stringify({
            routeId,
            timestamp: Date.now(),
            from: document.getElementById('fromLocation').value,
            to: document.getElementById('toLocation').value
        }));
        
        this.showSuccessMessage('Route selected! Redirecting to live tracking...');
        setTimeout(() => {
            window.location.href = '/track';
        }, 1500);
    }

    showRouteMap(routeId) {
        // Open route in map view
        window.open(`/map?route=${routeId}`, '_blank');
    }

    setupQuickActions() {
        const quickButtons = document.querySelectorAll('.quick-btn');
        quickButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        const fromInput = document.getElementById('fromLocation');
        const toInput = document.getElementById('toLocation');
        
        switch (action) {
            case 'campus-downtown':
                fromInput.value = 'UCSC Campus - Main Entrance';
                toInput.value = 'Downtown Santa Cruz - Pacific Avenue';
                break;
            case 'campus-beach':
                fromInput.value = 'UCSC Campus - Main Entrance';
                toInput.value = 'Santa Cruz Beach Boardwalk';
                break;
            case 'home-campus':
                // Use saved home location if available
                const homeLocation = localStorage.getItem('homeLocation') || 'Downtown Santa Cruz';
                fromInput.value = homeLocation;
                toInput.value = 'UCSC Campus - Main Entrance';
                break;
            case 'reverse':
                const temp = fromInput.value;
                fromInput.value = toInput.value;
                toInput.value = temp;
                this.animateSwap();
                break;
        }
        
        // Auto-plan if both locations are filled
        if (fromInput.value && toInput.value) {
            setTimeout(() => this.planTrip(), 500);
        }
    }

    detectUserLocation() {
        if ('geolocation' in navigator) {
            const locationBtn = document.createElement('button');
            locationBtn.className = 'location-detect-btn';
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            locationBtn.title = 'Use current location';
            locationBtn.style.cssText = `
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(102, 126, 234, 0.8);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10;
            `;
            
            locationBtn.addEventListener('mouseenter', () => {
                locationBtn.style.background = 'rgba(102, 126, 234, 1)';
                locationBtn.style.transform = 'translateY(-50%) scale(1.1)';
            });
            
            locationBtn.addEventListener('mouseleave', () => {
                locationBtn.style.background = 'rgba(102, 126, 234, 0.8)';
                locationBtn.style.transform = 'translateY(-50%) scale(1)';
            });
            
            locationBtn.addEventListener('click', () => {
                this.getCurrentLocation();
            });
            
            const fromContainer = document.getElementById('fromLocation').closest('.location-input');
            fromContainer.style.position = 'relative';
            fromContainer.appendChild(locationBtn);
        }
    }

    getCurrentLocation() {
        const locationBtn = document.querySelector('.location-detect-btn');
        const originalContent = locationBtn.innerHTML;
        
        locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        locationBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocode to get readable address
                this.reverseGeocode(latitude, longitude);
                locationBtn.innerHTML = originalContent;
                locationBtn.disabled = false;
            },
            (error) => {
                this.showError('Unable to get your location');
                locationBtn.innerHTML = originalContent;
                locationBtn.disabled = false;
            },
            { timeout: 10000 }
        );
    }

    reverseGeocode(lat, lng) {
        // Mock reverse geocoding - in production, use a real service
        const nearbyLocations = [
            'UCSC Campus - Main Entrance',
            'Downtown Santa Cruz - Pacific Avenue',
            'Santa Cruz Beach Boardwalk',
            'Westside Santa Cruz',
            'Live Oak - 17th Avenue'
        ];
        
        const randomLocation = nearbyLocations[Math.floor(Math.random() * nearbyLocations.length)];
        document.getElementById('fromLocation').value = randomLocation;
        
        this.showSuccessMessage('Location detected!');
    }

    saveRecentSearch(from, to) {
        let recentSearches = JSON.parse(localStorage.getItem('recentTripSearches') || '[]');
        
        const search = {
            from,
            to,
            timestamp: Date.now()
        };
        
        // Remove duplicate
        recentSearches = recentSearches.filter(s => !(s.from === from && s.to === to));
        
        // Add to beginning
        recentSearches.unshift(search);
        
        // Keep only last 10
        recentSearches = recentSearches.slice(0, 10);
        
        localStorage.setItem('recentTripSearches', JSON.stringify(recentSearches));
    }

    loadRecentSearches() {
        const recentSearches = JSON.parse(localStorage.getItem('recentTripSearches') || '[]');
        
        if (recentSearches.length > 0) {
            const recentSection = document.createElement('div');
            recentSection.className = 'recent-searches glass-panel';
            recentSection.innerHTML = `
                <h3 class="panel-title">Recent Searches</h3>
                <div class="recent-list">
                    ${recentSearches.slice(0, 5).map(search => `
                        <div class="recent-item" data-from="${search.from}" data-to="${search.to}">
                            <div class="recent-route">
                                <i class="fas fa-history"></i>
                                <span>${search.from}</span>
                                <i class="fas fa-arrow-right"></i>
                                <span>${search.to}</span>
                            </div>
                            <div class="recent-time">${this.formatTimestamp(search.timestamp)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            const container = document.querySelector('.container');
            container.insertBefore(recentSection, document.getElementById('resultsSection'));
            
            // Add click handlers
            recentSection.querySelectorAll('.recent-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById('fromLocation').value = item.dataset.from;
                    document.getElementById('toLocation').value = item.dataset.to;
                });
            });
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .recent-searches {
                    margin-top: 30px;
                }
                .recent-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .recent-item:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateX(5px);
                }
                .recent-route {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: white;
                    font-weight: 500;
                }
                .recent-time {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.9em;
                }
            `;
            document.head.appendChild(style);
        }
    }

    formatTimestamp(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 25px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        `;
        
        const colors = {
            error: 'rgba(244, 67, 54, 0.9)',
            success: 'rgba(76, 175, 80, 0.9)',
            info: 'rgba(33, 150, 243, 0.9)'
        };
        
        toast.style.background = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }
}

// CSS animations
const animationCSS = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;

// Add animations to document
const styleElement = document.createElement('style');
styleElement.textContent = animationCSS;
document.head.appendChild(styleElement);

// Initialize trip planner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tripPlanner = new TripPlanner();
});

// Export for global access
window.TripPlanner = TripPlanner;
