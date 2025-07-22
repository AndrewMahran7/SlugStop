import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Driver API
export const driverAPI = {
  start: (name, lat, lon, routeId = null) =>
    api.post('/driver/start', { name, lat, lon, route_id: routeId }),
  
  stop: (name) =>
    api.post('/driver/stop', { name }),
  
  updateLocation: (name, lat, lon) =>
    api.post('/driver/location', { name, lat, lon }),
  
  getStatus: (driverName) =>
    api.get(`/driver/status/${driverName}`),
  
  getAll: () =>
    api.get('/driver/all'),
};

// Rider API
export const riderAPI = {
  getNearbyDrivers: (lat, lon) =>
    api.get('/rider/nearby', { params: { lat, lon } }),
  
  getDriverRoute: (driverName) =>
    api.get(`/rider/driver/${driverName}/route`),
  
  getStops: () =>
    api.get('/rider/stops'),
};

// Admin API
export const adminAPI = {
  // Stops
  getStops: () =>
    api.get('/admin/stops'),
  
  addStop: (name, lat, lon, id = null) =>
    api.post('/admin/stops', { name, lat, lon, id }),
  
  updateStop: (stopId, name, lat, lon) =>
    api.put(`/admin/stops/${stopId}`, { name, lat, lon }),
  
  deleteStop: (stopId) =>
    api.delete(`/admin/stops/${stopId}`),
  
  // Routes
  getRoutes: () =>
    api.get('/admin/routes'),
  
  addRoute: (stops, id = null) =>
    api.post('/admin/routes', { stops, id }),
  
  updateRoute: (routeId, stops) =>
    api.put(`/admin/routes/${routeId}`, { stops }),
  
  deleteRoute: (routeId) =>
    api.delete(`/admin/routes/${routeId}`),
  
  // Assignments
  getAssignments: () =>
    api.get('/admin/assignments'),
  
  assignDriver: (driverName, routeId) =>
    api.post('/admin/assignments', { driver_name: driverName, route_id: routeId }),
  
  removeAssignment: (driverName) =>
    api.delete(`/admin/assignments/${driverName}`),
  
  // System status
  getSystemStatus: () =>
    api.get('/admin/status'),
};

// General API
export const generalAPI = {
  health: () =>
    api.get('/health'),
};

export default api;
