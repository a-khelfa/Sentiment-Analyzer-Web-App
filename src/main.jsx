import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Assurez-vous que le chemin est correct.
import './index.css'; // Si vous avez un fichier CSS pour les styles globaux

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);