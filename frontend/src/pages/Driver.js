import React, { useState, useEffect, useRef } from 'react';
import { driverAPI, adminAPI } from '../utils/api';
import { getCurrentLocation, watchLocation, clearLocationWatch } from '../utils/location';
import SlugStopMap from '../components/SlugStopMap';

const Driver = () => {
  const [driverName, setDriverName] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationError, setLocationError] = useState('');
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Load routes on component mount
  useEffect(() => {
    loadRoutes();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        clearLocationWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const loadRoutes = async () => {
    try {
      const response = await adminAPI.getRoutes();
      setRoutes(response.data.routes || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    }
  };

  const startTracking = async () => {
    if (!driverName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setLocationError('');

    try {
      // Get initial location
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // Start tracking with backend
      await driverAPI.start(
        driverName.trim(),
        location.lat,
        location.lon,
        selectedRoute || null
      );

      setIsTracking(true);
      setSuccess(`Started tracking for ${driverName}`);

      // Start watching location
      watchIdRef.current = watchLocation(
        (newLocation) => {
          setCurrentLocation(newLocation);
          setLocationError('');
        },
        (error) => {
          setLocationError(error.message);
        }
      );

      // Start sending location updates every 3 seconds
      updateIntervalRef.current = setInterval(async () => {
        if (currentLocation) {
          try {
            await driverAPI.updateLocation(
              driverName.trim(),
              currentLocation.lat,
              currentLocation.lon
            );
          } catch (err) {
            console.error('Failed to update location:', err);
          }
        }
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start tracking');
    }
  };

  const stopTracking = async () => {
    try {
      // Stop backend tracking
      await driverAPI.stop(driverName.trim());

      // Stop location watching
      if (watchIdRef.current) {
        clearLocationWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Stop location updates
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }

      setIsTracking(false);
      setCurrentLocation(null);
      setSuccess(`Stopped tracking for ${driverName}`);
      setLocationError('');

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to stop tracking');
    }
  };

  // Update location in real-time when currentLocation changes
  useEffect(() => {
    if (isTracking && currentLocation) {
      const updateLocation = async () => {
        try {
          await driverAPI.updateLocation(
            driverName.trim(),
            currentLocation.lat,
            currentLocation.lon
          );
        } catch (err) {
          console.error('Failed to update location:', err);
        }
      };
      updateLocation();
    }
  }, [currentLocation, isTracking, driverName]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-ucsc-blue mb-4">
          🚌 Driver Portal
        </h1>
        <p className="text-lg text-gray-600">
          Start tracking your bus location for riders
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Driver Controls</h2>

            {/* Driver Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter your name"
                className="input-field"
                disabled={isTracking}
              />
            </div>

            {/* Route Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Route (Optional)
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="input-field"
                disabled={isTracking}
              >
                <option value="">Select a route...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.id} ({route.stop_count} stops)
                  </option>
                ))}
              </select>
            </div>

            {/* Control Buttons */}
            <div className="space-y-3">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className="w-full btn-primary"
                  disabled={!driverName.trim()}
                >
                  🚀 Start Tracking
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="w-full btn-danger"
                >
                  🛑 Stop Tracking
                </button>
              )}
            </div>

            {/* Status Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tracking:</span>
                  <span className={isTracking ? 'text-green-600' : 'text-red-600'}>
                    {isTracking ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
                {currentLocation && (
                  <>
                    <div className="flex justify-between">
                      <span>Latitude:</span>
                      <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longitude:</span>
                      <span className="font-mono">{currentLocation.lon.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span>{Math.round(currentLocation.accuracy)}m</span>
                    </div>
                  </>
                )}
                {selectedRoute && (
                  <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-semibold">{selectedRoute}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {locationError && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-600 text-sm">
                  <strong>Location Error:</strong> {locationError}
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold mb-3">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Enter your name in the field above</li>
              <li>Select your route (if assigned)</li>
              <li>Click "Start Tracking" to begin</li>
              <li>Keep this page open while driving</li>
              <li>Your location will update every 3 seconds</li>
              <li>Click "Stop Tracking" when your shift ends</li>
            </ol>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Your Location</h2>
            <SlugStopMap
              center={currentLocation ? [currentLocation.lat, currentLocation.lon] : undefined}
              drivers={currentLocation ? [{
                name: driverName || 'You',
                lat: currentLocation.lat,
                lon: currentLocation.lon,
                route_id: selectedRoute
              }] : []}
              height="500px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Driver;
