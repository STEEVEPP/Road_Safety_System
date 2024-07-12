import React, { useState, useEffect } from 'react';
import Speedometer, {
  Background,
  Arc,
  Needle,
  Progress,
  Marks,
  Indicator,
} from 'react-speedometer';
import cycle from './cycle.png'; // Adjust the path based on your file structure
import Lottie from 'react-lottie';
import tic from './check.json'; // Adjust the path to your JSON file
import cross from './Cross.json';
import axios from 'axios';


const SpeedCalculator = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [issafe, setIssafe] = useState(true); // State to determine safety
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/danger');
        setIssafe(response.data.data);
      } catch (error) {
        console.error('Error fetching data: ',error);
      }
    };
    
    fetchData();
    const intervalId = setInterval(fetchData, 1000);
    
    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    const fetchLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            setCurrentPosition({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
            setSpeed(position.coords.speed || 0);
            // Example condition to determine safety (change according to your logic)
          },
          (error) => {
            console.error(error);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    };

    fetchLocation();
  }, []);

  const ticOptions = {
    loop: false,
    autoplay: true,
    animationData: tic,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  const crossOptions = {
    loop: false,
    autoplay: true,
    animationData: cross,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'black',
        height: '98vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'top',
        alignItems: 'center',
        color: '#fff',
        marginTop: '50px'
      }}
    >
      <Speedometer
        value={speed.toFixed(2)}
        fontFamily="squada-one"
      >
        <Background />
        <Arc />
        <Needle />
        <Progress />
        <Marks />
        <Indicator />
      </Speedometer>

      <img src={cycle} alt="Cycle" style={{ marginTop: '90px', width: '400px' }} />

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', border: '5px solid green', borderColor: issafe ? '#0EAD32' : '#FF1100', borderRadius: '15px' }}>
        <div style={{ padding: '5px', borderRadius: '10px' }}>
          <Lottie options={issafe ? ticOptions : crossOptions} height={150} width={150} />
        </div>
        <div style={{ marginLeft: '20px', paddingRight: '30px' }}>
          <h2 style={{ margin: 0, color: issafe ? '#0EAD32' : '#FF1100' }}>{issafe ? 'Looks Safe' : 'Not Safe'}</h2>
          <p style={{ margin: 0 }}>{issafe ? "You're Good to go" : "You're Not Good to go"}</p>
        </div>
      </div>
    </div>
  );
};

export default SpeedCalculator;
