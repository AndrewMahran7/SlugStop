import json
import os
import threading
from typing import Dict, Any, Optional

class JSONDataManager:
    """Thread-safe JSON file manager for SlugStop data"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.locks = {
            'drivers': threading.RLock(),
            'stops': threading.RLock(),
            'routes': threading.RLock(),
            'assignments': threading.RLock()
        }
        
        # Ensure data directory exists
        os.makedirs(data_dir, exist_ok=True)
        
        # Initialize files if they don't exist
        self._init_files()
    
    def _init_files(self):
        """Initialize JSON files with default structure if they don't exist"""
        default_data = {
            'drivers.json': {},
            'stops.json': {},
            'routes.json': {},
            'assignments.json': {}
        }
        
        for filename, default_content in default_data.items():
            filepath = os.path.join(self.data_dir, filename)
            if not os.path.exists(filepath):
                self._write_file(filename, default_content)
    
    def _get_filepath(self, filename: str) -> str:
        """Get the full file path"""
        return os.path.join(self.data_dir, filename)
    
    def _read_file(self, filename: str) -> Dict[str, Any]:
        """Read JSON file with error handling"""
        filepath = self._get_filepath(filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error reading {filename}: {e}")
            return {}
    
    def _write_file(self, filename: str, data: Dict[str, Any]):
        """Write JSON file with error handling"""
        filepath = self._get_filepath(filename)
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error writing {filename}: {e}")
            raise
    
    def get_drivers(self) -> Dict[str, Any]:
        """Get all drivers data"""
        with self.locks['drivers']:
            return self._read_file('drivers.json')
    
    def update_driver(self, name: str, lat: float, lon: float, active: bool = True, route_id: Optional[str] = None):
        """Update driver location and status"""
        with self.locks['drivers']:
            drivers = self._read_file('drivers.json')
            drivers[name] = {
                'name': name,
                'lat': lat,
                'lon': lon,
                'timestamp': self._get_timestamp(),
                'active': active,
                'route_id': route_id
            }
            self._write_file('drivers.json', drivers)
    
    def remove_driver(self, name: str):
        """Remove driver from tracking"""
        with self.locks['drivers']:
            drivers = self._read_file('drivers.json')
            if name in drivers:
                del drivers[name]
                self._write_file('drivers.json', drivers)
    
    def get_stops(self) -> Dict[str, Any]:
        """Get all stops data"""
        with self.locks['stops']:
            return self._read_file('stops.json')
    
    def add_stop(self, stop_id: str, name: str, lat: float, lon: float):
        """Add or update a stop"""
        with self.locks['stops']:
            stops = self._read_file('stops.json')
            stops[stop_id] = {
                'name': name,
                'lat': lat,
                'lon': lon
            }
            self._write_file('stops.json', stops)
    
    def remove_stop(self, stop_id: str):
        """Remove a stop"""
        with self.locks['stops']:
            stops = self._read_file('stops.json')
            if stop_id in stops:
                del stops[stop_id]
                self._write_file('stops.json', stops)
    
    def get_routes(self) -> Dict[str, Any]:
        """Get all routes data"""
        with self.locks['routes']:
            return self._read_file('routes.json')
    
    def add_route(self, route_id: str, stop_ids: list):
        """Add or update a route"""
        with self.locks['routes']:
            routes = self._read_file('routes.json')
            routes[route_id] = stop_ids
            self._write_file('routes.json', routes)
    
    def remove_route(self, route_id: str):
        """Remove a route"""
        with self.locks['routes']:
            routes = self._read_file('routes.json')
            if route_id in routes:
                del routes[route_id]
                self._write_file('routes.json', routes)
    
    def get_assignments(self) -> Dict[str, Any]:
        """Get all driver-route assignments"""
        with self.locks['assignments']:
            return self._read_file('assignments.json')
    
    def assign_driver_to_route(self, driver_name: str, route_id: str):
        """Assign a driver to a route"""
        with self.locks['assignments']:
            assignments = self._read_file('assignments.json')
            assignments[driver_name] = route_id
            self._write_file('assignments.json', assignments)
    
    def remove_assignment(self, driver_name: str):
        """Remove driver assignment"""
        with self.locks['assignments']:
            assignments = self._read_file('assignments.json')
            if driver_name in assignments:
                del assignments[driver_name]
                self._write_file('assignments.json', assignments)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.now().isoformat()

# Global instance
data_manager = JSONDataManager()
