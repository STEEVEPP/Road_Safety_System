import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { LocationProvider } from './LocationContext';

ReactDOM.render(
  <React.StrictMode>
    <LocationProvider>
      <App />
    </LocationProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
