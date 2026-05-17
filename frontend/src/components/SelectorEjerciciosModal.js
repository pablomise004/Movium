// Modal para elegir ejercicios

import React, { useState } from 'react';
import './SelectorEjerciciosModal.css';

function SelectorEjerciciosModal({ isOpen, onClose, listaEjercicios, onEjercicioSelect }) {

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("Todos");

  const gruposMusculares = ["Todos"];
  listaEjercicios.forEach(ej => {
    if (ej.grupo_muscular && !gruposMusculares.includes(ej.grupo_muscular)) {
      gruposMusculares.push(ej.grupo_muscular);
    }
  });

  const listaFiltrada = listaEjercicios.filter(ej => {
    const pasaFiltroGrupo = (filtroGrupo === "Todos") || (ej.grupo_muscular === filtroGrupo);
    const pasaFiltroNombre = ej.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
    return pasaFiltroGrupo && pasaFiltroNombre;
  });

  const seleccionarEjercicio = (ejercicio) => {
    onEjercicioSelect(ejercicio);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Seleccionar Ejercicio</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
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