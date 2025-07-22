from flask import Blueprint, request, jsonify
from backend.utils.data_manager import data_manager
from backend.utils.eta_calculator import eta_calculator

rider_bp = Blueprint('rider', __name__)

@rider_bp.route('/nearby', methods=['GET'])
def get_nearby_drivers():
    """Get nearby drivers sorted by ETA"""
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
        drivers = data_manager.get_drivers()
        stops = data_manager.get_stops()
        routes = data_manager.get_routes()
        assignments = data_manager.get_assignments()
        
        active_drivers = {name: driver for name, driver in drivers.items() 
                         if driver.get('active', False)}
        
        if not active_drivers:
            return jsonify({
                'success': True,
                'riders_location': {'lat': rider_lat, 'lon': rider_lon},
                'drivers': [],
                'message': 'No active drivers found'
            }), 200
        
        # Calculate ETA for each driver
        drivers_with_eta = []
        
        for driver_name, driver_data in active_drivers.items():
            # Get driver's route if assigned
            route_id = driver_data.get('route_id') or assignments.get(driver_name)
            route_stops = []
            
            if route_id and route_id in routes:
                stop_ids = routes[route_id]
                route_stops = [stops[stop_id] for stop_id in stop_ids if stop_id in stops]
            
            # Calculate ETA
            eta_minutes = eta_calculator.calculate_eta_to_rider(
                driver_data['lat'], driver_data['lon'],
                rider_lat, rider_lon,
                route_stops if route_stops else None
            )
            
            # Get route progress if available
            route_progress = None
            if route_stops:
                route_progress = eta_calculator.calculate_route_progress(
                    driver_data['lat'], driver_data['lon'], route_stops
                )
            
            drivers_with_eta.append({
                'driver': driver_name,
                'eta_minutes': eta_minutes,
                'lat': driver_data['lat'],
                'lon': driver_data['lon'],
                'route_id': route_id,
                'route_progress': route_progress,
                'timestamp': driver_data.get('timestamp')
            })
        
        # Sort by ETA (closest first)
        drivers_with_eta.sort(key=lambda x: x['eta_minutes'])
        
        return jsonify({
            'success': True,
            'rider_location': {
                'lat': rider_lat,
                'lon': rider_lon
            },
            'drivers': drivers_with_eta,
            'count': len(drivers_with_eta)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rider_bp.route('/driver/<driver_name>/route', methods=['GET'])
def get_driver_route(driver_name):
    """Get full route information for a specific driver"""
    try:
        drivers = data_manager.get_drivers()
        driver = drivers.get(driver_name)
        
        if not driver or not driver.get('active'):
            return jsonify({'error': 'Driver not found or not active'}), 404
        
        # Get route information
        stops = data_manager.get_stops()
        routes = data_manager.get_routes()
        assignments = data_manager.get_assignments()
        
        route_id = driver.get('route_id') or assignments.get(driver_name)
        
        if not route_id or route_id not in routes:
            return jsonify({
                'success': True,
                'driver': {
                    'name': driver_name,
                    'lat': driver['lat'],
                    'lon': driver['lon'],
                    'timestamp': driver.get('timestamp')
                },
                'route': None,
                'message': 'No route assigned to this driver'
            }), 200
        
        # Build route with stop details
        stop_ids = routes[route_id]
        route_stops = []
        
        for stop_id in stop_ids:
            if stop_id in stops:
                route_stops.append({
                    'id': stop_id,
                    **stops[stop_id]
                })
        
        # Calculate route progress
        route_progress = eta_calculator.calculate_route_progress(
            driver['lat'], driver['lon'], route_stops
        )
        
        return jsonify({
            'success': True,
            'driver': {
                'name': driver_name,
                'lat': driver['lat'],
                'lon': driver['lon'],
                'timestamp': driver.get('timestamp')
            },
            'route': {
                'id': route_id,
                'stops': route_stops,
                'progress': route_progress
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rider_bp.route('/stops', methods=['GET'])
def get_all_stops():
    """Get all bus stops for map display"""
    try:
        stops = data_manager.get_stops()
        
        # Format stops for frontend
        formatted_stops = [
            {
                'id': stop_id,
                **stop_data
            }
            for stop_id, stop_data in stops.items()
        ]
        
        return jsonify({
            'success': True,
            'stops': formatted_stops,
            'count': len(formatted_stops)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
