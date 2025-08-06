let tracking = false, watchId = null, driverName = '';
let map, currentMarker;

// Check if driver is logged in and get driver name
async function checkSession() {
    try {
        const response = await fetch('/api/driver/session');
        if (response.ok) {
            const data = await response.json();
            driverName = data.driver_name;
            document.getElementById('driverName').textContent = driverName;
            initMap();
        } else {
            window.location.href = '/driver-login';
        }
    } catch (error) {
        console.error('Session check failed:', error);
        window.location.href = '/driver-login';
    }
}

// Initialize map
function initMap() {
    map = L.map('map').setView([33.56839760710697, -117.63200957809731], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

// Start tracking button
document.getElementById('startBtn').onclick = function() {
    tracking = true;
    this.style.display = 'none';
    document.getElementById('stopBtn').style.display = '';
    
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            
            // Update map position
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }
            currentMarker = L.marker([lat, lon], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61168.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }).addTo(map).bindPopup(`Driver: ${driverName}`);
            map.setView([lat, lon], 15);
            
            // Send location to server
            fetch('/api/location', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: driverName,
                    lat: lat,
                    lon: lon,
                    timestamp: new Date().toISOString()
                })
            }).catch(error => {
                console.error('Error sending location:', error);
            });
        }, err => {
            console.error('Geolocation error:', err);
            alert('Error getting location: ' + err.message);
        }, {enableHighAccuracy: true, maximumAge: 0, timeout: 10000});
    } else {
        alert('Geolocation is not supported by this browser.');
    }
};

// Stop tracking button
document.getElementById('stopBtn').onclick = function() {
    tracking = false;
    this.style.display = 'none';
    document.getElementById('startBtn').style.display = '';
    
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
};

// Logout button
document.getElementById('logoutBtn').onclick = async function() {
    try {
        // Stop tracking first
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        
        await fetch('/api/driver/logout', { 
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
};

// Check session when page loads
document.addEventListener('DOMContentLoaded', checkSession);