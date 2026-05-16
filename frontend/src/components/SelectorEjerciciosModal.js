// Modal para elegir ejercicios

import React, { useState } from 'react';
import './SelectorEjerciciosModal.css';

function SelectorEjerciciosModal({ isOpen, onClose, listaEjercicios, onEjercicioSelect }) {

  // Estados
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("Todos");

  // Lista de grupos musculares sin repetidos
  const gruposMusculares = ["Todos"];
  listaEjercicios.forEach(ej => {
    if (ej.grupo_muscular && !gruposMusculares.includes(ej.grupo_muscular)) {
      gruposMusculares.push(ej.grupo_muscular);
    }
  });

  // Filtrar la lista segun los filtros activos
  const listaFiltrada = listaEjercicios.filter(ej => {
    const pasaFiltroGrupo = (filtroGrupo === "Todos") || (ej.grupo_muscular === filtroGrupo);
    const pasaFiltroNombre = ej.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
    return pasaFiltroGrupo && pasaFiltroNombre;
  });

  // Accion al seleccionar
  const seleccionarEjercicio = (ejercicio) => {
    onEjercicioSelect(ejercicio);
    onClose();
  };

  // Si no esta abierto no muestra nada
  if (!isOpen) {
    return null;
  }

  // 4. RENDERIZADO
  return (
    // Fondo oscuro
    <div className="modal-backdrop" onClick={onClose}>
      
      {/* Contenido del Modal (stopPropagation para evitar que se cierre al hacer clic dentro) */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Encabezado y Botón de Cerrar */}
        <div className="modal-header">
          <h3>Seleccionar Ejercicio</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {/* Filtros */}
        <div className="modal-filters">
          <input 
            type="search" 
            placeholder="Buscar por nombre..." 
            className="modal-search"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
          <select 
            className="modal-group-select"
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
          >
            {gruposMusculares.map(grupo => (
              <option key={grupo} value={grupo}>{grupo || "Sin Grupo"}</option>
            ))}
          </select>
        </div>
        
        {/* Lista de Ejercicios */}
        <div className="modal-list">
          {listaFiltrada.length > 0 ? (
            listaFiltrada.map(ej => (
              <button 
                key={ej.id} 
                className="modal-list-item"
                onClick={() => seleccionarEjercicio(ej)}
              >
                <strong>{ej.nombre}</strong>
                <span>{ej.grupo_muscular}</span>
              </button>
            ))
          ) : (
            <p className="modal-no-results">No se encontraron ejercicios.</p>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default SelectorEjerciciosModal;