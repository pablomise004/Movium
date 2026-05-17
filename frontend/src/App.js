import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './Login';
import AppLayout from './AppLayout';
import PanelPrincipal from './PanelPrincipal';
import RutinaDetalle from './RutinaDetalle';
import SesionEntrenamiento from './SesionEntrenamiento';
import RutinaProgreso from './RutinaProgreso';
import Perfil from './Perfil';
import Estadisticas from './Estadisticas';
import Ayuda from './Ayuda';

// Redirige al login si no hay token guardado
function RutaProtegida({ pagina }) {
  const token = localStorage.getItem('movium_token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return pagina;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={<RutaProtegida pagina={<AppLayout />} />}
      >
        <Route index element={<PanelPrincipal />} />
        <Route path="rutina/:id" element={<RutinaDetalle />} />
        <Route path="sesion/:id" element={<SesionEntrenamiento />} />
        <Route path="progreso/:id" element={<RutinaProgreso />} />
        <Route path="ayuda" element={<Ayuda />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="estadisticas" element={<Estadisticas />} />
      </Route>
    </Routes>
  );
}

export default App;