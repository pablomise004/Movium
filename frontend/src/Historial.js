// ---- frontend/src/Historial.js (CORREGIDO con la función toLocalISOString) ----

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Estilos base
import './Historial.css'; // Estilos del calendario (puntos)
import './RutinaProgreso.css'; // <-- ¡IMPORTANTE! Reutilizamos este CSS
import iconoCalendario from './assets/calendario.png';

// ==================================================================
// --- (1) Helper Functions ---
// ==================================================================

const formatFecha = (fechaISO) => {
  if (!fechaISO) return '';
  return new Date(fechaISO).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const formatDuracion = (duracionSql) => {
  if (!duracionSql || duracionSql === '00:00:00') return null;
  const partes = duracionSql.split(':');
  const horas = parseInt(partes[0], 10);
  const minutos = parseInt(partes[1], 10);

  let resultado = '';
  if (horas > 0) {
    resultado += `${horas}h `;
  }
  if (minutos > 0 || horas === 0) {
    resultado += `${minutos}m`;
  }
  return resultado.trim();
};

// --- ¡¡AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA!! ---
/**
 * Convierte un objeto Date a un string YYYY-MM-DD en la fecha LOCAL, 
 * ignorando la zona horaria.
 */
const toLocalISOString = (date) => {
  const y = date.getFullYear();
  // getMonth() es 0-11, por eso +1. padStart asegura "09" vs "9".
  const m = String(date.getMonth() + 1).padStart(2, '0'); 
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
// --- FIN DE LA FUNCIÓN AÑADIDA ---


/**
 * Componente Modal Simple para Notas
 */
const NotaModal = ({ nota, onClose }) => {
  if (!nota || typeof onClose !== 'function') return null;
  
  const backdropStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    animation: 'fadeInModal 0.2s ease-out'
  };
  const contentStyle = {
    backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px',
    maxWidth: '450px', width: '90%', maxHeight: '70vh', overflowY: 'auto',
    border: '1px solid var(--input-border-color)', position: 'relative',
    fontSize: '1rem', lineHeight: '1.6', boxSizing: 'border-box',
    animation: 'slideInModal 0.2s ease-out'
  };
  const closeButtonStyle = {
    position: 'absolute', top: '0.75rem', right: '0.75rem',
    background: 'none', border: 'none', fontSize: '1.8rem',
    color: 'var(--text-secondary-color)', cursor: 'pointer', lineHeight: 1, padding: '0.2rem'
  };
  const notaTextStyle = {
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    marginTop: '0.5rem', marginBottom: '0', color: 'var(--text-color)'
  };
  const keyframesStyle = `
    @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInModal { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `;

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={backdropStyle} onClick={onClose}>
        <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Cerrar nota">&times;</button>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>Nota:</h4>
          <p style={notaTextStyle}>{nota}</p>
        </div>
      </div>
    </>
  );
};

// ==================================================================
// --- (2) Main Component ---
// ==================================================================

