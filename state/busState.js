// In-memory bus state: {driver_name: {lat, lon, last_update}}
const busData = {};

// Predefined driver codes
const driverCodes = {
  "John": "1234",
  "Jane": "5678", 
  "Sam": "abcd"
};

module.exports = {
  getBusData: () => busData,
  updateBusLocation: (name, lat, lon, timestamp) => {
    busData[name] = {
      lat: lat,
      lon: lon,
      last_update: timestamp
    };
    console.log('Updated bus data:', busData);
  },
  getDriverCodes: () => driverCodes,
  validateDriver: (name, code) => {
    return driverCodes[name] === code;
  }
};
