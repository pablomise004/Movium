// Layout base con header y sidebar
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Cabecera';
import Sidebar from './components/BarraLateral';
import './PlantillaApp.css';

function AppLayout() {
  // Si es movil, el menu empieza cerrado
  const [menuAbierto, setMenuAbierto] = useState(window.innerWidth > 767);

  const toggleSidebar = () => {
    setMenuAbierto(!menuAbierto);
  };

  return (
    <div className={`app-layout ${menuAbierto ? 'sidebar-open' : 'sidebar-closed'}`}>
      
      {/* Overlay para movil */}
      {menuAbierto && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <Header onToggleSidebar={toggleSidebar} />
      
      <Sidebar />

      <main className="app-content">
        <Outlet /> 
      </main>
    </div>
  );
}

export default AppLayout;