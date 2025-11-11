// ---- frontend/src/RutinaProgreso.js (Refactorizado con fecha relativa) ----

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RutinaProgreso.css'; // Asegúrate que la ruta al CSS es correcta
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import iconoEstadisticas from './assets/estadisticas.png';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Constantes ---
const ITEMS_PER_PAGE = 10;

// --- Funciones Helper ---

/**
 * ¡¡FUNCIÓN ACTUALIZADA!!
 * Formatea una fecha ISO a un string relativo (Hoy, Ayer, En el futuro, etc.)
 * (Copiada de Dashboard.js)
 */
const formatRelativeDate = (dateString) => {
  if (!dateString) { return ''; } // Devuelve string vacío si no hay fecha
  try {
    const sessionDate = new Date(dateString);
    
    // Clonamos las fechas para manipularlas sin afectar la hora original
    const sessionDateMidnight = new Date(sessionDate);
    sessionDateMidnight.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Comprobar si es en el futuro
    const diffTimeFuturo = sessionDateMidnight - today;
    if (diffTimeFuturo > 0) {
      return 'En el futuro';
    }

    // 2. Comprobar si es pasado
    const diffTimePasado = today - sessionDateMidnight;
    const diffDays = Math.floor(diffTimePasado / (1000 * 60 * 60 * 24));

    if (diffDays === 0) { return 'Hoy'; }
    else if (diffDays === 1) { return 'Ayer'; }
    else if (diffDays > 1 && diffDays < 7) {
      const dayName = sessionDate.toLocaleDateString('es-ES', { weekday: 'long' });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return `${capitalizedDayName}`;
    } else {
      // Si es más antiguo, devuelve la fecha completa
      return sessionDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch (e) { 
    console.error("Error formateando fecha relativa:", dateString, e); 
    return 'Fecha inválida'; 
  }
};

/**
 * Formatea la duración de 'HH:MM:SS' a 'Xh Ym'.
 */
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

/**
 * Componente Modal Simple para Notas (Corregido)
 */
const NotaModal = ({ nota, onClose }) => {
  if (!nota || typeof onClose !== 'function') return null;

  const backdropStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    animation: 'fadeInModal 0.2s ease-out'
  };
  const contentStyle = {
    backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    maxHeight: '70vh',
    overflowY: 'auto',
    border: '1px solid var(--input-border-color)',
    position: 'relative',
    fontSize: '1rem',
    lineHeight: '1.6',
    boxSizing: 'border-box',
    animation: 'slideInModal 0.2s ease-out'
  };
  const closeButtonStyle = {
    position: 'absolute', top: '0.75rem', right: '0.75rem',
    background: 'none',
    border: 'none', fontSize: '1.8rem',
    color: 'var(--text-secondary-color)', cursor: 'pointer',
    lineHeight: 1,
    padding: '0.2rem'
  };
  const closeButtonHoverStyle = {
    color: 'var(--text-color)',
  };
  const notaTextStyle = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    marginTop: '0.5rem',
    marginBottom: '0',
    color: 'var(--text-color)'
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
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.color = closeButtonHoverStyle.color}
            onMouseLeave={(e) => e.currentTarget.style.color = closeButtonStyle.color}
            aria-label="Cerrar nota"
          >
            &times;
          </button>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>Nota:</h4>
          <p style={notaTextStyle}>{nota}</p>
        </div>
      </div>
    </>
  );
};

// --- Componente Principal ---

