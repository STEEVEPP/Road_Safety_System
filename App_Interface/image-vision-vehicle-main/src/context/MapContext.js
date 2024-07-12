import React, { createContext, useState, useRef } from 'react';

const MapContext = createContext();

const MapProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState({ lat: 40.712776, lng: -74.005974 });
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const autocompleteRef = useRef(null);

  const handlePlaceSelected = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      setCurrentLocation({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleCalculateRoute = () => {
    // Add your logic for calculating the route
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
  };

  const handlePreviousStep = () => {
    setStepIndex((prevIndex) => Math.max(prevIndex, 0));
  };

  const handleNextStep = () => {
    setStepIndex((prevIndex) => Math.min(prevIndex + 1, directionsResponse.routes[0].legs[0].steps.length - 1));
  };

  return (
    <MapContext.Provider
      value={{
        currentLocation,
        directionsResponse,
        isNavigating,
        stepIndex,
        autocompleteRef,
        handlePlaceSelected,
        handleCalculateRoute,
        handleStartNavigation,
        handlePreviousStep,
        handleNextStep,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export { MapContext, MapProvider };
