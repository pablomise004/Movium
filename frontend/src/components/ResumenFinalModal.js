// ---- frontend/src/components/ResumenFinalModal.js (CORREGIDO - Función añadida) ----

import React, { useState } from 'react';
import './RegistrarSerieModal.css'; // Mantenemos el CSS compartido

// --- ¡¡NUEVO!! Definición de formatObjetivoNatural ---
// (Copiada de WorkoutSession.js o RegistrarSerieModal.js)
const formatObjetivoNatural = (obj, tipo) => {
  if (!obj) return ''; // Seguridad

  if (tipo === 'cardio') {
    const metricas = [];
    if (obj.tiempo_min_objetivo) metricas.push(`${obj.tiempo_min_objetivo} min`);
    if (obj.distancia_km_objetivo) metricas.push(`${obj.distancia_km_objetivo} km`);

    if (metricas.length > 2) {
        return metricas.slice(0, -1).join(', ') + ' y ' + metricas.slice(-1);
    } else {
        return metricas.join(' y ');
    }
  }

  // Lógica Fuerza V6.0 (Lenguaje Natural)
  let textoPrincipal = "";
  if (obj.tipo_rep_objetivo === 'fallo') {
    textoPrincipal = "Al Fallo";
  } else if (obj.tipo_rep_objetivo === 'rango') {
    textoPrincipal = `${obj.reps_min_objetivo || '?'}-${obj.reps_max_objetivo || '?'} reps`;
  } else { // 'fijo'
    textoPrincipal = `${obj.reps_min_objetivo || '?'} reps`;
  }

  if (obj.peso_kg_objetivo != null) {
    textoPrincipal += ` con ${obj.peso_kg_objetivo} kg`;
  }

  if (obj.descanso_seg_post != null) {
    textoPrincipal += ` (${obj.descanso_seg_post}s)`;
  }

  return textoPrincipal;
};
// --- FIN NUEVO ---


function ResumenFinalModal({ isOpen, onClose, onConfirm, isFinishing, resumenDatos }) {

  // ESTADO Y CONSTANTE PARA NOTAS
  const [notas, setNotas] = useState('');
  const MAX_NOTAS_LENGTH = 1000;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(notas);
  };

  // Handler para notas
  const handleNotasChange = (e) => {
    if (e.target.value.length <= MAX_NOTAS_LENGTH) {
      setNotas(e.target.value);
    }
  };

  if (!isOpen) {
    return null;
  }

  const hayResumen = Array.isArray(resumenDatos) && resumenDatos.length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3>Finalizar Entrenamiento</h3>
          <button className="modal-close-btn" onClick={onClose} disabled={isFinishing}>
            &times;
          </button>
        </div>

        <form className="modal-form" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }} onSubmit={handleSubmit}>

          <div className="resumen-container">
            <h4>Resumen del Entrenamiento:</h4>

            {hayResumen ? (
              // MAP EXTERIOR: EJERCICIOS
              resumenDatos.map((ejercicio) => (
                <div className="resumen-ejercicio-grupo" key={ejercicio.nombre}>
                  <div className="resumen-ejercicio-header">
                    <strong>{ejercicio.nombre}</strong>
                  </div>

                  {/* MAP INTERIOR: SERIES */}
                  <ul className="resumen-series-lista">
                    {ejercicio.series.map((serie, index) => (
                      <li key={`${serie.num_serie}_${index}`}>
                        <div className="resumen-serie-detalle">
                          <span>Serie {serie.num_serie}:</span>
                          {ejercicio.tipo === 'cardio' ?
                          (
                            <>
                              {serie.tiempo_min_realizado != null && (
                                <span>{serie.tiempo_min_realizado} min</span>
                              )}
                              {serie.distancia_km_realizada != null && (
                                <span>{serie.distancia_km_realizada} km</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span>
                                {serie.repeticiones_realizadas} reps
                                {serie.fue_al_fallo && <span className="fallo-tag">AL FALLO</span>}
                              </span>
                              {serie.peso_kg_usado != null && (
                                <span>{serie.peso_kg_usado} kg</span>
                              )}
                            </>
                          )}
                        </div>
                        {serie.notas_serie && (
                          <p className="resumen-serie-nota">
                            📝 {serie.notas_serie}
                          </p>
                        )}
                       </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="resumen-vacio">No has completado ninguna serie en esta sesión.</p>
            )}
          </div>

          {/* Textarea y Contador */}
          <div className="form-group-small" style={{ marginTop: '1rem' }}>
            <label htmlFor="notas_sesion">Notas de la Sesión (opcional)</label>
            <textarea
              id="notas_sesion"
              value={notas}
              onChange={handleNotasChange}
              placeholder="Ej: Me he sentido fuerte hoy..."
              rows="3"
              disabled={isFinishing}
              style={{ minHeight: '60px' }}
              maxLength={MAX_NOTAS_LENGTH}
            ></textarea>
            <small style={{ textAlign: 'right', color: 'var(--text-secondary-color)', marginTop: '0.25rem' }}>
              {notas.length} / {MAX_NOTAS_LENGTH}
            </small>
          </div>

          <div className="modal-footer">
            <button type="submit" className="transparent-btn" disabled={isFinishing}>
              {isFinishing ? 'Guardando...' : 'Confirmar y Guardar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ResumenFinalModal;