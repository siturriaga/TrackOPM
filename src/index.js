import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // We point to our new App.jsx file

// Basic global styles can go here
document.body.style.margin = '0';
document.body.style.fontFamily = 'sans-serif';
document.body.style.backgroundColor = '#f4f7fa';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
