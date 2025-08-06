// Get URL parameters
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Haversine distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

let map, stopMarker, busMarker, polyline;
let driverName, stopLat, stopLon;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Get parameters from URL
    driverName = getUrlParam('driver');
    stopLat = parseFloat(getUrlParam('stop_lat'));
    stopLon = parseFloat(getUrlParam('stop_lon'));
    
    if (!driverName || !stopLat || !stopLon) {
        alert('Missing tracking information. Redirecting to home.');
        window.location.href = '/';
        return;
    }
    
    // Set driver name
    document.getElementById('driverName').textContent = driverName;
    
    // Initialize map
    initMap();
    
    // Start tracking
    updateBusAndETA();
    setInterval(updateBusAndETA, 5000); // Update every 5 seconds
});

// Initialize map
function initMap() {
    map = L.map('map').setView([stopLat, stopLon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Add stop marker
    stopMarker = L.marker([stopLat, stopLon], {
        icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        })
    }).addTo(map).bindPopup("Your Stop");
}

// Update bus location and ETA
async function updateBusAndETA() {
    try {
        const response = await fetch('/api/location');
        const buses = await response.json();
        const bus = buses[driverName];
        
        if (!bus) {
            document.getElementById('eta').innerText = 'Bus not active';
            if (busMarker) {
                map.removeLayer(busMarker);
                busMarker = null;
            }
            if (polyline) {
                map.removeLayer(polyline);
                polyline = null;
            }
            return;
        }
        
        // Update or create bus marker
        if (!busMarker) {
            busMarker = L.marker([bus.lat, bus.lon], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61168.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }).addTo(map).bindPopup(`Driver: ${driverName}`);
        } else {
            busMarker.setLatLng([bus.lat, bus.lon]);
        }
        
        // Update or create route line
        if (polyline) {
            map.removeLayer(polyline);
        }
        polyline = L.polyline([
            [bus.lat, bus.lon], 
            [stopLat, stopLon]
        ], {
            color: 'blue', 
            weight: 3,
            opacity: 0.7
        }).addTo(map);
        
        // Calculate and display ETA
        const distance = haversineDistance(bus.lat, bus.lon, stopLat, stopLon);
        const eta = Math.max(1, Math.round((distance / 20) * 60)); // Minimum 1 minute
        document.getElementById('eta').innerText = `ETA: ${eta} min`;
        
        // Adjust map view to show both markers
        const group = new L.featureGroup([stopMarker, busMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
        
    } catch (error) {
        console.error('Error fetching bus location:', error);
        document.getElementById('eta').innerText = 'Error loading bus data';
    }
}