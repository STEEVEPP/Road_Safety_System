import React, { useContext } from 'react';
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api';
import { MapContext } from '../context/MapContext';

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
};

const libraries = ['places'];

const MapContainer = ({ googleMapsApiKey }) => {
  const {
    currentLocation,
    directionsResponse,
    isNavigating,
    stepIndex,
    handlePreviousStep,
    handleNextStep,
  } = useContext(MapContext);

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={currentLocation} zoom={15}>
        {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
      </GoogleMap>
      {isNavigating && directionsResponse && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 10,
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            maxWidth: '400px',
          }}
        >
          <h3>Directions</h3>
          <p>{directionsResponse.routes[0].legs[0].steps[stepIndex].instructions}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={handlePreviousStep} style={{ height: '40px', minWidth: '100px' }} disabled={stepIndex === 0}>
              Previous
            </button>
            <button onClick={handleNextStep} style={{ height: '40px', minWidth: '100px' }} disabled={stepIndex === directionsResponse.routes[0].legs[0].steps.length - 1}>
              Next
            </button>
          </div>
        </div>
      )}
    </LoadScript>
  );
};

export default MapContainer;
