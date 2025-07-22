import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import SlugStopMap from '../components/SlugStopMap';
import { UCSC_BOUNDS } from '../utils/location';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [newStop, setNewStop] = useState({ name: '', lat: '', lon: '' });
  const [newRoute, setNewRoute] = useState({ id: '', stops: [] });
  const [newAssignment, setNewAssignment] = useState({ driver_name: '', route_id: '' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stopsRes, routesRes, assignmentsRes, statusRes] = await Promise.all([
        adminAPI.getStops(),
        adminAPI.getRoutes(),
        adminAPI.getAssignments(),
        adminAPI.getSystemStatus()
      ]);
      
      setStops(stopsRes.data.stops || []);
      setRoutes(routesRes.data.routes || []);
      setAssignments(assignmentsRes.data.assignments || []);
      setSystemStatus(statusRes.data.system_status || {});
    } catch (err) {
      setError('Failed to load admin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addStop = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addStop(newStop.name, parseFloat(newStop.lat), parseFloat(newStop.lon));
      setNewStop({ name: '', lat: '', lon: '' });
      loadAllData();
    } catch (err) {
      setError('Failed to add stop');
    }
  };

  const deleteStop = async (stopId) => {
    if (window.confirm('Are you sure you want to delete this stop?')) {
      try {
        await adminAPI.deleteStop(stopId);
        loadAllData();
      } catch (err) {
        setError('Failed to delete stop');
      }
    }
  };

  const addRoute = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addRoute(newRoute.stops, newRoute.id);
      setNewRoute({ id: '', stops: [] });
      loadAllData();
    } catch (err) {
      setError('Failed to add route');
    }
  };

  const deleteRoute = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await adminAPI.deleteRoute(routeId);
        loadAllData();
      } catch (err) {
        setError('Failed to delete route');
      }
    }
  };

  const addAssignment = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.assignDriver(newAssignment.driver_name, newAssignment.route_id);
      setNewAssignment({ driver_name: '', route_id: '' });
      loadAllData();
    } catch (err) {
      setError('Failed to add assignment');
    }
  };

  const removeAssignment = async (driverName) => {
    if (window.confirm('Are you sure you want to remove this assignment?')) {
      try {
        await adminAPI.removeAssignment(driverName);
        loadAllData();
      } catch (err) {
        setError('Failed to remove assignment');
      }
    }
  };

  const handleMapClick = (e) => {
    if (activeTab === 'stops') {
      setNewStop({
        ...newStop,
        lat: e.latlng.lat.toFixed(6),
        lon: e.latlng.lng.toFixed(6)
      });
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'stops', name: 'Stops', icon: '🚏' },
    { id: 'routes', name: 'Routes', icon: '🛤️' },
    { id: 'assignments', name: 'Assignments', icon: '👥' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-ucsc-blue mb-4">
          ⚙️ Admin Panel
        </h1>
        <p className="text-lg text-gray-600">
          Manage stops, routes, and driver assignments
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-ucsc-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">System Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Active Drivers:</span>
                    <span className="font-semibold text-green-600">
                      {systemStatus.active_drivers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Stops:</span>
                    <span className="font-semibold">{systemStatus.total_stops || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Routes:</span>
                    <span className="font-semibold">{systemStatus.total_routes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignments:</span>
                    <span className="font-semibold">{systemStatus.total_assignments || 0}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('stops')}
                    className="w-full btn-primary text-left"
                  >
                    🚏 Add New Stop
                  </button>
                  <button
                    onClick={() => setActiveTab('routes')}
                    className="w-full btn-secondary text-left"
                  >
                    🛤️ Create Route
                  </button>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className="w-full btn-secondary text-left"
                  >
                    👥 Assign Driver
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stops Tab */}
          {activeTab === 'stops' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Add New Stop</h2>
                <form onSubmit={addStop} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Stop name"
                    value={newStop.name}
                    onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={newStop.lat}
                    onChange={(e) => setNewStop({ ...newStop, lat: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={newStop.lon}
                    onChange={(e) => setNewStop({ ...newStop, lon: e.target.value })}
                    className="input-field"
                    required
                  />
                  <button type="submit" className="w-full btn-primary">
                    Add Stop
                  </button>
                </form>
                <p className="text-sm text-gray-600 mt-2">
                  💡 Click on the map to set coordinates
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-3">Existing Stops</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stops.map((stop) => (
                    <div key={stop.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{stop.name}</div>
                        <div className="text-sm text-gray-600">
                          {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStop(stop.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Routes Tab */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Create Route</h2>
                <form onSubmit={addRoute} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Route ID (e.g., route_1)"
                    value={newRoute.id}
                    onChange={(e) => setNewRoute({ ...newRoute, id: e.target.value })}
                    className="input-field"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Stops:</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
                      {stops.map((stop) => (
                        <label key={stop.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newRoute.stops.includes(stop.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRoute({
                                  ...newRoute,
                                  stops: [...newRoute.stops, stop.id]
                                });
                              } else {
                                setNewRoute({
                                  ...newRoute,
                                  stops: newRoute.stops.filter(id => id !== stop.id)
                                });
                              }
                            }}
                          />
                          <span className="text-sm">{stop.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full btn-primary">
                    Create Route
                  </button>
                </form>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-3">Existing Routes</h3>
                <div className="space-y-2">
                  {routes.map((route) => (
                    <div key={route.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{route.id}</div>
                          <div className="text-sm text-gray-600">
                            {route.stop_count} stops
                          </div>
                        </div>
                        <button
                          onClick={() => deleteRoute(route.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Assign Driver</h2>
                <form onSubmit={addAssignment} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Driver name"
                    value={newAssignment.driver_name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, driver_name: e.target.value })}
                    className="input-field"
                    required
                  />
                  <select
                    value={newAssignment.route_id}
                    onChange={(e) => setNewAssignment({ ...newAssignment, route_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select route...</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.id} ({route.stop_count} stops)
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="w-full btn-primary">
                    Assign Driver
                  </button>
                </form>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-3">Current Assignments</h3>
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div key={assignment.driver_name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{assignment.driver_name}</div>
                        <div className="text-sm text-gray-600">
                          Route: {assignment.route_id}
                          {assignment.driver_active ? (
                            <span className="ml-2 text-green-600">🟢 Active</span>
                          ) : (
                            <span className="ml-2 text-gray-500">🔴 Offline</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeAssignment(assignment.driver_name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Campus Map</h2>
            <SlugStopMap
              center={UCSC_BOUNDS.center}
              zoom={UCSC_BOUNDS.zoom}
              stops={stops}
              routes={routes}
              height="600px"
              onMapClick={handleMapClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
