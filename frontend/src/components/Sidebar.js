// ---- frontend/src/components/Sidebar.js (CORREGIDO) ----
import React from 'react';
import './Sidebar.css';
import moviumIcon from '../assets/movium-icono.png';
// 1. Importar useLocation además de NavLink
import { NavLink, useLocation } from 'react-router-dom';
// 

function Sidebar() {
  // 2. Obtener el objeto location actual
  const location = useLocation();

  // --- Lógica de Logout (Sin cambios) ---
  const handleLogout = () => {
    localStorage.removeItem('movium_token');
    window.location.reload();
  };

  // --- ¡¡FUNCIÓN CORREGIDA!! ---
  const isInicioActive = () => {
    const { pathname } = location;
    // Añadimos la comprobación para '/rutina/'
    return pathname === '/' || 
           pathname.startsWith('/rutina/') || 
           pathname.startsWith('/sesion/') || 
           pathname.startsWith('/progreso/');
  };
  // --- ¡¡FIN CORRECCIÓN!! ---

  return (
    <aside className="app-sidebar">

      <div>
        <div className="sidebar-header">
          <img src={moviumIcon} alt="Movium Icon" className="sidebar-icon" />
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            className={() =>
               // Ahora llamará a la función corregida
               `nav-link ${isInicioActive() ? 'active' : ''}`
            }
          >
            Inicio
          </NavLink>
          <NavLink to="/estadisticas" className="nav-link">
            Récords
          </NavLink>
          <NavLink to="/comunidad" className="nav-link">
            Comunidad
          </NavLink>
          <NavLink to="/ayuda" className="nav-link">
            Ayuda
          </NavLink>
          <NavLink to="/perfil" className="nav-link">
            Perfil
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-btn transparent-btn">
          Cerrar Sesión
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;