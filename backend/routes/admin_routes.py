from flask import Blueprint, request, jsonify
from backend.utils.data_manager import data_manager
import uuid

admin_bp = Blueprint('admin', __name__)

# ============== STOPS MANAGEMENT ==============

@admin_bp.route('/stops', methods=['GET'])
def get_stops():
    """Get all stops"""
    try:
        stops = data_manager.get_stops()
        
        # Format for frontend
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

@admin_bp.route('/stops', methods=['POST'])
def add_stop():
    """Add a new stop"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        name = data.get('name')
        lat = data.get('lat')
        lon = data.get('lon')
        stop_id = data.get('id') or f"stop_{str(uuid.uuid4())[:8]}"
        
        if not all([name, lat is not None, lon is not None]):
            return jsonify({'error': 'Missing required fields: name, lat, lon'}), 400
        
        # Add stop
        data_manager.add_stop(stop_id, name, float(lat), float(lon))
        
        return jsonify({
            'success': True,
            'stop': {
                'id': stop_id,
                'name': name,
                'lat': lat,
                'lon': lon
            },
            'message': f'Stop "{name}" added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/stops/<stop_id>', methods=['PUT'])
def update_stop(stop_id):
    """Update an existing stop"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        name = data.get('name')
        lat = data.get('lat')
        lon = data.get('lon')
        
        if not all([name, lat is not None, lon is not None]):
            return jsonify({'error': 'Missing required fields: name, lat, lon'}), 400
        
        # Update stop
        data_manager.add_stop(stop_id, name, float(lat), float(lon))
        
        return jsonify({
            'success': True,
            'stop': {
                'id': stop_id,
                'name': name,
                'lat': lat,
                'lon': lon
            },
            'message': f'Stop "{name}" updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/stops/<stop_id>', methods=['DELETE'])
def delete_stop(stop_id):
    """Delete a stop"""
    try:
        # Check if stop exists
        stops = data_manager.get_stops()
        if stop_id not in stops:
            return jsonify({'error': 'Stop not found'}), 404
        
        # Remove stop
        data_manager.remove_stop(stop_id)
        
        return jsonify({
            'success': True,
            'message': f'Stop {stop_id} deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== ROUTES MANAGEMENT ==============

@admin_bp.route('/routes', methods=['GET'])
def get_routes():
    """Get all routes with stop details"""
    try:
        routes = data_manager.get_routes()
        stops = data_manager.get_stops()
        
        # Format routes with stop details
        formatted_routes = []
        for route_id, stop_ids in routes.items():
            route_stops = []
            for stop_id in stop_ids:
                if stop_id in stops:
                    route_stops.append({
                        'id': stop_id,
                        **stops[stop_id]
                    })
            
            formatted_routes.append({
                'id': route_id,
                'stops': route_stops,
                'stop_count': len(route_stops)
            })
        
        return jsonify({
            'success': True,
            'routes': formatted_routes,
            'count': len(formatted_routes)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/routes', methods=['POST'])
def add_route():
    """Add a new route"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        route_id = data.get('id') or f"route_{str(uuid.uuid4())[:8]}"
        stop_ids = data.get('stops', [])
        
        if not stop_ids:
            return jsonify({'error': 'Route must have at least one stop'}), 400
        
        # Validate that all stops exist
        stops = data_manager.get_stops()
        invalid_stops = [stop_id for stop_id in stop_ids if stop_id not in stops]
        
        if invalid_stops:
            return jsonify({
                'error': f'Invalid stop IDs: {invalid_stops}'
            }), 400
        
        # Add route
        data_manager.add_route(route_id, stop_ids)
        
        return jsonify({
            'success': True,
            'route': {
                'id': route_id,
                'stops': stop_ids
            },
            'message': f'Route {route_id} created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/routes/<route_id>', methods=['PUT'])
def update_route(route_id):
    """Update an existing route"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        stop_ids = data.get('stops', [])
        
        if not stop_ids:
            return jsonify({'error': 'Route must have at least one stop'}), 400
        
        # Validate that all stops exist
        stops = data_manager.get_stops()
        invalid_stops = [stop_id for stop_id in stop_ids if stop_id not in stops]
        
        if invalid_stops:
            return jsonify({
                'error': f'Invalid stop IDs: {invalid_stops}'
            }), 400
        
        # Update route
        data_manager.add_route(route_id, stop_ids)
        
        return jsonify({
            'success': True,
            'route': {
                'id': route_id,
                'stops': stop_ids
            },
            'message': f'Route {route_id} updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/routes/<route_id>', methods=['DELETE'])
def delete_route(route_id):
    """Delete a route"""
    try:
        # Check if route exists
        routes = data_manager.get_routes()
        if route_id not in routes:
            return jsonify({'error': 'Route not found'}), 404
        
        # Remove route
        data_manager.remove_route(route_id)
        
        return jsonify({
            'success': True,
            'message': f'Route {route_id} deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== ASSIGNMENTS MANAGEMENT ==============

@admin_bp.route('/assignments', methods=['GET'])
def get_assignments():
    """Get all driver-route assignments"""
    try:
        assignments = data_manager.get_assignments()
        drivers = data_manager.get_drivers()
        routes = data_manager.get_routes()
        
        # Format assignments with driver and route details
        formatted_assignments = []
        for driver_name, route_id in assignments.items():
            driver_data = drivers.get(driver_name, {})
            route_exists = route_id in routes
            
            formatted_assignments.append({
                'driver_name': driver_name,
                'route_id': route_id,
                'driver_active': driver_data.get('active', False),
                'route_exists': route_exists,
                'last_seen': driver_data.get('timestamp')
            })
        
        return jsonify({
            'success': True,
            'assignments': formatted_assignments,
            'count': len(formatted_assignments)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/assignments', methods=['POST'])
def assign_driver_to_route():
    """Assign a driver to a route"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        driver_name = data.get('driver_name')
        route_id = data.get('route_id')
        
        if not all([driver_name, route_id]):
            return jsonify({'error': 'Missing required fields: driver_name, route_id'}), 400
        
        # Validate route exists
        routes = data_manager.get_routes()
        if route_id not in routes:
            return jsonify({'error': 'Route does not exist'}), 400
        
        # Assign driver to route
        data_manager.assign_driver_to_route(driver_name, route_id)
        
        return jsonify({
            'success': True,
            'assignment': {
                'driver_name': driver_name,
                'route_id': route_id
            },
            'message': f'Driver {driver_name} assigned to route {route_id}'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/assignments/<driver_name>', methods=['DELETE'])
def remove_assignment(driver_name):
    """Remove driver assignment"""
    try:
        # Check if assignment exists
        assignments = data_manager.get_assignments()
        if driver_name not in assignments:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Remove assignment
        data_manager.remove_assignment(driver_name)
        
        return jsonify({
            'success': True,
            'message': f'Assignment for driver {driver_name} removed'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== SYSTEM STATUS ==============

@admin_bp.route('/status', methods=['GET'])
def get_system_status():
    """Get overall system status"""
    try:
        drivers = data_manager.get_drivers()
        stops = data_manager.get_stops()
        routes = data_manager.get_routes()
        assignments = data_manager.get_assignments()
        
        active_drivers = {name: driver for name, driver in drivers.items() 
                         if driver.get('active', False)}
        
        return jsonify({
            'success': True,
            'system_status': {
                'active_drivers': len(active_drivers),
                'total_drivers': len(drivers),
                'total_stops': len(stops),
                'total_routes': len(routes),
                'total_assignments': len(assignments)
            },
            'active_drivers': list(active_drivers.keys()),
            'unassigned_drivers': [name for name in active_drivers.keys() 
                                 if name not in assignments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
