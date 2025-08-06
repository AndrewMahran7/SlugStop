const fs = require('fs');
const path = require('path');

// In-memory storage
let stops = [];
let routes = [];

// Load data from file on startup
function loadFromFile() {
  try {
    const dataPath = path.join(__dirname, '../data/routes.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      stops = data.stops || [];
      routes = data.routes || [];
    }
  } catch (error) {
    console.error('Error loading routes data:', error);
  }
}

function saveToFile() {
  try {
    const dataPath = path.join(__dirname, '../data');
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    
    const data = { stops, routes };
    fs.writeFileSync(path.join(dataPath, 'routes.json'), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving routes data:', error);
  }
}

// Load data on module initialization
loadFromFile();

module.exports = {
  getStops: () => stops,
  getRoutes: () => routes,
  addStop: (stop) => {
    if (!stops.find(s => s.name === stop.name)) {
      stops.push(stop);
      saveToFile();
      return true;
    }
    return false;
  },
  addRoute: (route) => {
    routes.push(route);
    saveToFile();
    return true;
  },
  saveToFile
};