function Historial() {
  const navigate = useNavigate();

  // --- Estados ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fechasConColores, setFechasConColores] = useState({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null); // String "YYYY-MM-DD"
  const [datosDelDia, setDatosDelDia] = useState([]); // Array de sesiones
  const [loadingDia, setLoadingDia] = useState(false);
  const [errorDia, setErrorDia] = useState(null);
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [notaParaMostrar, setNotaParaMostrar] = useState('');

  // --- Efectos ---

  // Cargar las fechas para los puntos del calendario
  useEffect(() => {
    const cargarFechas = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('movium_token');
      if (!token) { setError("Error de autenticación."); setLoading(false); return; }

      try {
        const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/get_historial_fechas.php', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.mensaje || 'No se pudieron cargar las fechas.'); }
        setFechasConColores(data);
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
    };
    cargarFechas();
  }, []);

  // --- Handlers ---

  /**
   * Renderiza el contenido de los puntos de color para cada día del calendario.
   */
  const handleTileContent = ({ date, view }) => {
    if (view === 'month') {
      // --- ¡ARREGLADO! ---
      // Ahora 'toLocalISOString' está definida y no dará error
      const fechaLocal = toLocalISOString(date); 
      const colores = fechasConColores[fechaLocal];
      
      if (colores && colores.length > 0) {
        return (
          <div className="dot-container">
            {colores.map((color, index) => (
              <div key={index} className="dot" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  /**
   * Se llama al hacer clic en un día del calendario.
   * Carga los detalles de las sesiones de ese día.
   */
  const handleDayClick = async (date) => {
    // --- ¡ARREGLADO! ---
    // Ahora 'toLocalISOString' está definida y no dará error
    const fechaLocal = toLocalISOString(date);
    
    // Si hacemos clic en el mismo día, lo deseleccionamos
    if (fechaSeleccionada === fechaLocal) {
      setFechaSeleccionada(null);
      setDatosDelDia([]);
      setErrorDia(null);
      return;
    }

    // Comprobar si este día tiene entrenos (mirando nuestro mapa de colores)
    if (!fechasConColores[fechaLocal]) {
      // Si no hay colores, no hay entreno. Limpiamos la selección.
      setFechaSeleccionada(null);
      setDatosDelDia([]);
      setErrorDia("No hay entrenamientos registrados para este día.");
      return;
    }

    // Si hay entrenos, buscamos los detalles
    setLoadingDia(true);
    setErrorDia(null);
    setDatosDelDia([]);
    setFechaSeleccionada(fechaLocal);
    
    const token = localStorage.getItem('movium_token');
    if (!token) {
      setErrorDia("Error de autenticación.");
      setLoadingDia(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost/programacion/TFG/movium/backend/api/get_historial_por_fecha.php?fecha=${fechaLocal}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.mensaje || 'No se pudieron cargar los datos del día.'); }
      
      setDatosDelDia(data); // Guardamos el array de sesiones

    } catch (err) {
      setErrorDia(err.message);
    } finally {
      setLoadingDia(false);
    }
  };

  /**
   * Handlers para el Modal de Notas
   */
  const handleMostrarNota = (notaTexto) => {
    if (notaTexto) {
      setNotaParaMostrar(notaTexto);
      setIsNotaModalOpen(true);
    }
  };

  const handleCloseNotaModal = () => {
    setIsNotaModalOpen(false);
  };

  // --- Renderizado ---
  return (
    <>
      <div className="historial-container">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          &larr; Volver
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
          <img src={iconoCalendario} alt="" width="64" height="64" />
          <h2>Historial de Entreno</h2>
        </div>
        <p className="subtitle" style={{ textAlign: 'center' }}>
          Pulsa en un día marcado para ver el detalle del entrenamiento.
        </p>

        {loading && <p className="subtitle" style={{ textAlign: 'center' }}>Cargando calendario...</p>}
        {error && <div className="message" style={{ marginTop: '1rem' }}>{error}</div>}

        {/* Contenedor del Calendario */}
        {!loading && !error && (
          <div className="calendario-wrapper">
            <Calendar
              tileContent={handleTileContent}
              onClickDay={handleDayClick}
              locale="es-ES"
              // Damos una clase CSS al día seleccionado
              tileClassName={({ date, view }) => {
                // --- ¡ARREGLADO! ---
                // Usamos 'toLocalISOString' aquí también para la comparación
                if (view === 'month' && toLocalISOString(date) === fechaSeleccionada) {
                  return 'dia-seleccionado';
                }
                return null;
              }}
            />
          </div>
        )}

        {/* Sección de Detalles del Día Seleccionado */}
        <div className="historial-detalle-dia">
          {loadingDia && <p className="subtitle" style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando día...</p>}
          {errorDia && <p className="no-data-msg" style={{ marginTop: '2rem' }}>{errorDia}</p>}
          
          {/* Reutilizamos las clases de RutinaProgreso.css */}
          <div className="historial-container" style={{ padding: 0, marginTop: '2rem' }}>
            {datosDelDia.length > 0 && (
              datosDelDia.map(sesion => {
                const duracionFormateada = formatDuracion(sesion.duracion);
                return (
                  // 1. Tarjeta de Sesión
                  <div key={sesion.sesion_id} className="sesion-card">
                    <div className="sesion-header">
                      {/* 2. Cabecera (Nombre de rutina y totales) */}
                      <strong style={{ color: sesion.color_tag || 'var(--primary-color)' }}>
                        {sesion.nombre_rutina}
                      </strong>
                      <div className="sesion-totales">
                        {duracionFormateada && (<span>🕒 {duracionFormateada}</span>)}
                        {sesion.total_volumen_fuerza > 0 && (<span>🏋️ {Math.round(sesion.total_volumen_fuerza)} kg</span>)}
                        {sesion.total_tiempo_cardio > 0 && (<span>⏱️ {sesion.total_tiempo_cardio} min</span>)}
                        {sesion.total_distancia_cardio > 0 && (<span>📍 {sesion.total_distancia_cardio.toFixed(1)} km</span>)}
                      </div>
                      {sesion.notas_sesion && (
                        <span className="sesion-nota" onClick={() => handleMostrarNota(sesion.notas_sesion)} style={{ cursor: 'pointer' }} role="button">
                          📝
                        </span>
                      )}
                    </div>
                    
                    {/* 3. Contenedor de Ejercicios */}
                    <div className="ejercicios-container">
                      {sesion.ejercicios.map(ejercicio => (
                        <div key={ejercicio.orden + '_' + ejercicio.nombre_ejercicio} className="ejercicio-grupo">
                          <strong>{ejercicio.nombre_ejercicio}</strong>
                          {/* 4. Lista de Series */}
                          <ul>
                            {ejercicio.series.map((serie, index) => (
                              <li key={index} className="serie-item">
                                <span>S{serie.num_serie}:</span>
                                {ejercicio.tipo_ejercicio === 'cardio' ? (
                                  <span>
                                    {(serie.tiempo_min_realizado != null && serie.tiempo_min_realizado > 0) ? `${serie.tiempo_min_realizado} min` : ''}
                                    {(serie.distancia_km_realizada != null && serie.distancia_km_realizada > 0) ? ` ${ (serie.tiempo_min_realizado != null && serie.tiempo_min_realizado > 0) ? '📍' : '' } ${serie.distancia_km_realizada} km` : ''}
                                    {!(serie.tiempo_min_realizado > 0) && !(serie.distancia_km_realizada > 0) && '-'}
                                  </span>
                                ) : (
                                  <span>
                                    {serie.repeticiones_realizadas ?? '-'} reps
                                    {serie.peso_kg_usado != null && ` x ${serie.peso_kg_usado} kg`}
                                    {serie.fue_al_fallo && <span className="fallo-tag" title="Al fallo">F</span>}
                                  </span>
                                )}
                                {serie.notas_serie && (
                                  <span className="serie-nota-historial" onClick={() => handleMostrarNota(serie.notas_serie)} style={{ cursor: 'pointer' }} role="button">
                                    📝
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Notas (copiado) */}
      {isNotaModalOpen && (
        <NotaModal
          nota={notaParaMostrar}
          onClose={handleCloseNotaModal}
        />
      )}
    </>
  );
}

export default Historial;