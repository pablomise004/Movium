// ---- frontend/src/WorkoutSession.js (CON CRONÓMETRO MEJORADO Y CONDICIONAL) ----

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './WorkoutSession.css';
import RegistrarSerieModal from './components/RegistrarSerieModal';
import ResumenFinalModal from './components/ResumenFinalModal';
import iconoEntrenar from './assets/entrenar.png';
import GuiaModal from './components/GuiaModal';
import iconoReloj from './assets/reloj.png';
import ConfirmarSalirModal from './components/ConfirmarSalirModal';

// --- Función de formateo V6.0 (Lenguaje Natural) ---
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
// --- Función para formatear el Tooltip (más detallado) ---
const formatTooltip = (objetivo, serieReal, tipo) => {
  let tooltip = `Objetivo: ${formatObjetivoNatural(objetivo, tipo)}`;
  if (serieReal) {
    tooltip += "\n---\nRealizado:";
    if (tipo === 'cardio') {
      if (serieReal.tiempo_min_realizado != null) tooltip += ` ${serieReal.tiempo_min_realizado} min`;
      if (serieReal.distancia_km_realizada != null) {
        tooltip += (serieReal.tiempo_min_realizado != null) ?
` y ${serieReal.distancia_km_realizada} km` : ` ${serieReal.distancia_km_realizada} km`;
      }
    } else { // Fuerza
      // --- ¡CORRECCIÓN DE TYPO! ---
      tooltip += ` ${serieReal.repeticiones_realizadas ??
'?'} reps`;
      // --- FIN CORRECIÓN ---
      if (serieReal.fue_al_fallo) tooltip += ` (¡Al Fallo!)`;
      if (serieReal.peso_kg_usado != null) tooltip += ` con ${serieReal.peso_kg_usado} kg`;
    }
    if (serieReal.notas_serie) tooltip += `\nNotas: ${serieReal.notas_serie}`;
  }
  return tooltip;
};

// --- Función para formatear el cronómetro ---
const formatTiempo = (totalSegundos) => {
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  // padStart(2, '0') asegura que 1 se vea como "01"
  const hStr = String(horas).padStart(2, '0');
  const mStr = String(minutos).padStart(2, '0');
  const sStr = String(segundos).padStart(2, '0');
  if (horas > 0) {
    // Si llevas más de 1 hora
    return `${hStr}:${mStr}:${sStr}`;
  } else {
    // Si llevas menos de 1 hora
    return `${mStr}:${sStr}`;
  }
};
// --- HELPER PARA MARCAR GUÍA (COPIADO) ---
const marcarGuiaComoVista = async (nombreGuia) => {
  const token = localStorage.getItem('movium_token');
  if (!token) return;
  try {
    await fetch('http://localhost/programacion/TFG/movium/backend/api/marcar_guia_vista.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ guia_vista: nombreGuia })
    });
  } catch (error) {
    console.error("Error al marcar la guía como vista:", error);
  }
};

