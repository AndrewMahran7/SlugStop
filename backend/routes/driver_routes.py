from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.utils.data_manager import data_manager

driver_bp = Blueprint('driver', __name__)

@driver_bp.route('/start', methods=['POST'])
def start_tracking():
    """Start tracking a driver"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        name = data.get('name')
        lat = data.get('lat')
        lon = data.get('lon')
        route_id = data.get('route_id')
        
        if not all([name, lat is not None, lon is not None]):
            return jsonify({'error': 'Missing required fields: name, lat, lon'}), 400
        
        # Update driver in data manager
        data_manager.update_driver(
            name=name,
            lat=float(lat),
            lon=float(lon),
            active=True,
            route_id=route_id
        )
        
        return jsonify({
            'success': True,
            'message': f'Driver {name} started tracking',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@driver_bp.route('/stop', methods=['POST'])
def stop_tracking():
    """Stop tracking a driver"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        name = data.get('name')
        
        if not name:
            return jsonify({'error': 'Missing driver name'}), 400
        
        # Remove driver from tracking
        data_manager.remove_driver(name)
        
        return jsonify({
            'success': True,
            'message': f'Driver {name} stopped tracking',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@driver_bp.route('/location', methods=['POST'])
def update_location():
    """Update driver location (called every 3 seconds from frontend)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        name = data.get('name')
        lat = data.get('lat')
        lon = data.get('lon')
        
        if not all([name, lat is not None, lon is not None]):
            return jsonify({'error': 'Missing required fields: name, lat, lon'}), 400
        
        # Get current driver data to preserve route assignment
        drivers = data_manager.get_drivers()
        current_driver = drivers.get(name, {})
        route_id = current_driver.get('route_id')
        
        # Update driver location
        data_manager.update_driver(
            name=name,
            lat=float(lat),
            lon=float(lon),
            active=True,
            route_id=route_id
        )
        
        return jsonify({
            'success': True,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@driver_bp.route('/status/<driver_name>', methods=['GET'])
def get_driver_status(driver_name):
    """Get specific driver status"""
    try:
        drivers = data_manager.get_drivers()
        driver = drivers.get(driver_name)
        
        if not driver:
            return jsonify({'error': 'Driver not found'}), 404
        
        # Get route information if assigned
        route_info = None
        if driver.get('route_id'):
            routes = data_manager.get_routes()
            stops = data_manager.get_stops()
            
            route_stops = routes.get(driver['route_id'], [])
            route_info = {
                'route_id': driver['route_id'],
                'stops': [stops.get(stop_id) for stop_id in route_stops if stops.get(stop_id)]
            }
        
        return jsonify({
            'success': True,
            'driver': driver,
            'route': route_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@driver_bp.route('/all', methods=['GET'])
def get_all_drivers():
    """Get all active drivers (for debugging)"""
    try:
        drivers = data_manager.get_drivers()
        active_drivers = {name: driver for name, driver in drivers.items() if driver.get('active', False)}
        
        return jsonify({
            'success': True,
            'drivers': active_drivers,
            'count': len(active_drivers)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
