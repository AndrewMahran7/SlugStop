import React, { useState, useEffect } from 'react';
import { riderAPI } from '../utils/api';
import { getCurrentLocation, parseLocationFromURL, generateRiderURL } from '../utils/location';
import SlugStopMap from '../components/SlugStopMap';

const Rider = () => {
  const [riderLocation, setRiderLocation] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Initialize location on component mount
  useEffect(() => {
    initializeLocation();
  }, []);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && riderLocation) {
      const interval = setInterval(() => {
        findNearbyDrivers();
      }, 5000); // Refresh every 5 seconds
      
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, riderLocation]);

  const initializeLocation = async () => {
    // First, try to get location from URL
    const urlLocation = parseLocationFromURL();
    if (urlLocation) {
      setRiderLocation(urlLocation);
      await findNearbyDrivers(urlLocation);
      return;
    }

    // If no URL location, try to get current location
    try {
      setLoading(true);
      const location = await getCurrentLocation();
      setRiderLocation(location);
      await findNearbyDrivers(location);
    } catch (err) {
      setError('Unable to get your location. Please allow location access or enter manually.');
    } finally {
      setLoading(false);
    }
  };

  const findNearbyDrivers = async (location = riderLocation) => {
    if (!location) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await riderAPI.getNearbyDrivers(location.lat, location.lon);
      setNearbyDrivers(response.data.drivers || []);
      
      // If no drivers found, clear selection
      if (response.data.drivers.length === 0) {
        setSelectedDriver(null);
      }
      
    } catch (err) {
      setError('Failed to find nearby drivers. Please try again.');
      console.error('Error finding drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectDriver = async (driver) => {
    setSelectedDriver(driver);
    
    try {
      // Get detailed route information for the selected driver
      const response = await riderAPI.getDriverRoute(driver.driver);
      if (response.data.route) {
        setSelectedDriver({
          ...driver,
          routeDetails: response.data.route
        });
      }
    } catch (err) {
      console.error('Failed to get driver route:', err);
    }
  };

  const manualLocationUpdate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setRiderLocation(newLocation);
          findNearbyDrivers(newLocation);
        },
        (error) => {
          setError('Failed to get your current location.');
        }
      );
    }
  };

  const shareLocation = () => {
    if (riderLocation) {
      const url = generateRiderURL(riderLocation.lat, riderLocation.lon);
      navigator.clipboard.writeText(url).then(() => {
        alert('Location URL copied to clipboard!');
      });
    }
  };

  const formatETA = (minutes) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-ucsc-blue mb-4">
          🧍 Find Your Bus
        </h1>
        <p className="text-lg text-gray-600">
          See nearby buses and their real-time ETAs
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar - Driver List & Controls */}
        <div className="lg:col-span-1">
          {/* Location Controls */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Location</h2>
            
            {riderLocation ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Coordinates:</div>
                  <div className="font-mono text-gray-600">
                    {riderLocation.lat.toFixed(4)}, {riderLocation.lon.toFixed(4)}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={manualLocationUpdate}
                    className="btn-secondary text-sm flex-1"
                  >
                    📍 Update
                  </button>
                  <button
                    onClick={shareLocation}
                    className="btn-secondary text-sm flex-1"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={initializeLocation}
                  className="btn-primary"
                  disabled={loading}
                >
                  📍 Get My Location
                </button>
              </div>
            )}

            {/* Auto-refresh toggle */}
            <div className="mt-4 flex items-center justify-between">
              <label className="text-sm font-medium">Auto-refresh</label>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-12 h-6 rounded-full p-1 ${autoRefresh ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Nearby Drivers */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nearby Buses</h2>
              <button
                onClick={() => findNearbyDrivers()}
                className="btn-secondary text-sm"
                disabled={loading || !riderLocation}
              >
                {loading ? '🔄' : '🔄'} Refresh
              </button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="spinner mx-auto"></div>
                <p className="text-gray-600 mt-2">Finding buses...</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {!loading && nearbyDrivers.length === 0 && riderLocation && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🚌</div>
                <p>No buses currently active</p>
                <p className="text-sm">Check back in a few minutes</p>
              </div>
            )}

            {nearbyDrivers.length > 0 && (
              <div className="space-y-3">
                {nearbyDrivers.map((driver, index) => (
                  <div
                    key={driver.driver}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDriver?.driver === driver.driver
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectDriver(driver)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{driver.driver}</h3>
                        {driver.route_id && (
                          <p className="text-sm text-gray-600">Route: {driver.route_id}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {formatETA(driver.eta_minutes)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {driver.distance_miles?.toFixed(1)} mi
                        </div>
                      </div>
                    </div>
                    
                    {driver.route_progress && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${driver.route_progress.progress_percent}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Stop {driver.route_progress.current_stop_index + 1} of {driver.route_progress.total_stops}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Live Map</h2>
            <SlugStopMap
              center={riderLocation ? [riderLocation.lat, riderLocation.lon] : undefined}
              drivers={nearbyDrivers}
              rider={riderLocation}
              selectedDriver={selectedDriver}
              onMarkerClick={selectDriver}
              routes={selectedDriver?.routeDetails ? [selectedDriver.routeDetails] : []}
              height="600px"
            />
            
            {selectedDriver && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">
                  🚌 {selectedDriver.driver}
                </h3>
                <p className="text-blue-600">
                  ETA: {formatETA(selectedDriver.eta_minutes)} • Distance: {selectedDriver.distance_miles?.toFixed(1)} miles
                </p>
                {selectedDriver.route_id && (
                  <p className="text-sm text-blue-600">
                    Following route: {selectedDriver.route_id}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rider;
