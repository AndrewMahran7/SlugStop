from flask import Blueprint, request, jsonify
from . import bus_state
import uuid

driver_routes = Blueprint('driver', __name__)

@driver_routes.route('/driver/start', methods=['POST'])
def start_driver():
    """Start tracking a driver"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        name = data.get('name')
        lat = data.get('lat')
        lon = data.get('lon')
        
        if not all([name, lat is not None, lon is not None]):
            return jsonify({'error': 'Missing required fields: name, lat, lon'}), 400
        
        # Generate a unique driver ID or use provided one
        driver_id = data.get('driver_id', str(uuid.uuid4()))
        
        # Add or update driver location
        bus_state.add_driver(driver_id, name, float(lat), float(lon))
        
        return jsonify({
            'success': True,
            'driver_id': driver_id,
            'message': f'Driver {name} started tracking'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@driver_routes.route('/driver/stop', methods=['POST'])
def stop_driver():
    """Stop tracking a driver"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        driver_id = data.get('driver_id')
        
        if not driver_id:
            return jsonify({'error': 'Missing driver_id'}), 400
        
        success = bus_state.remove_driver(driver_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Driver {driver_id} stopped tracking'
            }), 200
        else:
            return jsonify({'error': 'Driver not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@driver_routes.route('/drivers', methods=['GET'])
def get_all_drivers():
    """Get all currently tracked drivers (for debugging)"""
    try:
        drivers = bus_state.get_all_drivers()
        return jsonify({
            'success': True,
            'drivers': drivers,
            'count': len(drivers)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500