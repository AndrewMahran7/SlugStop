import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { UCSC_BOUNDS } from '../utils/location';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const stopIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [25, 25],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14);
    }
  }, [map, center, zoom]);
  
  return null;
};

const SlugStopMap = ({
  center = UCSC_BOUNDS.center,
  zoom = UCSC_BOUNDS.zoom,
  drivers = [],
  rider = null,
  stops = [],
  routes = [],
  selectedDriver = null,
  onMarkerClick = null,
  height = '400px',
  className = ''
}) => {
  const mapRef = useRef();

  // Generate route polylines
  const routePolylines = routes.map((route, index) => {
    const positions = route.stops
      .filter(stop => stop.lat && stop.lon)
      .map(stop => [stop.lat, stop.lon]);
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    const color = colors[index % colors.length];
    
    return {
      positions,
      color,
      routeId: route.id
    };
  });

  // Generate line from rider to selected driver
  const riderToDriverLine = selectedDriver && rider ? [
    [rider.lat, rider.lon],
    [selectedDriver.lat, selectedDriver.lon]
  ] : null;

  return (
    <div style={{ height }} className={`w-full ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={zoom} />
        
        {/* Bus stops */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lon]}
            icon={stopIcon}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">{stop.name}</h3>
                <p className="text-sm text-gray-600">Bus Stop</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route polylines */}
        {routePolylines.map((route, index) => (
          route.positions.length > 1 && (
            <Polyline
              key={route.routeId || index}
              positions={route.positions}
              color={route.color}
              weight={4}
              opacity={0.7}
            />
          )
        ))}

        {/* Drivers/Buses */}
        {drivers.map((driver) => (
          <Marker
            key={driver.driver || driver.name}
            position={[driver.lat, driver.lon]}
            icon={busIcon}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(driver)
            }}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">{driver.driver || driver.name}</h3>
                {driver.eta_minutes && (
                  <p className="text-sm text-blue-600">ETA: {driver.eta_minutes} min</p>
                )}
                {driver.route_id && (
                  <p className="text-sm text-gray-600">Route: {driver.route_id}</p>
                )}
                <p className="text-xs text-gray-500">
                  {driver.lat.toFixed(4)}, {driver.lon.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Rider */}
        {rider && (
          <Marker
            position={[rider.lat, rider.lon]}
            icon={riderIcon}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">Your Location</h3>
                <p className="text-xs text-gray-500">
                  {rider.lat.toFixed(4)}, {rider.lon.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Line from rider to selected driver */}
        {riderToDriverLine && (
          <Polyline
            positions={riderToDriverLine}
            color="#EF4444"
            weight={3}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default SlugStopMap;
