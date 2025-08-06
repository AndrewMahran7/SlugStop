// Handles driver start/stop and GPS updates
let tracking = false;
let watchId = null;

document.getElementById('driverForm').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('driverName').value;
    const route = document.getElementById('routeSelect').value;
    if (!name) return;
    tracking = true;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = '';
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(pos => {
            fetch('/location', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: name,
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    route: route,
                    timestamp: new Date().toISOString()
                })
            });
        }, err => {}, {enableHighAccuracy:true, maximumAge:0, timeout:10000});
    }
};

document.getElementById('stopBtn').onclick = function() {
    tracking = false;
    document.getElementById('startBtn').style.display = '';
    document.getElementById('stopBtn').style.display = 'none';
    if (watchId) navigator.geolocation.clearWatch(watchId);
};