let map = L.map('map').setView([33.56839760710697, -117.63200957809731], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let tempMarker = null;
let adminData = { stops: [], routes: [] };

// Load admin data on page load
async function loadAdminData() {
    try {
        const response = await fetch('/api/admin/data');
        adminData = await response.json();
        populateStops();
        populateRoutes();
        displayStopsOnMap();
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// Populate stops list
function populateStops() {
    const savedStopsEl = document.getElementById('savedStops');
    savedStopsEl.innerHTML = '';
    
    const sortableStopsEl = document.getElementById('sortableStops');
    sortableStopsEl.innerHTML = '';
    
    adminData.stops.forEach(stop => {
        // Add to saved stops list
        const li = document.createElement('li');
        li.textContent = `${stop.name} (${stop.lat}, ${stop.lon})`;
        savedStopsEl.appendChild(li);
        
        // Add to sortable stops for routes
        const sortableLi = document.createElement('li');
        sortableLi.className = 'sortable-item';
        sortableLi.setAttribute('data-stop', stop.name);
        sortableLi.innerHTML = `
            <input type="checkbox" name="stops" value="${stop.name}">
            ${stop.name}
            <button type="button" class="up">↑</button>
            <button type="button" class="down">↓</button>
        `;
        sortableStopsEl.appendChild(sortableLi);
    });
    
    // Add event listeners for up/down buttons
    setupSortableButtons();
}

// Populate routes list
function populateRoutes() {
    const savedRoutesEl = document.getElementById('savedRoutes');
    savedRoutesEl.innerHTML = '';
    
    adminData.routes.forEach(route => {
        const li = document.createElement('li');
        li.innerHTML = `
            <b>${route.name}</b> (Driver: ${route.driver})<br>
            Stops: ${route.stops.join(', ')}
        `;
        savedRoutesEl.appendChild(li);
    });
}

// Display stops on map
function displayStopsOnMap() {
    adminData.stops.forEach(stop => {
        L.marker([stop.lat, stop.lon])
            .addTo(map)
            .bindPopup(stop.name);
    });
}

// Setup sortable button event listeners
function setupSortableButtons() {
    document.querySelectorAll('.up').forEach(btn => {
        btn.onclick = function() {
            const li = btn.parentElement;
            if (li.previousElementSibling) {
                li.parentElement.insertBefore(li, li.previousElementSibling);
            }
        };
    });
    
    document.querySelectorAll('.down').forEach(btn => {
        btn.onclick = function() {
            const li = btn.parentElement;
            if (li.nextElementSibling) {
                li.parentElement.insertBefore(li.nextElementSibling, li);
            }
        };
    });
}

// Click map to drop pin and fill lat/lon fields
map.on('click', function(e) {
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng).addTo(map);
    document.getElementById('stopLat').value = e.latlng.lat.toFixed(6);
    document.getElementById('stopLon').value = e.latlng.lng.toFixed(6);
});

// Save stop via AJAX
document.getElementById('stopForm').onsubmit = async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('stopName').value,
        lat: document.getElementById('stopLat').value,
        lon: document.getElementById('stopLon').value
    };
    
    try {
        const response = await fetch('/api/admin/save_stop', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            // Clear form
            document.getElementById('stopForm').reset();
            if (tempMarker) {
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
            // Reload data
            loadAdminData();
        } else {
            alert(data.error || 'Error saving stop');
        }
    } catch (error) {
        console.error('Error saving stop:', error);
        alert('Error saving stop');
    }
};

// Save route via AJAX
document.getElementById('routeForm').onsubmit = async function(e) {
    e.preventDefault();
    
    // Get checked stops in their current order
    const checkedStops = Array.from(document.querySelectorAll('#sortableStops .sortable-item input[type=checkbox]:checked'))
        .map(cb => cb.value);
    
    const formData = {
        route_name: document.getElementById('routeName').value,
        driver: document.getElementById('driverName').value,
        stops: checkedStops
    };
    
    try {
        const response = await fetch('/api/admin/save_route', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            // Clear form
            document.getElementById('routeForm').reset();
            document.querySelectorAll('#sortableStops input[type=checkbox]').forEach(cb => cb.checked = false);
            // Reload data
            loadAdminData();
        } else {
            alert(data.error || 'Error saving route');
        }
    } catch (error) {
        console.error('Error saving route:', error);
        alert('Error saving route');
    }
};

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadAdminData);