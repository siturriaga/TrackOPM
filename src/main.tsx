import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';            // <-- imports the default export
import './index.css';               // or './app.css' if you prefer

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
