// ---- frontend/src/components/Header.js (con localStorage para tema) ----
import React, { useState, useEffect } from 'react';
import './Header.css';
import moviumLogo from '../assets/movium-logo.png';

function Header({ onToggleSidebar }) {
  // 1. Leer tema de localStorage al inicio, o usar 'dark' si no existe
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('movium_theme');
    // Si hay un tema guardado ('light' o 'dark'), úsalo. Si no, usa 'dark'.
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  // 2. Función para cambiar el tema
  const toggleTheme = () => {
    setTheme((currentTheme) => {
      // Determina cuál será el nuevo tema
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      // Guarda el *nuevo* tema en localStorage
      localStorage.setItem('movium_theme', newTheme);
      // Devuelve el nuevo tema para actualizar el estado de React
      return newTheme;
    });
  };

  // 3. Efecto para aplicar la clase al <body> (sin cambios)
  useEffect(() => {
    // Asegura que la clase correcta esté en el body según el estado
    document.body.className = theme;
  }, [theme]); // Se ejecuta cada vez que el estado 'theme' cambia

  return (
    <header className="app-header">
      <div className="header-left">
        <button onClick={onToggleSidebar} className="sidebar-toggle-btn">
          ☰
        </button>
        <img src={moviumLogo} alt="Movium Logo" className="header-logo" />
      </div>

      <div className="header-actions">
        {/* El botón ahora llama a la nueva función toggleTheme */}
        <button onClick={toggleTheme} className="theme-toggle" aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
          {/* Los iconos se muestran/ocultan según el estado 'theme' */}
          <span className={`theme-icon sun ${theme === 'light' ? 'active' : ''}`}>☀️</span>
          <span className={`theme-icon moon ${theme === 'dark' ? 'active' : ''}`}>🌙</span>
        </button>
      </div>
    </header>
  );
}

export default Header;