from flask import Blueprint, request, jsonify
from geopy.distance import geodesic
from . import bus_state

rider_routes = Blueprint('rider', __name__)

@rider_routes.route('/rider', methods=['GET'])
def find_nearby_drivers():
    """Find nearby drivers sorted by distance"""
    try:
        # Get rider's location from query parameters
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        
        if not lat or not lon:
            return jsonify({'error': 'Missing required parameters: lat, lon'}), 400
        
        try:
            rider_lat = float(lat)
            rider_lon = float(lon)
        except ValueError:
            return jsonify({'error': 'Invalid lat/lon values'}), 400
        
        # Get all active drivers
        drivers = bus_state.get_all_drivers()
        
        if not drivers:
            return jsonify({
                'success': True,
                'drivers': [],
                'message': 'No active drivers found'
            }), 200
        
        # Calculate distances and sort
        drivers_with_distance = []
        rider_location = (rider_lat, rider_lon)
        
        for driver_id, driver_data in drivers.items():
            driver_location = (driver_data['lat'], driver_data['lon'])
            
            # Calculate distance using geopy
            distance = geodesic(rider_location, driver_location)
            
            drivers_with_distance.append({
                'driver_id': driver_id,
                'name': driver_data['name'],
                'lat': driver_data['lat'],
                'lon': driver_data['lon'],
                'distance_miles': round(distance.miles, 2),
                'distance_km': round(distance.kilometers, 2)
            })
        
        # Sort by distance (closest first)
        drivers_with_distance.sort(key=lambda x: x['distance_miles'])
        
        return jsonify({
            'success': True,
            'rider_location': {
                'lat': rider_lat,
                'lon': rider_lon
            },
            'drivers': drivers_with_distance,
            'count': len(drivers_with_distance)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
