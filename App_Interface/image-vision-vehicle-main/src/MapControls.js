import React, { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

const MapControls = ({
  handlePlaceSelected,
  handleCalculateRoute,
  handleStartNavigation,
  directionsResponse,
  isNavigating,
  autocompleteRef
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceSelected}>
        <input type="text" placeholder="Enter destination" style={{ width: '300px', height: '40px', padding: '10px', marginBottom: '10px' }} />
      </Autocomplete>
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
        <button onClick={handleCalculateRoute} style={{ height: '40px', width: '100%' }}>
          Calculate Route
        </button>
        {!isNavigating && (
          <button onClick={handleStartNavigation} style={{ height: '40px', width: '100%' }} disabled={!directionsResponse}>
            Start Navigation
          </button>
        )}
      </div>
    </div>
  );
};

export default MapControls;
