// ---- frontend/src/components/AmigoPRsModal.js (REESCRITO) ----

import React, { useState, useEffect, useMemo } from 'react';
import './AmigoPRsModal.css'; // Usamos el CSS nuevo

function AmigoPRsModal({ isOpen, onClose, amigo, token }) {
  
  const [listaPRs, setListaPRs] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState(""); // Estado para el filtro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // EFECTO 1: Cargar TODOS los PRs del amigo (solo 1 vez)
  useEffect(() => {
    if (!isOpen || !amigo) return; // No cargar si no debe
    
    const cargarTodosPRs = async () => {
      setLoading(true);
      setError(null);
      setFiltroNombre(""); // Resetea el filtro
      try {
        // ¡Usamos el nuevo endpoint!
        const res = await fetch(`http://localhost/programacion/TFG/movium/backend/api/get_todos_prs_amigo.php?id_amigo=${amigo.id}`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al cargar PRs.");
        setListaPRs(data);
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    };
    cargarTodosPRs();
  }, [isOpen, amigo, token]); // Se ejecuta cuando se abre el modal

  // Lógica de filtrado (como en SelectorEjerciciosModal)
  const listaFiltrada = useMemo(() => {
    if (!filtroNombre) return listaPRs; // Si no hay filtro, muestra todo

    return listaPRs.filter(pr => 
      pr.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) ||
      pr.grupo_muscular.toLowerCase().includes(filtroNombre.toLowerCase())
    );
  }, [listaPRs, filtroNombre]);


  // Handler para resetear estado al cerrar
  const handleClose = () => {
    onClose();
    // No reseteamos los datos, se recargarán al abrir
  };

  if (!isOpen || !amigo) {
    return null;
  }

  // --- JSX de un PR (para no repetirlo) ---
  const renderPR = (pr) => {
    if (pr.tipo === 'cardio') {
      return (
        <div className="records-grid-modal">
          <div className="record-item-modal">
            <strong>Mayor Tiempo</strong>
            <span>{pr.max_tiempo || 0} min</span>
          </div>
          <div className="record-item-modal">
            <strong>Mayor Distancia</strong>
            <span>{pr.max_dist || 0} km</span>
          </div>
        </div>
      );
    } else { // fuerza o calistenia
      return (
         <div className="records-grid-modal">
          <div className="record-item-modal">
            <strong>Mayor Peso</strong>
            <span>{pr.max_peso || 0} kg</span>
          </div>
          <div className="record-item-modal">
            <strong>Máximas Reps</strong>
            <span>{pr.max_reps || 0}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="modal-backdrop-prs" onClick={handleClose}>
      <div className="modal-content-prs" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header-prs">
          <h3>PRs de {amigo.nombre_usuario}</h3>
          <button className="modal-close-btn-prs" onClick={handleClose}>
            &times;
          </button>
        </div>
        
        {/* El Filtro de Búsqueda (como en SelectorEjerciciosModal) */}
        <div className="modal-filters-prs">
          <input 
            type="search" 
            placeholder="Filtrar por nombre o grupo..." 
            className="modal-search-prs"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
        </div>

        {/* La lista de PRs */}
        <div className="modal-body-prs modal-list-prs">
          
          {error && <div className="message" style={{marginBottom: '1.5rem'}}>{error}</div>}
          {loading && <p className="subtitle" style={{textAlign: 'center', marginTop: '2rem'}}>Cargando récords...</p>}
          
          {!loading && !error && (
            listaFiltrada.length > 0 ? (
              listaFiltrada.map(pr => (
                <div key={pr.ejercicio_id} className="pr-item-card">
                  <div className="pr-item-header">
                    <strong>{pr.nombre}</strong>
                    <span>{pr.grupo_muscular}</span>
                  </div>
                  {renderPR(pr)}
                </div>
              ))
            ) : (
              <p className="no-data-msg-modal" style={{border: 'none', padding: '2rem 0'}}>
                {listaPRs.length === 0 
                  ? `${amigo.nombre_usuario} aún no tiene PRs registrados.`
                  : "No se encontraron PRs con ese filtro."
                }
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default AmigoPRsModal;