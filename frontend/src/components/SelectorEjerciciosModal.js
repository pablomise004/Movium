// ---- frontend/src/components/SelectorEjerciciosModal.js (NUEVO ARCHIVO) ----

import React, { useState, useMemo } from 'react';
import './SelectorEjerciciosModal.css'; // <-- Crearemos este CSS

function SelectorEjerciciosModal({ 
  isOpen, 
  onClose, 
  listaEjercicios, 
  onEjercicioSelect 
}) {

  // 1. ESTADOS
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("Todos");

  // 2. LÓGICA DE FILTRADO
  
  // Obtenemos la lista de grupos musculares únicos (esto solo se calcula una vez)
  const gruposMusculares = useMemo(() => {
    const grupos = new Set(listaEjercicios.map(ej => ej.grupo_muscular));
    return ["Todos", ...grupos];
  }, [listaEjercicios]);

  // Filtramos la lista de ejercicios basándonos en los estados
  const listaFiltrada = useMemo(() => {
    return listaEjercicios.filter(ej => {
      // 1. Filtro por Grupo
      const pasaFiltroGrupo = (filtroGrupo === "Todos") || (ej.grupo_muscular === filtroGrupo);
      
      // 2. Filtro por Nombre
      const pasaFiltroNombre = ej.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
      
      return pasaFiltroGrupo && pasaFiltroNombre;
    });
  }, [listaEjercicios, filtroNombre, filtroGrupo]);

  // 3. HANDLERS
  const handleSelect = (ejercicio) => {
    onEjercicioSelect(ejercicio); // Devuelve el ejercicio seleccionado
    onClose(); // Cierra el modal
  };

  // Si no está abierto, no renderiza nada
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
                onClick={() => handleSelect(ej)}
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