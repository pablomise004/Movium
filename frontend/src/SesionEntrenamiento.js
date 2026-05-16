// Sesion de entrenamiento

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SesionEntrenamiento.css';
import RegistrarSerieModal from './components/RegistrarSerieModal';
import ResumenFinalModal from './components/ResumenFinalModal';
import iconoEntrenar from './assets/entrenar.png';
import iconoReloj from './assets/reloj.png';
import { API_BASE_URL } from './configuracion';
import { formatearObjetivo, formatearTooltip } from './utils/formato';

function WorkoutSession() {
  const params = useParams();
  const rutinaId = params.id;

  const formatearTiempo = (totalSegundos) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    const hStr = String(horas).padStart(2, '0');
    const mStr = String(minutos).padStart(2, '0');
    const sStr = String(segundos).padStart(2, '0');
    if (horas > 0) return `${hStr}:${mStr}:${sStr}`;
    return `${mStr}:${sStr}`;
  };
  const navigate = useNavigate();
  const intervaloRef = useRef(null);
  const [nombreRutina, setNombreRutina] = useState('');
  const [ejercicios, setEjercicios] = useState([]);
  const [progreso, setProgreso] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [serieEditar, setSerieEditar] = useState(null);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [inicioSesion, setInicioSesion] = useState(null);
  const [segundos, setSegundos] = useState(0);
  // Lista de ejercicios con sus series completadas, para el modal de resumen final
  const [resumenWorkout, setResumenWorkout] = useState([]);

  // Carga los datos de la rutina al entrar y guarda la hora de inicio
  useEffect(() => {
    setInicioSesion(new Date());

    const cargarDatosSesion = async () => {
      setCargando(true); setError(null);
      const token = localStorage.getItem('movium_token');
      if (!token) { setError("Error de autenticación."); setCargando(false); return; }
      const cabeceras = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      try {
        const respuestaInfo = await fetch(`${API_BASE_URL}get_rutina_info.php?id=${rutinaId}`, { headers: cabeceras });
        const datosInfo = await respuestaInfo.json();
        if (!respuestaInfo.ok) throw new Error(datosInfo.mensaje || "Error info rutina.");

        const respuestaEjercicios = await fetch(`${API_BASE_URL}get_ejercicios_de_rutina.php?id=${rutinaId}`, { headers: cabeceras });
        const datosEjercicios = await respuestaEjercicios.json();
        if (!respuestaEjercicios.ok) throw new Error(datosEjercicios.mensaje || "Error ejercicios rutina.");

        setNombreRutina(datosInfo.nombre);
        setEjercicios(datosEjercicios);
        console.log('Sesión cargada:', datosInfo);
      } catch (error) { setError(error.message); } finally { setCargando(false); }
    };
    cargarDatosSesion();
  }, [rutinaId]);

  useEffect(() => {
    if (!inicioSesion) return;
    intervaloRef.current = setInterval(() => {
      const ahora = new Date();
      setSegundos(Math.floor((ahora - inicioSesion) / 1000));
    }, 1000);
    return () => clearInterval(intervaloRef.current);
  }, [inicioSesion]);

  // Marca o desmarca una serie como completada
  // Si ya estaba marcada la desmarca (pone null), si no la marca con valores por defecto
  const alternarSerie = (ej, objetivo) => {
    // La clave combina el id del ejercicio y el numero de serie para identificarla
    const clave = `${ej.id}_${objetivo.num_serie}`;
    setProgreso(prev => {
      const nuevoEstado = { ...prev };
      if (nuevoEstado[clave]) {
        // Si ya existe la borramos (desmarcar)
        nuevoEstado[clave] = null;
      } else {
        // Si no existe la creamos con los valores del objetivo como punto de partida
        let repsDefault = null;
        let falloDefault = false;
        if (ej.tipo !== 'cardio') {
          falloDefault = objetivo.tipo_rep_objetivo === 'fallo';
          repsDefault = falloDefault ? null : (objetivo.reps_min_objetivo || null);
        }
        nuevoEstado[clave] = {
          ejercicio_id: ej.ejercicio_id,
          orden_ejercicio_rutina: ej.orden || 1,
          num_serie: objetivo.num_serie,
          repeticiones_realizadas: repsDefault,
          fue_al_fallo: falloDefault,
          peso_kg_usado: objetivo.peso_kg_objetivo || null,
          tiempo_min_realizado: objetivo.tiempo_min_objetivo || null,
          distancia_km_realizada: objetivo.distancia_km_objetivo || null,
          notas_serie: null
        };
      }
      return nuevoEstado;
    });
  };

  // Abre el modal de edición de una serie
  const abrirEditorSerie = (ej, objetivoOriginal) => {
    const clave = `${ej.id}_${objetivoOriginal.num_serie}`;
    const datosActuales = progreso[clave];
    setSerieEditar({
      ejercicio: ej,
      tipo: ej.tipo,
      objetivoOriginal: objetivoOriginal,
      datosGuardados: datosActuales,
      numSerie: objetivoOriginal.num_serie,
      key: clave,
      notas: datosActuales?.notas_serie || ''
    });
  };

  // Guarda los datos editados de una serie en el estado de progreso
  const guardarSerie = (datosReales) => {
    if (!serieEditar) return;
    const { ejercicio, numSerie, key } = serieEditar;
    const datosParaEstado = {
      ejercicio_id: ejercicio.ejercicio_id,
      orden_ejercicio_rutina: ejercicio.orden || 1,
      num_serie: numSerie,
      repeticiones_realizadas: datosReales.reps,
      fue_al_fallo: datosReales.fue_al_fallo,
      peso_kg_usado: datosReales.peso,
      tiempo_min_realizado: datosReales.tiempo,
      distancia_km_realizada: datosReales.dist,
      notas_serie: datosReales.notas || null
    };
    setProgreso({ ...progreso, [key]: datosParaEstado });
    setSerieEditar(null);
  };

  // Prepara el resumen del entrenamiento y abre el modal de confirmacion
  const clicFinalizar = () => {
    setError(null);
    // Object.values coge todos los valores del objeto progreso (que pueden ser null si se desmarcaron)
    const seriesCompletadas = Object.values(progreso).filter(s => s !== null);
    if (seriesCompletadas.length === 0) {
      setError("No puedes finalizar un entrenamiento sin haber completado al menos una serie.");
      return;
    }

    // Agrupar las series por ejercicio_id para poder mostrarlas organizadas en el resumen
    // Tuve que hacerlo asi porque las series vienen mezcladas en el objeto progreso
    const ejerciciosAgrupados = {};
    for (const serie of seriesCompletadas) {
      if (!serie.ejercicio_id) continue;
      const id = serie.ejercicio_id;
      if (!ejerciciosAgrupados[id]) {
        ejerciciosAgrupados[id] = [];
      }
      ejerciciosAgrupados[id].push(serie);
    }

    // Recorrer los ejercicios en orden para que el resumen salga en el mismo orden que la rutina
    const resultadoFinal = [];
    for (const ejPlanificado of ejercicios) {
      const id = ejPlanificado.ejercicio_id;
      if (ejerciciosAgrupados[id]) {
        resultadoFinal.push({
          nombre: ejPlanificado.nombre_ejercicio,
          tipo: ejPlanificado.tipo,
          series: ejerciciosAgrupados[id].sort((a, b) => a.num_serie - b.num_serie)
        });
      }
    }
    setResumenWorkout(resultadoFinal);
    setResumenAbierto(true);
  };

  // Envía el entrenamiento al servidor
  const confirmarFinalizar = async (notasDeLaSesion) => {
    setGuardando(true); setError(null);
    const seriesCompletadas = Object.values(progreso).filter(s => s !== null);
    const token = localStorage.getItem('movium_token');
    if (!token) {
      setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
      setGuardando(false);
      setResumenAbierto(false);
      return;
    }

    const datosAEnviar = {
      rutina_id: parseInt(rutinaId, 10),
      series: seriesCompletadas,
      notas_sesion: notasDeLaSesion
    };
    try {
      const res = await fetch(`${API_BASE_URL}finalizar_entrenamiento.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datosAEnviar)
      });
      const datos = await res.json();
      if (!res.ok) {
        throw new Error(datos.mensaje || "Error al guardar el entrenamiento.");
      }
      setGuardando(false);
      setResumenAbierto(false);
      navigate('/');
    } catch (error) {
      setError(error.message);
      setGuardando(false);
      setResumenAbierto(false);
    }
  };

  const clicVolver = () => {
    if (!guardando) navigate('/');
  };

  if (cargando) return <div className="workout-session-container"><p className="subtitle">Cargando sesión...</p></div>;
  if (error && !cargando && ejercicios.length === 0) {
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
          onClick={clicVolver}
          disabled={guardando}
        >
          &larr; Salir sin guardar
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
          <img src={iconoEntrenar} alt="" width="64" height="64" />
          <h2>{nombreRutina}</h2>
        </div>
        <p className="subtitle" style={{ textAlign: 'center' }}>
          Marca las series completadas y edita si es necesario.
        </p>

        {ejercicios.length > 0 && (
          <div className="cronometro-sesion" title="Tiempo de entrenamiento">
            <img src={iconoReloj} alt="" className="cronometro-icono" />
            <span>{formatearTiempo(segundos)}</span>
          </div>
        )}

        <div className="ejercicios-lista-sesion">
          {ejercicios.length === 0 ? (
            <p className="no-series-msg">Esta rutina no tiene ejercicios definidos.</p>
          ) : (
            ejercicios.map((ej, index) => (
              <div key={ej.id} className="ejercicio-card-sesion">
                <h3>{index + 1}. {ej.nombre_ejercicio}</h3>

                <div className="series-lista-vertical">
                  {!ej.objetivos || ej.objetivos.length === 0 ? (
                    <p className="no-series-msg">No hay objetivos definidos.</p>
                  ) : (
                    ej.objetivos.map((objetivo) => {
                      const serieNum = objetivo.num_serie;
                      const clave = `${ej.id}_${serieNum}`;
                      const serieReal = progreso[clave];
                      const completada = !!serieReal;
                      const tooltipText = formatearTooltip(objetivo, serieReal, ej.tipo);
                      const textoVisible = formatearObjetivo(objetivo, ej.tipo);
                      return (
                        <div
                          key={clave}
                          className={`serie-fila ${completada ? 'completed' : ''}`}
                          title={tooltipText}
                        >
                          <div className="serie-info-principal">
                            <span className="serie-numero">S{serieNum}:</span>
                            <span className="serie-objetivo-texto">{textoVisible}</span>
                          </div>
                          <div className="serie-acciones-fila">
                            <button
                              className={`btn-check-serie ${completada ? 'completed' : ''}`}
                              onClick={() => alternarSerie(ej, objetivo)}
                              disabled={guardando}
                            >
                              {completada ? '✓' : ''}
                            </button>
                            <button
                              className="btn-edit-serie-fila"
                              onClick={() => abrirEditorSerie(ej, objetivo)}
                              disabled={guardando}
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

        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          {error && <div className="message">{error}</div>}
        </div>

        {ejercicios.length > 0 && (
          <button className="btn-start btn-finalizar" onClick={clicFinalizar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Finalizar Entrenamiento'}
          </button>
        )}
      </div>

      <RegistrarSerieModal
        isOpen={serieEditar !== null}
        onClose={() => setSerieEditar(null)}
        datosSerie={serieEditar}
        onGuardar={guardarSerie}
      />
      <ResumenFinalModal
        isOpen={resumenAbierto}
        onClose={() => { if (!guardando) setResumenAbierto(false); }}
        onConfirm={confirmarFinalizar}
        isFinishing={guardando}
        resumenDatos={resumenWorkout}
      />

    </>
  );
}

export default WorkoutSession;
