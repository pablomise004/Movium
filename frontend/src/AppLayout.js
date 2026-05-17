import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './AppLayout.css';

function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(window.innerWidth > 767);

  const toggleSidebar = () => {
    setMenuAbierto(!menuAbierto);
  };

  return (
    <div className={`app-layout ${menuAbierto ? 'sidebar-open' : 'sidebar-closed'}`}>
      
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