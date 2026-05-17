import React from 'react';
import './Sidebar.css';
import moviumIcon from '../assets/movium-icono.png';
import { NavLink, useLocation } from 'react-router-dom';

function Sidebar() {
  const ubicacion = useLocation();

  const cerrarSesion = () => {
    localStorage.removeItem('movium_token');
    window.location.reload();
  };

  // para que inicio siga activo en las subrutas
  const esInicioActivo = () => {
    return ubicacion.pathname === '/' ||
           ubicacion.pathname.startsWith('/rutina') ||
           ubicacion.pathname.startsWith('/sesion');
  };

  return (
    <aside className="app-sidebar">

      <div>
        <div className="sidebar-header">
          <img src={moviumIcon} alt="Movium Icon" className="sidebar-icon" />
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            className={() => `nav-link ${esInicioActivo() ? 'active' : ''}`}
          >
            Inicio
          </NavLink>
          <NavLink to="/estadisticas" className="nav-link">
            Récords
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
        <button onClick={cerrarSesion} className="sidebar-logout-btn transparent-btn">
          Cerrar Sesión
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;