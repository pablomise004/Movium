// ---- frontend/src/AppLayout.js ----
import React, { useState } from 'react'; // 1. Importa useState
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './AppLayout.css';

function AppLayout() {
  // 2. MODIFICADO:
  // Comprobamos el ancho de la ventana UNA VEZ al cargar.
  // Si es < 768px (móvil/tablet), empieza cerrado (false).
  // Si es > 768px (desktop), empieza abierto (true).
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 767);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      
      {/* 3. NUEVO: Overlay para móvil 
          Solo aparece si el sidebar está abierto.
          Al hacer clic en él, llama a toggleSidebar() para cerrarse. */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <Header onToggleSidebar={toggleSidebar} />
      
      <Sidebar />

      <main className="app-content">
        <Outlet /> 
      </main>
    </div>
  );
}

export default AppLayout;