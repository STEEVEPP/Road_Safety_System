// // src/components/MapComponent.js
import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";

const libraries = ["places"];
const mapContainerStyle = {
  height: "50vh",
  width: "100%",
  
};

const center = {
  lat: -3.745,
  lng: -38.523
};

const MapComponent = ({ googleMapsApiKey }) => {
  const [currentLocation, setCurrentLocation] = useState(center);
  const [destination, setDestination] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [travelMode, setTravelMode] = useState("DRIVING");
  const [stepIndex, setStepIndex] = useState(-1); // -1 means not started, 0 means started
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(null);
  const autocompleteRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const TURN_THRESHOLD = 20; // in meters, adjust as needed

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        console.error("Error fetching location");
      }
    );

    // Check if speech synthesis is supported by the browser
    setSpeechSynthesisSupported("speechSynthesis" in window);
  }, []);

  const handlePlaceSelected = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      setDestination(place.formatted_address);
    }
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    setStepIndex(0); // Start from the first step
    speakDirections(directionsResponse.routes[0].legs[0].steps[0].instructions); // Speak the first instruction
  };

  const handleCalculateRoute = () => {
    if (destination === "") {
      return;
    }
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsServiceRef.current.route(
      {
        origin: currentLocation,
        destination: destination,
        travelMode: travelMode
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  };

  const handleTravelModeChange = (event) => {
    setTravelMode(event.target.value);
  };

  const handleNextStep = () => {
    if (directionsResponse && stepIndex < directionsResponse.routes[0].legs[0].steps.length - 1) {
      const nextStepIndex = stepIndex + 1;
      setStepIndex(nextStepIndex);
      setDistanceToNextTurn(directionsResponse.routes[0].legs[0].steps[nextStepIndex].distance.value);
      speakDirections(directionsResponse.routes[0].legs[0].steps[nextStepIndex].instructions); // Speak the next instruction
    }
  };

  const handlePreviousStep = () => {
    if (stepIndex > 0) {
      const prevStepIndex = stepIndex - 1;
      setStepIndex(prevStepIndex);
      speakDirections(directionsResponse.routes[0].legs[0].steps[prevStepIndex].instructions); // Speak the previous instruction
    }
  };

  const speakDirections = (text) => {
    if (speechSynthesisSupported) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current = window.speechSynthesis;
      speechSynthesisRef.current.cancel(); // Cancel any current speech
      speechSynthesisRef.current.speak(utterance);

      // Check distance to next turn and speak when within threshold
      if (distanceToNextTurn && distanceToNextTurn <= TURN_THRESHOLD) {
        utterance.onend = () => {
          const nextTurnInstruction = directionsResponse.routes[0].legs[0].steps[stepIndex + 1].instructions;
          const nextTurnUtterance = new SpeechSynthesisUtterance(`In ${nextTurnInstruction}`);
          speechSynthesisRef.current.speak(nextTurnUtterance);
        };
      }
    }
  };

  const simulateMovement = () => {
    // Simulate movement by incrementing step index every few seconds
    if (isNavigating && stepIndex < directionsResponse.routes[0].legs[0].steps.length - 1) {
      const remainingDistance = directionsResponse.routes[0].legs[0].steps[stepIndex].distance.value;
      setTimeout(() => {
        if (remainingDistance <= TURN_THRESHOLD) {
          handleNextStep();
        }
      }, 5000); // Simulate every 5 seconds, adjust as needed
    } else {
      setIsNavigating(false);
      setStepIndex(-1); // Reset step index after navigation ends
    }
  };

  useEffect(() => {
    simulateMovement();
  }, [isNavigating, stepIndex]);

  return (
    <>
      <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}>
        <div style={{ position: 'relative', height: '97vh', width: '100%' }}>
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'left', backgroundColor:'transparent' }}>
            <div style={{ marginBottom: '10px' }}>
              <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceSelected}>
                <input 
                  type="text" 
                  placeholder="Enter destination" 
                  style={{
                    width: "300px",
                    padding: "10px",
                    borderRadius: "20px",
                    border: "none",
                    // background: "linear-gradient(to right, #4facfe, #00f2fe)"
                  }} 
                />
              </Autocomplete>
            </div>
            <div>
              <button 
                onClick={handleCalculateRoute} 
                style={{
                  margin: "10px",
                  color: "white",
                   backgroundColor: "white",
                   color:'black',
                  border: "none",
                  padding: "10px",
                  borderRadius: "50px",
                  width: "120px",
                  textAlign: "center",
                  cursor: "pointer"
                }}
              >
                Calculate Route
              </button>
              {!isNavigating && (
                <button 
                  onClick={handleStartNavigation} 
                  style={{
                    margin: "10px",
                    color: "white",
                    backgroundColor: "white",
                    color:'black',
                    border: "none",
                    padding: "10px",
                    borderRadius: "50px",
                    width: "120px",
                    textAlign: "center",
                    cursor: "pointer"
                  }} 
                  disabled={!directionsResponse}
                >
                  Start Navigation
                </button>
              )}
            </div>
          </div>
  
          <GoogleMap 
            mapContainerStyle={{ height: '100%', width: '100%' }} 
            center={currentLocation} 
            zoom={15}
            
          >
            {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
          </GoogleMap>
  
          {isNavigating && directionsResponse && (
            <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, backgroundColor: "white", padding: "10px", borderRadius: "5px", maxWidth: "400px" }}>
              <h3>Directions</h3>
              <p>{directionsResponse.routes[0].legs[0].steps[stepIndex].instructions}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={handlePreviousStep} style={{ height: "40px", minWidth: "100px" }} disabled={stepIndex === 0}>
                  Previous
                </button>
                <button onClick={handleNextStep} style={{ height: "40px", minWidth: "100px" }} disabled={stepIndex === directionsResponse.routes[0].legs[0].steps.length - 1}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </LoadScript>
    </>
  );
  
};

export default MapComponent;