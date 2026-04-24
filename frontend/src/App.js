// ---- frontend/src/App.js (MODIFICADO) ----
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import AppLayout from './AppLayout';
import Dashboard from './Dashboard';
import RutinaDetalle from './RutinaDetalle';
import WorkoutSession from './WorkoutSession';
import RutinaProgreso from './RutinaProgreso';
import Perfil from './Perfil';
import Estadisticas from './Estadisticas';
import Ayuda from './Ayuda';

// Componente RutaProtegida
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('movium_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* Ruta de Login */}
      <Route path="/login" element={<LoginPage />} /> 

      {/* --- Rutas Protegidas --- */}
      <Route
        path="/"
        element={
          <RutaProtegida>
           <AppLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="rutina/:id" element={<RutinaDetalle />} />
        <Route path="sesion/:id" element={<WorkoutSession />} />
        <Route path="progreso/:id" element={<RutinaProgreso />} />
        <Route path="ayuda" element={<Ayuda />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="estadisticas" element={<Estadisticas />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;