function WorkoutSession() {
  const { id: rutinaId } = useParams();
  const navigate = useNavigate();
  const [rutinaNombre, setRutinaNombre] = useState('');
  const [ejerciciosPlanificados, setEjerciciosPlanificados] = useState([]);
  const [progresoSeries, setProgresoSeries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [serieParaRegistrar, setSerieParaRegistrar] = useState(null);
  const [isResumenOpen, setIsResumenOpen] = useState(false);
  const [horaInicioSesion, setHoraInicioSesion] = useState(null);
  // --- Estados para Crono y Guía ---
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [showGuiaEntreno, setShowGuiaEntreno] = useState(false);

  // --- Estado para el modal de salida ---
  const [isConfirmarSalirOpen, setIsConfirmarSalirOpen] = useState(false);

  // Efecto Carga (Guarda hora de inicio)
  useEffect(() => {
    setHoraInicioSesion(new Date()); 

    const cargarDatosSesion = async () => {
      setLoading(true); setError(null);
      const token = localStorage.getItem('movium_token');
      if (!token) { setError("Error de autenticación."); setLoading(false); return; }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      try {
        const resInfo = fetch(`http://localhost/programacion/TFG/movium/backend/api/get_rutina_info.php?id=${rutinaId}`, { headers });
        const resEjercicios = fetch(`http://localhost/programacion/TFG/movium/backend/api/get_ejercicios_de_rutina.php?id=${rutinaId}`, { headers });

        const [infoResponse, ejerciciosResponse] = await Promise.all([resInfo, resEjercicios]);
        const dataInfo = await infoResponse.json();
        if (!infoResponse.ok) throw new Error(dataInfo.mensaje || "Error info rutina.");
        const dataEjercicios = await ejerciciosResponse.json();
        if (!ejerciciosResponse.ok) throw new Error(dataEjercicios.mensaje || "Error ejercicios rutina.");

        setRutinaNombre(dataInfo.nombre);
        setEjerciciosPlanificados(dataEjercicios);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    cargarDatosSesion();
  }, [rutinaId]);

  // --- useEffect para el cronómetro ---
  useEffect(() => {
    if (!horaInicioSesion) return;

    const intervalId = setInterval(() => {
      const ahora = new Date();
      const segundos = Math.floor((ahora - horaInicioSesion) 
/ 1000);
      setTiempoTranscurrido(segundos);
    }, 1000);

    return () => clearInterval(intervalId);

  }, [horaInicioSesion]);

  // --- USEEFFECT PARA LA GUÍA ---
  useEffect(() => {
    if (loading || error) return; 
    try {
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      
      if (storedUser && !storedUser.ha_visto_guia_entreno && storedUser.ha_visto_guia_rutina) {
        
        const timer = setTimeout(() => {
          setShowGuiaEntreno(true);
        }, 500); // medio segundo
        
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error("Error al leer datos de usuario para la guía de Entreno:", e);
    }
  }, [loading, error]);
  
  // Lógica Resumen
  const resumenWorkout = useMemo(() => {
    if (!ejerciciosPlanificados || ejerciciosPlanificados.length === 0) return [];
    const seriesCompletadas = Object.values(progresoSeries).filter(Boolean);
    if (seriesCompletadas.length === 0) return [];
    const ejerciciosAgrupados = {};
    for (const serie of seriesCompletadas) {
      if (!serie.ejercicio_id) continue;
      const id = serie.ejercicio_id;
      if (!ejerciciosAgrupados[id]) { ejerciciosAgrupados[id] = []; }
      ejerciciosAgrupados[id].push(serie);
    }

    const resultadoFinal = [];
    for (const ejPlanificado of ejerciciosPlanificados) {
      const id = ejPlanificado.ejercicio_id;
      if (ejerciciosAgrupados[id]) {
        const seriesOrdenadas = ejerciciosAgrupados[id].sort((a, b) => a.num_serie - b.num_serie);
        resultadoFinal.push({
          nombre: ejPlanificado.nombre_ejercicio,
          tipo: ejPlanificado.tipo,
          series: seriesOrdenadas
        });
      }
    }
    return resultadoFinal;
  }, [progresoSeries, ejerciciosPlanificados]);

  // --- HANDLER CERRAR GUÍA ---
  const handleCerrarGuiaEntreno = () => {
    try {
      marcarGuiaComoVista('entreno');
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      if (storedUser) {
        const updatedUser = { ...storedUser, ha_visto_guia_entreno: true };
        localStorage.setItem('movium_user', JSON.stringify(updatedUser));
      }
      setShowGuiaEntreno(false);
    } catch (e) {
      console.error("Error al cerrar la guía de Entreno:", e);
      setShowGuiaEntreno(false);
    }
  };

  // Handlers
  const handleToggleSerie = (ej, objetivo) => {
    const key = `${ej.id}_${objetivo.num_serie}`;
    setProgresoSeries(prev => {
      const newState = { ...prev };
      if (newState[key]) {
        delete newState[key];
      } else {
        let repsRealizadasDefault = null;
        let fueAlFalloDefault = false;
        if (ej.tipo !== 'cardio') {
          if (objetivo.tipo_rep_objetivo === 'fallo') {
            fueAlFalloDefault = true;
            repsRealizadasDefault = null;
          } else {
            fueAlFalloDefault = false;
            repsRealizadasDefault = objetivo.reps_min_objetivo || null;
          }
        }
        newState[key] = {
          ejercicio_id: ej.ejercicio_id,
          orden_ejercicio_rutina: ej.orden || 1,
          num_serie: objetivo.num_serie,
          repeticiones_realizadas: repsRealizadasDefault,
          fue_al_fallo: fueAlFalloDefault,
          peso_kg_usado: objetivo.peso_kg_objetivo || null,
          tiempo_min_realizado: objetivo.tiempo_min_objetivo || null,
          distancia_km_realizada: objetivo.distancia_km_objetivo || null,
          notas_serie: null
        };
      }
      return newState;
    });
  };

  const handleEditSerieClick = (ej, objetivoOriginal) => {
    const key = `${ej.id}_${objetivoOriginal.num_serie}`;
    const datosActuales = progresoSeries[key];
    setSerieParaRegistrar({
      ejercicio: ej,
      tipo: ej.tipo,
      objetivoOriginal: objetivoOriginal,
      datosGuardados: datosActuales,
      numSerie: objetivoOriginal.num_serie,
      key: key,
      notas: datosActuales?.notas_serie || ''
    });
  };

  const handleGuardarSerie = (datosReales) => {
    if (!serieParaRegistrar) return;
    const { ejercicio, numSerie, key } = serieParaRegistrar;
    const { notas, ...datosDeLaSerie } = datosReales;
    const datosParaEstado = {
      ejercicio_id: ejercicio.ejercicio_id,
      orden_ejercicio_rutina: ejercicio.orden || 1,
      num_serie: numSerie,
      repeticiones_realizadas: datosDeLaSerie.reps,
      fue_al_fallo: datosDeLaSerie.fue_al_fallo,
      peso_kg_usado: datosDeLaSerie.peso,
      tiempo_min_realizado: datosDeLaSerie.tiempo,
      distancia_km_realizada: datosDeLaSerie.dist,
      notas_serie: notas || null
    };
    setProgresoSeries(prev => ({ ...prev, [key]: datosParaEstado }));
    setSerieParaRegistrar(null);
  };

  const handleFinalizarClick = () => {
    setError(null);
    const seriesCompletadas = Object.values(progresoSeries).filter(Boolean);
    if (seriesCompletadas.length === 0) {
      // ESTE es el error que quieres mover
      setError("No puedes finalizar un entrenamiento sin haber completado al menos una serie.");
      return; 
    }
    setIsResumenOpen(true);
  };

  const handleConfirmarFinalizar = async (notasDeLaSesion) => {
    setIsFinishing(true); setError(null);
    const seriesCompletadas = Object.values(progresoSeries).filter(Boolean);
    const token = localStorage.getItem('movium_token');
    if (!token) {
      setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
      setIsFinishing(false);
      setIsResumenOpen(false);
      return;
    }

    const datosAEnviar = {
      rutina_id: parseInt(rutinaId, 10),
      series: seriesCompletadas,
      notas_sesion: notasDeLaSesion,
      fecha_inicio: horaInicioSesion
    };
    try {
      const res = await fetch(`http://localhost/programacion/TFG/movium/backend/api/finalizar_entrenamiento.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datosAEnviar)
       });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.mensaje || "Error al guardar el entrenamiento.");
      }
      setIsResumenOpen(false);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setIsResumenOpen(false);
    } finally {
      setIsFinishing(false);
    }
  };

  // --- Handlers para el botón "Volver" ---
  const handleVolverClick = () => {
    if (Object.keys(progresoSeries).length > 0 && !isFinishing) {
      setIsConfirmarSalirOpen(true);
    } else if (!isFinishing) {
      navigate('/');
    }
  };

  const handleConfirmarSalir = () => {
    setIsConfirmarSalirOpen(false);
    navigate('/');
  };
  
  // Renderizado
  if (loading) return <div className="workout-session-container"><p className="subtitle">Cargando sesión...</p></div>;
  if (error && !loading && ejerciciosPlanificados.length === 0) {
    return (
      <div className="workout-session-container">
        <button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver</button>
        <div className="message" style={{ marginTop: '1rem' }}>{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="workout-session-container">
        
        <button 
          className="btn-volver" 
          onClick={handleVolverClick}
          disabled={isFinishing}
        >
          &larr; Salir sin guardar
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
          <img src={iconoEntrenar} alt="" width="64" height="64" />
          <h2>{rutinaNombre}</h2>
         </div>
        <p className="subtitle" style={{ textAlign: 'center' }}>
          Marca las series completadas y edita si es necesario.
        </p>

        {/* --- CRONÓMETRO --- */}
        {ejerciciosPlanificados.length > 0 && (
          <div className="cronometro-sesion" title="Tiempo de entrenamiento">
            <img src={iconoReloj} alt="" className="cronometro-icono" />
            <span>{formatTiempo(tiempoTranscurrido)}</span>
          </div>
        )}

        {/* --- BLOQUE DE ERROR (MOVIMOS EL OTRO AQUÍ) --- */}
        {/* {error && <div className="message" style={{ marginTop: '0', marginBottom: '1rem' }}>{error}</div>} */} {/* <-- ELIMINADO DE AQUÍ */}

        <div className="ejercicios-lista-sesion">
          {ejerciciosPlanificados.length === 0 ?
(
            <p className="no-series-msg">Esta rutina no tiene ejercicios definidos.</p>
          ) : (
            ejerciciosPlanificados.map((ej, index) => (
              <div key={ej.id} className="ejercicio-card-sesion">
                <h3>{index + 1}. {ej.nombre_ejercicio}</h3>

                <div className="series-lista-vertical">
    
                   {!ej.objetivos || ej.objetivos.length === 0 ? (
                    <p className="no-series-msg">No hay objetivos definidos.</p>
                  ) : (
                    ej.objetivos.map((objetivo) => {
              
                       const serieNum = objetivo.num_serie;
                      const key = `${ej.id}_${serieNum}`;
                      const serieReal = progresoSeries[key];
                      const isCompleted = !!serieReal;

              
                       const tooltipText = formatTooltip(objetivo, serieReal, ej.tipo);
                      const textoVisible = formatObjetivoNatural(objetivo, ej.tipo);
                      return (
                        <div
              
                           key={key}
                          className={`serie-fila ${isCompleted ?
 'completed' : ''}`}
                          title={tooltipText}
                        >
                          <div className="serie-info-principal">
                     
                             <span className="serie-numero">S{serieNum}:</span>
                            <span className="serie-objetivo-texto">{textoVisible}</span>
                          </div>
                          <div className="serie-acciones-fila">
          
                             <button
                              className={`btn-check-serie ${isCompleted ?
 'completed' : ''}`}
                              onClick={() => handleToggleSerie(ej, objetivo)}
                              disabled={isFinishing}
                              aria-label={isCompleted ?
 'Desmarcar serie como completada' : 'Marcar serie como completada'}
                            >
                              {isCompleted ?
 '✓' : ''}
                            </button>
                            <button
                              className="btn-edit-serie-fila"
            
                               onClick={() => handleEditSerieClick(ej, objetivo)}
                              disabled={isFinishing}
                              aria-label="Editar detalles de la serie"
               
                             >
                              ✏️
                            </button>
                          </div>
   
                         </div>
                      );
})
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- ZONA DE ERROR MOVIDA --- */}
        {/* Aquí es donde aparecerá el error "No puedes finalizar..." */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          {error && <div className="message">{error}</div>}
        </div>
        {/* --- FIN ZONA DE ERROR --- */}


        {ejerciciosPlanificados.length > 0 && (
          
           <button className="btn-start btn-finalizar" onClick={handleFinalizarClick} disabled={isFinishing}>
            {isFinishing ? 'Guardando...' : 'Finalizar Entrenamiento'}
          </button>
        )}
      </div>

      {/* Modales */}
      <RegistrarSerieModal
        isOpen={serieParaRegistrar !== null}
        onClose={() => setSerieParaRegistrar(null)}
        datosSerie={serieParaRegistrar}
        onGuardar={handleGuardarSerie}
     
       />
      <ResumenFinalModal
        isOpen={isResumenOpen}
        onClose={() => { if (!isFinishing) setIsResumenOpen(false); }}
        onConfirm={handleConfirmarFinalizar}
        isFinishing={isFinishing}
        resumenDatos={resumenWorkout}
      />
      
      <ConfirmarSalirModal
        isOpen={isConfirmarSalirOpen}
        onClose={() => setIsConfirmarSalirOpen(false)}
        onConfirm={handleConfirmarSalir}
      />

      {/* Modal de Guía (existente) */}
      <GuiaModal
        isOpen={showGuiaEntreno}
        onClose={handleCerrarGuiaEntreno}
        titulo="¡A registrar!"
      >
        <p>¡Aquí es donde la magia ocurre! Para cada serie de tu plan:</p>
        <ul style={{ marginTop: '0.5rem', marginBottom: '1rem', paddingLeft: '1.2rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            Haz clic en el <strong>círculo (✓)</strong> para marcarla como completada <strong>exactamente como la planeaste</strong>.
          </li>
          <li>
            Haz clic en el <strong>lápiz (✏️)</strong> si necesitas <strong>ajustar lo que hiciste en realidad</strong> (cambiar el peso, las repeticiones, o añadir una nota).
          </li>
        </ul>
        <p>¡Es normal no rendir siempre igual! Registrar tus datos reales es clave para medir tu progreso.</p>
      </GuiaModal>
    </>
  );
}

export default WorkoutSession;