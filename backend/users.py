
class Driver:
    def __init__(self, id, name, vehicle):
        self.id = id
        self.name = name
        self.vehicle = vehicle
    
    def get_location(self):
        return {"lat": 0.0, "lon": 0.0}

class Rider:
    def __init__(self, id, name):
        self.id = id
        self.name = name

    def get_location(self):
        return {"lat": 0.0, "lon": 0.0}

    def find_nearby_stops(self, stops):
        return [stop for stop in stops if self.is_nearby(stop)]

class Stop:
    def __init__(self, id, location):
        self.id = id
        self.location = location

    def get_location(self):
        return self.location