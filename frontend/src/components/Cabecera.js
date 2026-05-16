// Header con logo y tema
import React, { useState, useEffect } from 'react';
import './Cabecera.css';
import moviumLogo from '../assets/movium-logo.png';

function Header({ onToggleSidebar }) {
  // Leer tema de localStorage al inicio
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem('movium_theme');
    return guardado === 'light' ? 'light' : 'dark';
  });

  // Cambiar tema y guardarlo
  const cambiarTema = () => {
    setTema((temaActual) => {
      const temaNuevo = temaActual === 'dark' ? 'light' : 'dark';
      localStorage.setItem('movium_theme', temaNuevo);
      return temaNuevo;
    });
  };

  // Aplicar la clase al body
  useEffect(() => {
    document.body.className = tema;
  }, [tema]);

  return (
    <header className="app-header">
      <div className="header-left">
        <button onClick={onToggleSidebar} className="sidebar-toggle-btn">
          ☰
        </button>
        <img src={moviumLogo} alt="Movium Logo" className="header-logo" />
      </div>

      <div className="header-actions">
        <button onClick={cambiarTema} className="theme-toggle" aria-label={`Cambiar a tema ${tema === 'dark' ? 'claro' : 'oscuro'}`}>
          <span className={`theme-icon sun ${tema === 'light' ? 'active' : ''}`}>☀️</span>
          <span className={`theme-icon moon ${tema === 'dark' ? 'active' : ''}`}>🌙</span>
        </button>
      </div>
    </header>
  );
}

export default Header;