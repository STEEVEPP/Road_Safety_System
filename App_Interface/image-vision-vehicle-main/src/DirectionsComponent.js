// src/components/MapComponent.js
import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";

const libraries = ["places"];
const mapContainerStyle = {
  height: "100vh",
  width: "100%"
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
  const autocompleteRef = useRef(null);
  const directionsServiceRef = useRef(null);

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
  }, []);

  const handlePlaceSelected = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      setDestination(place.formatted_address);
    }
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

  const handleOpenInGoogleMaps = () => {
    const origin = `${currentLocation.lat},${currentLocation.lng}`;
    const destinationUrl = encodeURIComponent(destination);
    const travelModeUrl = travelMode.toLowerCase();
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destinationUrl}&travelmode=${travelModeUrl}`;
    window.open(url, "_blank");
  };

  const handleTravelModeChange = (event) => {
    setTravelMode(event.target.value);
  };

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={currentLocation} zoom={15}>
        {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
      </GoogleMap>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, backgroundColor: "white", padding: "10px", borderRadius: "5px" }}>
        <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceSelected}>
          <input type="text" placeholder="Enter destination" style={{ width: "300px", height: "40px", padding: "10px" }} />
        </Autocomplete>
        <button onClick={handleCalculateRoute} style={{ marginLeft: "10px", height: "40px" }}>
          Calculate Route
        </button>
        <button onClick={handleOpenInGoogleMaps} style={{ marginLeft: "10px", height: "40px" }} disabled={!directionsResponse}>
          Open in Google Maps
        </button>
        {/* <select onChange={handleTravelModeChange} value={travelMode} style={{ marginLeft: "10px", height: "40px" }}>
          <option value="DRIVING">Driving</option>
          <option value="WALKING">Walking</option>
          <option value="BICYCLING">Bicycling</option>
          <option value="TRANSIT">Transit</option>
        </select> */}
      </div>
    </LoadScript>
  );
};

export default MapComponent;
