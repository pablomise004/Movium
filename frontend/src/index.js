// Punto de entrada de React
import React from 'react';
import ReactDOM from 'react-dom/client';
import './EstilosGlobales.css';
import './indice.css';
import App from './Aplicacion';
import { BrowserRouter } from 'react-router-dom';

const raiz = ReactDOM.createRoot(document.getElementById('root'));
raiz.render(
  <React.StrictMode>
    {/* Envolvemos la App en el router */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);