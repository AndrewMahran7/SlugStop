# Global state to store active drivers
active_drivers = {}

def add_driver(driver_id, name, lat, lon):
    """Add or update a driver's location"""
    active_drivers[driver_id] = {
        'name': name,
        'lat': lat,
        'lon': lon
    }

def remove_driver(driver_id):
    """Remove a driver from tracking"""
    if driver_id in active_drivers:
        del active_drivers[driver_id]
        return True
    return False

def get_all_drivers():
    """Get all active drivers"""
    return active_drivers

def get_driver(driver_id):
    """Get a specific driver"""
    return active_drivers.get(driver_id)