function RutinaProgreso() {
  const { id: rutinaId } = useParams();
  const navigate = useNavigate();

  // --- Estados ---
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [rutinaNombre, setRutinaNombre] = useState('');
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [datosHistorial, setDatosHistorial] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSesiones, setTotalSesiones] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [notaParaMostrar, setNotaParaMostrar] = useState('');

  // --- Efecto para actualizar isMobile ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Cargar Datos ---
  const cargarProgreso = useCallback(async (pageToLoad) => {
    const isInitialLoad = pageToLoad === 1;
    if (isInitialLoad) { setLoading(true); } else { setLoadingMore(true); }
    setError(null);
    const token = localStorage.getItem('movium_token');
    if (!token) { setError("Error de autenticación."); setLoading(false); setLoadingMore(false); return; }

    try {
      const res = await fetch(`http://localhost/programacion/TFG/movium/backend/api/get_progreso_rutina.php?id=${rutinaId}&page=${pageToLoad}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { throw new Error(data.mensaje || "Error al cargar el progreso."); }

      if (isInitialLoad) {
        setRutinaNombre(data.rutina_info?.nombre || 'Progreso de Rutina');
        setDatosGrafica(data.grafica || []);
        setDatosHistorial(data.historial || []);
        setTotalSesiones(data.total_sesiones || 0);
        setCurrentPage(1);
      } else {
        setDatosHistorial(prev => [...prev, ...(data.historial || [])]);
        setCurrentPage(pageToLoad);
      }
    } catch (err) { setError(err.message); }
    finally { if (isInitialLoad) { setLoading(false); } else { setLoadingMore(false); } }
  }, [rutinaId]);

  // --- Efecto Inicial ---
  useEffect(() => { cargarProgreso(1); }, [cargarProgreso]);

  // --- Handlers ---
  const handleLoadMore = () => { 
    if (!loadingMore && datosHistorial.length < totalSesiones) { 
      cargarProgreso(currentPage + 1); 
    } 
  };

  const handleMostrarNota = (notaTexto) => {
    if (notaTexto) {
      setNotaParaMostrar(notaTexto);
      setIsNotaModalOpen(true);
    }
  };

  const handleCloseNotaModal = () => {
    setIsNotaModalOpen(false);
  };

  // --- Preparación Gráficas (Memoized) ---
  const { labels, datosGraficaFiltrados } = useMemo(() => {
    const limiteDatos = isMobile && datosGrafica.length > 20 ? 20 : datosGrafica.length;
    const datosFiltrados = datosGrafica.slice(-limiteDatos);
    const labelsFiltrados = datosFiltrados.map(d => `S${d.sesion_num}`);
    return { labels: labelsFiltrados, datosGraficaFiltrados: datosFiltrados };
  }, [datosGrafica, isMobile]);

  const getCommonChartOptions = useCallback((titleText) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          color: '#CCCCCC',
          font: { size: 11 },
        }
      },
      title: {
        display: true,
        text: `${titleText} (Últimas ${datosGraficaFiltrados.length} Sesiones)`
      }
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: isMobile ? 6 : 20,
          maxRotation: isMobile ? 90 : 0,
          minRotation: isMobile ? 45 : 0,
          font: { size: isMobile ? 9 : 11 }
        }
      },
      yVolumen: { display: false },
      yReps: { display: false },
      yTiempo: { display: false },
      yDistancia: { display: false },
      yVelocidad: { display: false }
    }
  }), [isMobile, datosGraficaFiltrados.length]);

  const hayDatosFuerza = useMemo(() => datosGraficaFiltrados.some(d => parseFloat(d.volumen_fuerza) > 0 || parseFloat(d.reps_totales_fuerza) > 0), [datosGraficaFiltrados]);
  const hayDatosCardio = useMemo(() => datosGraficaFiltrados.some(d => parseFloat(d.tiempo_cardio) > 0 || parseFloat(d.distancia_cardio) > 0), [datosGraficaFiltrados]);

  // Opciones Gráfica Fuerza
  const { chartDataFuerza, chartOptionsFuerza } = useMemo(() => {
    const datasets = [
      { label: 'Volumen (kg)', data: datosGraficaFiltrados.map(d => d.volumen_fuerza), borderColor: 'rgb(255, 99, 132)', tension: 0.1, yAxisID: 'yVolumen', pointStyle: 'circle', pointRadius: 3, pointHoverRadius: 5 },
      { label: 'Reps', data: datosGraficaFiltrados.map(d => d.reps_totales_fuerza), borderColor: 'rgb(54, 162, 235)', tension: 0.1, yAxisID: 'yReps', pointStyle: 'circle', pointRadius: 3, pointHoverRadius: 5 }
    ];
    const options = {
      ...getCommonChartOptions('Evolución de Fuerza'),
      scales: {
        ...getCommonChartOptions('Evolución de Fuerza').scales,
        yVolumen: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Volumen (kg)' }, beginAtZero: true },
        yReps: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Reps' }, grid: { drawOnChartArea: false }, beginAtZero: true }
      }
    };
    return { chartDataFuerza: { labels, datasets }, chartOptionsFuerza: options };
  }, [datosGraficaFiltrados, labels, getCommonChartOptions]);

  // Opciones Gráfica Cardio
  const { chartDataCardio, chartOptionsCardio } = useMemo(() => {
    const datasets = [
      { label: 'Tiempo (min)', data: datosGraficaFiltrados.map(d => d.tiempo_cardio), borderColor: 'rgb(46, 204, 113)', tension: 0.1, yAxisID: 'yTiempo', pointStyle: 'circle', pointRadius: 3, pointHoverRadius: 5 },
      { label: 'Distancia (km)', data: datosGraficaFiltrados.map(d => d.distancia_cardio), borderColor: 'rgb(153, 102, 255)', tension: 0.1, yAxisID: 'yDistancia', pointStyle: 'circle', pointRadius: 3, pointHoverRadius: 5 },
      { label: 'Velocidad (km/h)', data: datosGraficaFiltrados.map(d => d.velocidad_media_kmh > 0 ? parseFloat(d.velocidad_media_kmh).toFixed(1) : null), borderColor: 'rgb(255, 159, 64)', tension: 0.1, yAxisID: 'yVelocidad', pointStyle: 'circle', pointRadius: 3, pointHoverRadius: 5 }
    ];
    const options = {
      ...getCommonChartOptions('Evolución de Cardio'),
      scales: {
        ...getCommonChartOptions('Evolución de Cardio').scales,
        yTiempo: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Tiempo (min)' }, beginAtZero: true },
        yDistancia: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Distancia (km)' }, grid: { drawOnChartArea: false }, beginAtZero: true },
        yVelocidad: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Velocidad (km/h)' }, grid: { drawOnChartArea: false }, beginAtZero: true }
      }
    };
    return { chartDataCardio: { labels, datasets }, chartOptionsCardio: options };
  }, [datosGraficaFiltrados, labels, getCommonChartOptions]);

  // --- Renderizado ---

  if (loading) { 
    return <div className="progreso-container"><p className="subtitle">Cargando progreso...</p></div>; 
  }
  
  if (error && datosHistorial.length === 0) { 
    return (
      <div className="progreso-container">
        <button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver</button>
        <div className="message">{error}</div>
      </div>
    ); 
  }

  return (
    <>
      <div className="progreso-container">
        <button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver al Inicio</button>

        {/* --- Cabecera --- */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
          <img src={iconoEstadisticas} alt="" width="64" height="64" />
          <h2>{rutinaNombre}</h2>
        </div>
        <p className="subtitle" style={{ textAlign: 'center' }}>
          Tu evolución y el historial de sesiones para esta rutina.
        </p>
        {error && !loading && <div className="message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* Gráficas */}
        {hayDatosFuerza && ( 
          <div className="chart-container-progreso"> 
            <Line options={chartOptionsFuerza} data={chartDataFuerza} /> 
          </div> 
        )}
        {hayDatosCardio && ( 
          <div className="chart-container-progreso"> 
            <Line options={chartOptionsCardio} data={chartDataCardio} /> 
          </div> 
        )}
        {!loading && !hayDatosFuerza && !hayDatosCardio && !error && ( 
          <p className="no-data-msg">No hay datos suficientes para mostrar gráficas.</p> 
        )}

        {/* Historial */}
        <h3 className="historial-titulo">Historial de Sesiones ({totalSesiones} en total)</h3>
        <div className="historial-container">
          {datosHistorial.length > 0 ? (
            datosHistorial.map(sesion => {
              const duracionFormateada = formatDuracion(sesion.duracion);
              // --- ¡¡AQUÍ ESTÁ EL CAMBIO!! ---
              // Usamos la nueva función 'formatRelativeDate'
              const fechaRelativa = formatRelativeDate(sesion.fecha_inicio);
              
              return (
                <div key={sesion.sesion_id} className="sesion-card">
                  <div className="sesion-header">
                    {/* Mostramos la fecha relativa en lugar de la fecha completa */}
                    <strong>{fechaRelativa}</strong>
                    
                    <div className="sesion-totales">
                      {duracionFormateada && ( <span>🕒 {duracionFormateada}</span> )}
                      {sesion.total_volumen_fuerza > 0 && ( <span>🏋️ {Math.round(sesion.total_volumen_fuerza)} kg</span> )}
                      {sesion.total_tiempo_cardio > 0 && ( <span>⏱️ {sesion.total_tiempo_cardio} min</span> )}
                      {sesion.total_distancia_cardio > 0 && ( <span>📍 {sesion.total_distancia_cardio.toFixed(1)} km</span> )}
                    </div>
                    
                    {sesion.notas_sesion && (
                      <span
                        className="sesion-nota"
                        onClick={() => handleMostrarNota(sesion.notas_sesion)}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        aria-label="Ver nota de la sesión"
                      >
                        📝
                      </span>
                    )}
                  </div>
                  <div className="ejercicios-container">
                    {sesion.ejercicios.map(ejercicio => (
                      <div key={ejercicio.orden + '_' + ejercicio.nombre_ejercicio} className="ejercicio-grupo">
                        <strong>{ejercicio.nombre_ejercicio}</strong>
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
                                <span
                                  className="serie-nota-historial"
                                  onClick={() => handleMostrarNota(serie.notas_serie)}
                                  style={{ cursor: 'pointer' }}
                                  role="button"
                                  aria-label={`Ver nota de la serie ${serie.num_serie}`}
                                >
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
          ) : (
            !loading && !error && <p className="no-data-msg">No has completado ninguna sesión para esta rutina todavía.</p>
          )}
        </div>

        {/* Botón "Cargar Más" */}
        {datosHistorial.length < totalSesiones && (
          <button className="btn-cargar-mas" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Cargando...' : 'Cargar sesiones anteriores'}
          </button>
        )}
      </div>

      {/* Modal de Notas */}
      {isNotaModalOpen && (
        <NotaModal
          nota={notaParaMostrar}
          onClose={handleCloseNotaModal}
        />
      )}
    </>
  );
}

export default RutinaProgreso;