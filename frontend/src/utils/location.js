// Location utilities for SlugStop

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown location error occurred.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  });
};

export const watchLocation = (onLocationUpdate, onError) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by this browser.'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      });
    },
    (error) => {
      let errorMessage = 'Unable to watch location.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
        default:
          errorMessage = 'An unknown location error occurred.';
          break;
      }
      
      onError(new Error(errorMessage));
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 3000, // Update every 3 seconds
    }
  );

  return watchId;
};

export const clearLocationWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// UCSC campus bounds for map centering
export const UCSC_BOUNDS = {
  center: [36.9914, -122.0609], // UCSC campus center
  zoom: 14,
  bounds: [
    [36.9700, -122.0800], // Southwest
    [37.0100, -122.0400], // Northeast
  ],
};

// Parse location from URL parameters
export const parseLocationFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lat = urlParams.get('lat');
  const lon = urlParams.get('lon');
  
  if (lat && lon) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (!isNaN(latitude) && !isNaN(longitude)) {
      return { lat: latitude, lon: longitude };
    }
  }
  
  return null;
};

// Generate QR code URL for rider location
export const generateRiderURL = (lat, lon) => {
  const baseURL = window.location.origin;
  return `${baseURL}/rider?lat=${lat}&lon=${lon}`;
};

// Calculate distance between two points (in miles)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3956; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
