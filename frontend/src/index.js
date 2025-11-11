// ---- frontend/src/index.js (VERSIÓN NUEVA - ¡ESTÁ PERFECTO!) ----
import React from 'react';
import ReactDOM from 'react-dom/client';
import './Global.css';
import './index.css';
import App from './App'; // <-- 1. Apuntará al nuevo App.js
import { BrowserRouter } from 'react-router-dom'; // <-- 2. Importamos el Router

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 3. Envolvemos la App en el BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);