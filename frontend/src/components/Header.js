import React, { useState, useEffect } from 'react';
import './Header.css';
import moviumLogo from '../assets/movium-logo.png';

function Header({ onToggleSidebar }) {
  const temaGuardado = localStorage.getItem('movium_theme');
  const [tema, setTema] = useState(temaGuardado === 'light' ? 'light' : 'dark');

  const cambiarTema = () => {
    const temaNuevo = tema === 'dark' ? 'light' : 'dark';
    localStorage.setItem('movium_theme', temaNuevo);
    setTema(temaNuevo);
  };

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
        <button onClick={cambiarTema} className="theme-toggle">
          <span className={`theme-icon sun ${tema === 'light' ? 'active' : ''}`}>☀️</span>
          <span className={`theme-icon moon ${tema === 'dark' ? 'active' : ''}`}>🌙</span>
        </button>
      </div>
    </header>
  );
}

export default Header;