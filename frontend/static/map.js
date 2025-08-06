// --- Add ETA overlay to DOM ---
const etaDiv = document.createElement('div');
etaDiv.id = 'eta';
etaDiv.style.position = 'fixed';
etaDiv.style.top = '16px';
etaDiv.style.left = '16px';
etaDiv.style.background = 'rgba(0, 51, 102, 0.95)';
etaDiv.style.color = '#ffd700';
etaDiv.style.padding = '12px 20px';
etaDiv.style.borderRadius = '12px';
etaDiv.style.fontWeight = 'bold';
etaDiv.style.fontSize = '1.2em';
etaDiv.style.zIndex = 1003;
etaDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
etaDiv.innerText = 'ETA: --';
document.body.appendChild(etaDiv);

// --- Haversine function (miles) ---
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of Earth in miles
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- Leaflet map setup (assumes stopLat, stopLon are global) ---
const map = L.map('map').setView([stopLat, stopLon], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const stopMarker = L.marker([stopLat, stopLon]).addTo(map)
    .bindPopup("Your Stop").openPopup();

let busMarker = null;
let polyline = null;

// --- Fetch bus location and update map ---
async function updateBusAndETA() {
    try {
        const res = await fetch('/location');
        const buses = await res.json();

        // Select the first bus (or use a specific bus if needed)
        const busNames = Object.keys(buses);
        if (busNames.length === 0) {
            etaDiv.innerText = 'No buses active';
            if (busMarker) map.removeLayer(busMarker);
            if (polyline) map.removeLayer(polyline);
            return;
        }
        const bus = buses[busNames[0]]; // Use first bus for demo

        // Draw/update bus marker
        if (!busMarker) {
            busMarker = L.marker([bus.lat, bus.lon], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61168.png',
                    iconSize: [32,32],
                    iconAnchor: [16,16]
                })
            }).addTo(map);
        } else {
            busMarker.setLatLng([bus.lat, bus.lon]);
        }

        // Draw/update polyline
        if (polyline) map.removeLayer(polyline);
        polyline = L.polyline([[bus.lat, bus.lon], [stopLat, stopLon]], {color: 'blue', weight: 5}).addTo(map);

        // Calculate ETA
        const distance = haversineDistance(bus.lat, bus.lon, stopLat, stopLon); // miles
        const eta = Math.round((distance / 20) * 60); // minutes, 20 mph
        etaDiv.innerText = `ETA: ${eta} min`;

    } catch (err) {
        etaDiv.innerText = 'Error fetching bus location';
        console.error(err);
    }
}

// --- Poll every 3 seconds ---
setInterval(updateBusAndETA, 3000);
updateBusAndETA();