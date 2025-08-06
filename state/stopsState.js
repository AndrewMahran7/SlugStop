// In-memory bus stops: list of objects
const stops = [
  { name: "East Remote", lat: 33.56842576541127, lon: -117.63200957809731 },
  { name: "Science Hill", lat: 36.9991, lon: -122.0586 },
  { name: "Bookstore", lat: 36.9741, lon: -122.0308 },
  { name: "Roundabout", lat: 33.570721, lon: -117.638597 },
  { name: "CV1", lat: 33.56643, lon: -117.631989 },
  { name: "CV2", lat: 33.565071, lon: -117.643576 }
];

module.exports = {
  getStops: () => stops
};
