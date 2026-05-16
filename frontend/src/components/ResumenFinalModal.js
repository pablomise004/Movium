// Modal de resumen final

import React, { useState } from 'react';
import './RegistrarSerieModal.css'; // Mantenemos el CSS compartido

function ResumenFinalModal({ isOpen: abierto, onClose: cerrar, onConfirm: confirmar, isFinishing: guardando, resumenDatos }) {

  const formatearObjetivoNatural = (obj, tipo) => {
    if (!obj) return '';

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

    let textoPrincipal = "";
    if (obj.tipo_rep_objetivo === 'fallo') {
      textoPrincipal = "Al Fallo";
    } else if (obj.tipo_rep_objetivo === 'rango') {
      textoPrincipal = `${obj.reps_min_objetivo || '?'}-${obj.reps_max_objetivo || '?'} reps`;
    } else {
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

  const [notas, setNotas] = useState('');
  const MAX_NOTAS_LENGTH = 1000;

  const guardar = (e) => {
    e.preventDefault();
    confirmar(notas);
  };

  const manejarNotas = (e) => {
    if (e.target.value.length <= MAX_NOTAS_LENGTH) {
      setNotas(e.target.value);
    }
  };

  if (!abierto) {
    return null;
  }

  const hayResumen = Array.isArray(resumenDatos) && resumenDatos.length > 0;

  return (
    <div className="modal-backdrop" onClick={cerrar}>
      <div className="modal-content" style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3>Finalizar Entrenamiento</h3>
          <button className="modal-close-btn" onClick={cerrar} disabled={guardando}>
            &times;
          </button>
        </div>

        <form className="modal-form" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }} onSubmit={guardar}>

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

          <div className="form-group-small" style={{ marginTop: '1rem' }}>
            <label htmlFor="notas_sesion">Notas de la Sesión (opcional)</label>
            <textarea
              id="notas_sesion"
              value={notas}
              onChange={manejarNotas}
              placeholder="Ej: Me he sentido fuerte hoy..."
              rows="3"
              disabled={guardando}
              style={{ minHeight: '60px' }}
              maxLength={MAX_NOTAS_LENGTH}
            ></textarea>
          </div>

          <div className="modal-footer">
            <button type="submit" className="transparent-btn" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Confirmar y Guardar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ResumenFinalModal;