import React, { createContext, useState, useEffect } from 'react';

// Create context
export const LocationContext = createContext();

// Create context provider
export const LocationProvider = ({ children }) => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    // Fetch initial position
    const fetchInitialPosition = () => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
        },
        error => {
          console.error('Error fetching initial position:', error);
          // Handle errors if needed
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    };

    fetchInitialPosition();
  }, []);

  const updateLocation = (lat, long) => {
    setLatitude(lat);
    setLongitude(long);
  };

  return (
    <LocationContext.Provider value={{ latitude, longitude, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
