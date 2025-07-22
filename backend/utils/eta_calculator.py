import math
from typing import Dict, List, Tuple, Optional
from geopy.distance import geodesic

class ETACalculator:
    """Calculate ETA for drivers based on their current position and route"""
    
    def __init__(self, average_speed_mph: float = 20.0):
        self.average_speed_mph = average_speed_mph
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in miles using haversine formula"""
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in miles
        r = 3956
        return c * r
    
    def find_closest_stop_on_route(self, driver_lat: float, driver_lon: float, 
                                 route_stops: List[Dict], current_stop_index: int = 0) -> Tuple[Dict, int]:
        """Find the closest upcoming stop on the route"""
        min_distance = float('inf')
        closest_stop = None
        closest_index = current_stop_index
        
        # Check remaining stops on route
        for i in range(current_stop_index, len(route_stops)):
            stop = route_stops[i]
            distance = self.haversine_distance(
                driver_lat, driver_lon, stop['lat'], stop['lon']
            )
            if distance < min_distance:
                min_distance = distance
                closest_stop = stop
                closest_index = i
        
        return closest_stop or route_stops[current_stop_index], closest_index
    
    def calculate_eta_to_rider(self, driver_lat: float, driver_lon: float, 
                              rider_lat: float, rider_lon: float,
                              route_stops: List[Dict] = None) -> float:
        """Calculate ETA from driver to rider location in minutes"""
        if route_stops:
            # If driver has a route, calculate via next stop
            closest_stop, _ = self.find_closest_stop_on_route(driver_lat, driver_lon, route_stops)
            
            # Distance from driver to next stop
            driver_to_stop = self.haversine_distance(
                driver_lat, driver_lon, closest_stop['lat'], closest_stop['lon']
            )
            
            # Distance from stop to rider
            stop_to_rider = self.haversine_distance(
                closest_stop['lat'], closest_stop['lon'], rider_lat, rider_lon
            )
            
            total_distance = driver_to_stop + stop_to_rider
        else:
            # Direct distance if no route assigned
            total_distance = self.haversine_distance(
                driver_lat, driver_lon, rider_lat, rider_lon
            )
        
        # Convert to time in minutes
        eta_hours = total_distance / self.average_speed_mph
        eta_minutes = eta_hours * 60
        
        return max(1, round(eta_minutes))  # Minimum 1 minute
    
    def calculate_route_progress(self, driver_lat: float, driver_lon: float, 
                               route_stops: List[Dict]) -> Dict:
        """Calculate driver's progress along their route"""
        if not route_stops:
            return {'current_stop_index': 0, 'progress_percent': 0}
        
        closest_stop, closest_index = self.find_closest_stop_on_route(
            driver_lat, driver_lon, route_stops
        )
        
        # Calculate progress percentage
        progress_percent = (closest_index / max(1, len(route_stops) - 1)) * 100
        
        return {
            'current_stop_index': closest_index,
            'progress_percent': min(100, max(0, progress_percent)),
            'next_stop': closest_stop,
            'total_stops': len(route_stops)
        }

# Global instance
eta_calculator = ETACalculator()
