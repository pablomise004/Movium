// ---- frontend/src/RutinaDetalle.js (CORREGIDO - Persistencia de inputs y validación) ----

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RutinaDetalle.css';
import SelectorEjerciciosModal from './components/SelectorEjerciciosModal';
import EditarEjercicioModal from './components/EditarEjercicioModal';
import ConfirmarBorradoModal from './components/ConfirmarBorradoModal';
import ConfirmarBorrarEjercicioModal from './components/ConfirmarBorrarEjercicioModal';
import iconoCrear from './assets/crear-ejercicios.png';
import GuiaModal from './components/GuiaModal';

// --- Helper de Perfil.js: Bloquea teclas (e, +, -, etc.) ---
const handleNumericKeyDown = (e, allowDecimal = false) => {
  // Teclas siempre permitidas
  if ([8, 9, 37, 39, 46, 35, 36].includes(e.keyCode)) {
    return;
  }
  // Bloquear 'e', '+', '-'
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
    return;
  }
  // Si NO se permite decimal, bloquear '.' y ','
  if (!allowDecimal && ['.', ','].includes(e.key)) {
    e.preventDefault();
    return;
  }
};

/**
 * Componente interno para el formulario de *creación* de series de Fuerza.
 */
const FormularioFuerza = ({
  objetivos,
  setObjetivos,
  // Estados
  tipoRep, setTipoRep,
  repsMin,
  repsMax,
  peso,
  descanso,
  // Handler
  onFormChange
}) => {

  // Borra una serie de la lista temporal de 'objetivosParaAgregar'
  const handleRemoveSerie = (num_serie) => {
    setObjetivos(objetivos.filter(s => s.num_serie !== num_serie).map((s, i) => ({ ...s, num_serie: i + 1 })));
  };

  // Formatea la previsualización de la serie en la lista temporal
  const formatPreviewObjetivo = (obj) => {
    let repStr = "";
    if (obj.tipo_rep_objetivo === 'fallo') {
      repStr = `Al Fallo (~${obj.reps_min_objetivo || '?'}r)`;
    } else if (obj.tipo_rep_objetivo === 'rango') {
      repStr = `${obj.reps_min_objetivo || '?'}-${obj.reps_max_objetivo || '?'} reps`;
    } else {
      repStr = `${obj.reps_min_objetivo || '?'} reps`;
    }
    let pesoStr = obj.peso_kg_objetivo ?
      ` con ${obj.peso_kg_objetivo}kg` : '';
    let descansoStr = obj.descanso_seg_post ?
      ` (${obj.descanso_seg_post}s)` : '';
    return `${repStr}${pesoStr}${descansoStr}`;
  };

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      {/* Lista de previsualización de series añadidas */}
      <div className="lista-series-preview">
        {objetivos.length === 0 ? (
          <p className="subtitle" style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>Añade tu primera serie...</p>
        ) : (
          objetivos.map(s => (
            <div key={s.num_serie} className="serie-preview-item">
              <span><strong>Serie {s.num_serie}:</strong> {formatPreviewObjetivo(s)}</span>
              <button type="button" className="btn-delete-small" onClick={() => handleRemoveSerie(s.num_serie)} aria-label={`Borrar serie ${s.num_serie}`}>Borrar</button>
            </div>
          ))
        )}
      </div>

      {/* Inputs para añadir la SIGUIENTE serie */}
      <div className="form-grid" style={{ borderTop: '1px solid var(--input-border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
        <div className="form-rep-grid" style={{ gridColumn: 'span 3' }}>
          <div className="form-group-small">
            <label htmlFor={`tipo-rep-input-${objetivos.length + 1}`}>Tipo Reps</label>
            <select id={`tipo-rep-input-${objetivos.length + 1}`} value={tipoRep} onChange={(e) => setTipoRep(e.target.value)}>
              <option value="fijo">Fijo</option>
              <option value="rango">Rango</option>
              <option value="fallo">Al fallo</option>
            </select>
          </div>
          <div className="form-group-small">
            <label htmlFor={`reps-input-${objetivos.length + 1}`}>
              {tipoRep === 'rango' ? 'Reps Mín' : (tipoRep === 'fallo' ? 'Reps Aprox.' : 'Reps')}
            </label>
            <input
              id={`reps-input-${objetivos.length + 1}`}
              type="number" // Mantenemos number por el teclado móvil
              min={tipoRep === 'fallo' ? "0" : "1"}
              value={repsMin}
              placeholder={tipoRep === 'fallo' ? "Obligatorio" : "Obligatorio"}
              // --- ¡CAMBIO! Quitamos 'required' ---
              name="repsMin"
              onChange={onFormChange}
              onKeyDown={(e) => handleNumericKeyDown(e, false)} // No decimales
            />
          </div>
          {tipoRep === 'rango' && (
            <div className="form-group-small">
              <label htmlFor={`reps-max-input-${objetivos.length + 1}`}>Reps Máx</label>
              <input
                id={`reps-max-input-${objetivos.length + 1}`}
                type="number"
                min={(parseInt(repsMin, 10) || 0) + 1}
                value={repsMax}
                placeholder="Obligatorio"
                // --- ¡CAMBIO! Quitamos 'required' ---
                name="repsMax"
                onChange={onFormChange}
                onKeyDown={(e) => handleNumericKeyDown(e, false)} // No decimales
              />
            </div>
          )}
        </div>
        <div className="form-group-small">
          <label htmlFor={`peso-input-${objetivos.length + 1}`}>Peso (kg)</label>
          <input
            id={`peso-input-${objetivos.length + 1}`}
            type="number" // Mantenemos number
            step="0.01" // Permitimos decimales
            min="0"
            value={peso}
            placeholder="Obligatorio"
            // --- ¡CAMBIO! Quitamos 'required' ---
            name="peso"
            onChange={onFormChange}
            onKeyDown={(e) => handleNumericKeyDown(e, true)} // SÍ decimales
          />
        </div>
        <div className="form-group-small">
          <label htmlFor={`descanso-input-${objetivos.length + 1}`}>Descanso (s)</label>
          <input
            id={`descanso-input-${objetivos.length + 1}`}
            type="number"
            min="0"
            value={descanso}
            placeholder="Opcional"
            name="descanso"
            onChange={onFormChange}
            onKeyDown={(e) => handleNumericKeyDown(e, false)} // No decimales
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Componente interno para el formulario de *creación* de intervalos de Cardio.
 */
const FormularioCardio = ({
  objetivos,
  setObjetivos,
  // Estados
  tiempo,
  distancia,
  descanso,
  // Handler
  onFormChange
}) => {

  // Borra un intervalo de la lista temporal
  const handleRemoveIntervalo = (num_serie) => {
    setObjetivos(objetivos.filter(s => s.num_serie !== num_serie).map((s, i) => ({ ...s, num_serie: i + 1 })));
  };

  // Formatea la previsualización del intervalo
  const formatPreviewIntervalo = (obj) => {
    const partes = [];
    if (obj.tiempo_min_objetivo) partes.push(`${obj.tiempo_min_objetivo} min`);
    if (obj.distancia_km_objetivo) partes.push(`${obj.distancia_km_objetivo} km`);
    let texto = partes.join(' / ');
    if (obj.descanso_seg_post) texto += ` (${obj.descanso_seg_post}s descanso)`;
    return texto || "Intervalo vacío";
  };

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      {/* Lista de previsualización de intervalos añadidos */}
      <div className="lista-series-preview">
        {objetivos.length === 0 ? (
          <p className="subtitle" style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>Añade tu primer intervalo...</p>
        ) : (
          objetivos.map(s => (
            <div key={s.num_serie} className="serie-preview-item">
              <span><strong>Intervalo {s.num_serie}:</strong> {formatPreviewIntervalo(s)}</span>
              <button type="button" className="btn-delete-small" onClick={() => handleRemoveIntervalo(s.num_serie)} aria-label={`Borrar intervalo ${s.num_serie}`}>Borrar</button>
            </div>
          ))
        )}
      </div>

      {/* Inputs para añadir el SIGUIENTE intervalo */}
      <div className="form-grid" style={{ borderTop: '1px solid var(--input-border-color)', paddingTop: '1rem', marginTop: '1rem', alignItems: 'end' }}>
        <div className="form-group-small">
          <label htmlFor={`tiempo-input-${objetivos.length + 1}`}>Tiempo (Min)</label>
          <input
            id={`tiempo-input-${objetivos.length + 1}`}
            type="number"
            min="1"
            step="1"
            value={tiempo}
            placeholder="Obligatorio"
            // --- ¡CAMBIO! Quitamos 'required' ---
            name="tiempoCardio"
            onChange={onFormChange}
            onKeyDown={(e) => handleNumericKeyDown(e, false)} // No decimales
          />
        </div>
        <div className="form-group-small">
          <label htmlFor={`distancia-input-${objetivos.length + 1}`}>Distancia (km)</label>
          <input
            id={`distancia-input-${objetivos.length + 1}`}
            type="number"
            min="0.1"
            step="0.01" // Permitimos 2 decimales
            value={distancia}
            placeholder="Obligatorio"
            // --- ¡CAMBIO! Quitamos 'required' ---
            name="distanciaCardio"
            onChange={onFormChange}
            onKeyDown={(e) => handleNumericKeyDown(e, true)} // SÍ decimales
          />
        </div>
        <div className="form-group-small">
          <label htmlFor={`descanso-cardio-input-${objetivos.length + 1}`}>Descanso (s)</label>
          <input
            id={`descanso-cardio-input-${objetivos.length + 1}`}
            type="number"
            min="0"
            value={descanso}
            placeholder="Opcional"
            name="descansoCardio"
            onChange={onFormChange}
            onKeyDown={(e) => handleNumericKeyDown(e, false)} // No decimales
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Función helper para formatear el objetivo (serie/intervalo)
 * para mostrar en la *tabla* principal de ejercicios guardados.
 */
const formatObjetivoTabla = (obj, tipo) => {
  if (tipo === 'cardio') {
    const metricas = [];
    if (obj.tiempo_min_objetivo) metricas.push(`${obj.tiempo_min_objetivo} min`);
    if (obj.distancia_km_objetivo) metricas.push(`${obj.distancia_km_objetivo} km`);
    let texto = metricas.join(' / ');
    if (obj.descanso_seg_post) texto += ` (${obj.descanso_seg_post}s)`;
    return <span><strong>Int. {obj.num_serie}:</strong> {texto || "Objetivo no especificado"}</span>;
  }
  // Fuerza
  let repStr = "";
  if (obj.tipo_rep_objetivo === 'fallo') {
    repStr = `Al Fallo (~${obj.reps_min_objetivo || '?'}r)`;
  } else if (obj.tipo_rep_objetivo === 'rango') {
    repStr = `${obj.reps_min_objetivo || '?'}-${obj.reps_max_objetivo || '?'}r`;
  } else {
    repStr = `${obj.reps_min_objetivo || '?'}r`;
  }
  return (
    <span>
      <strong>S{obj.num_serie}:</strong> {repStr}
      {obj.peso_kg_objetivo != null ? ` con ${String(obj.peso_kg_objetivo)}kg` : ''}
      {obj.descanso_seg_post != null ? ` (${String(obj.descanso_seg_post)}s)` : ''}
    </span>
  );
};

/**
 * Componente principal de la página de detalles de una rutina.
 */
function RutinaDetalle() {

  const { id: rutinaId } = useParams();
  const navigate = useNavigate();
  // Estados generales de datos
  const [rutinaInfo, setRutinaInfo] = useState(null);
  const [ejerciciosEnRutina, setEjerciciosEnRutina] = useState([]);
  const [ejerciciosMaestra, setEjerciciosMaestra] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [exerciseSuccessMsg, setExerciseSuccessMsg] = useState(null);

  // Estados de Modales
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);
  const [ejercicioParaEditar, setEjercicioParaEditar] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGuiaRutina, setShowGuiaRutina] = useState(false);

  // Estados Formulario "Añadir Ejercicio"
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null);
  const [objetivosParaAgregar, setObjetivosParaAgregar] = useState([]);
  const [apiErrorFormAgregar, setApiErrorFormAgregar] = useState(null);

  // Estados para inputs CONTROLADOS
  // Estados Inputs Fuerza (para añadir)
  const [tipoRepState, setTipoRepState] = useState("rango");
  const [repsMinState, setRepsMinState] = useState("");
  const [repsMaxState, setRepsMaxState] = useState("");
  const [pesoState, setPesoState] = useState("");
  const [descansoState, setDescansoState] = useState("");
  // Estados Inputs Cardio (para añadir)
  const [tiempoCardioState, setTiempoCardioState] = useState("");
  const [distanciaCardioState, setDistanciaCardioState] = useState("");
  const [descansoCardioState, setDescansoCardioState] = useState("");


  // Estados Formulario "Editar Rutina Info"
  const [editedName, setEditedName] = useState('');
  const [editedDays, setEditedDays] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [apiErrorFormEditar, setApiErrorFormEditar] = useState(null);
  const [editedOrden, setEditedOrden] = useState(0);
  const [editedColor, setEditedColor] = useState("");

  // Constantes y Refs
  const MAX_TITULO_LENGTH = 38;
  const MAX_DIAS_LENGTH = 60;
  const successTimeoutRef = useRef(null);
  const exerciseSuccessTimeoutRef = useRef(null);

  // Estados Modal "Borrar Ejercicio"
  const [ejercicioAEliminar, setEjercicioAEliminar] = useState(null);
  const [isConfirmarBorrarEjercicioOpen, setIsConfirmarBorrarEjercicioOpen] = useState(false);
  const [isDeletingEjercicio, setIsDeletingEjercicio] = useState(false);


  // Handler de validación para el formulario "Añadir"
  const handleAddFormChange = (e) => {
    const { name, value } = e.target;

    // Reglas de Regex
    const max3Int = /^\d{0,3}$/; // Máx 3 dígitos enteros
    const max4Int = /^\d{0,4}$/; // Máx 4 dígitos enteros
    const decimal_5_2 = /^(|\d{1,3}([.,]\d{0,2})?)$/; // Máx 999.99 (6 chars total)

    // Limpiar mensajes de error al escribir
    setApiErrorFormAgregar(null);

    switch (name) {
      // --- FUERZA ---
      case 'repsMin':
        if (max3Int.test(value)) {
          setRepsMinState(value);
        }
        break;
      case 'repsMax':
        if (max3Int.test(value)) {
          setRepsMaxState(value);
        }
        break;
      case 'peso':
        if (decimal_5_2.test(value) && value.length <= 6) {
          // Estandariza la coma a un punto
          setPesoState(value.replace(',', '.'));
        }
        break;
      case 'descanso':
        if (max4Int.test(value)) {
          setDescansoState(value);
        }
        break;

      // --- CARDIO ---
      case 'tiempoCardio':
        if (max4Int.test(value)) {
          setTiempoCardioState(value);
        }
        break;
      case 'distanciaCardio':
        if (decimal_5_2.test(value) && value.length <= 6) {
          setDistanciaCardioState(value.replace(',', '.'));
        }
        break;
      case 'descansoCardio':
        if (max4Int.test(value)) {
          setDescansoCardioState(value);
        }
        break;
      default:
        // Fallback por si acaso
        break;
    }
  };


  /**
   * Llama a la API para marcar una guía tutorial como vista por el usuario.
   */
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

  // Resetea los inputs del formulario de Fuerza
  const resetFuerzaInputs = () => {
    setTipoRepState("rango"); setRepsMinState("");
    setRepsMaxState(""); setPesoState("");
    setDescansoState("");
  };

  // Resetea los inputs del formulario de Cardio
  const resetCardioInputs = () => {
    setTiempoCardioState("");
    setDistanciaCardioState(""); setDescansoCardioState("");
  };

  // Muestra un mensaje temporal de éxito (para rutina o para ejercicio)
  const showTemporaryMessage = (message, type = 'exercise', duration = 3000) => {
    setApiErrorFormAgregar(null);
    setApiErrorFormEditar(null);
    if (type === 'rutina') {
      setSuccessMsg(message);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => { setSuccessMsg(null); successTimeoutRef.current = null; }, duration);
    } else {
      setExerciseSuccessMsg(message);
      if (exerciseSuccessTimeoutRef.current) clearTimeout(exerciseSuccessTimeoutRef.current);
      exerciseSuccessTimeoutRef.current = setTimeout(() => { setExerciseSuccessMsg(null); exerciseSuccessTimeoutRef.current = null; }, duration);
    }
  };

  // Limpieza de timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (exerciseSuccessTimeoutRef.current) clearTimeout(exerciseSuccessTimeoutRef.current);
    };
  }, []);

  // Efecto para cargar toda la información de la rutina
  useEffect(() => {
    const cargarDatosRutina = async () => {
      setLoading(true); setError(null); setApiErrorFormAgregar(null); setApiErrorFormEditar(null);
      setSuccessMsg(null); setExerciseSuccessMsg(null);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (exerciseSuccessTimeoutRef.current) clearTimeout(exerciseSuccessTimeoutRef.current);
      const token = localStorage.getItem('movium_token'); if (!token) { setError("Autenticación requerida."); setLoading(false); return; }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      try {
        // Peticiones en paralelo
        const resInfo = fetch(`http://localhost/programacion/TFG/movium/backend/api/get_rutina_info.php?id=${rutinaId}`, { headers });
        const resEjerciciosGuardados = fetch(`http://localhost/programacion/TFG/movium/backend/api/get_ejercicios_de_rutina.php?id=${rutinaId}`, { headers });
        const resMaestra = fetch(`http://localhost/programacion/TFG/movium/backend/api/get_ejercicios_maestra.php`, { headers });

        const [info, ejerciciosGuardados, maestra] = await Promise.all([resInfo, resEjerciciosGuardados, resMaestra]);

        const dataInfo = await info.json();
        if (!info.ok) throw new Error(dataInfo.mensaje || "Error info rutina");

        const dataEjerciciosGuardados = await ejerciciosGuardados.json();
        if (!ejerciciosGuardados.ok) throw new Error(dataEjerciciosGuardados.mensaje || "Error ejercicios guardados");

        const dataMaestra = await maestra.json();
        if (!maestra.ok) throw new Error(dataMaestra.mensaje || "Error maestra");

        setRutinaInfo(dataInfo);
        setEjerciciosEnRutina(dataEjerciciosGuardados);
        setEjerciciosMaestra(dataMaestra);
        // Inicializar estados de edición con los datos cargados
        setEditedName(dataInfo.nombre);
        setEditedDays(dataInfo.dias_semana || '');
        setEditedOrden(dataInfo.orden || 0);
        setEditedColor(dataInfo.color_tag || "");

      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    cargarDatosRutina();
  }, [rutinaId]);

  // Efecto para mostrar la guía de rutina
  useEffect(() => {
    if (loading || error) return;

    try {
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      if (storedUser && !storedUser.ha_visto_guia_rutina && storedUser.ha_visto_guia_inicio) {
        const timer = setTimeout(() => {
          setShowGuiaRutina(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error("Error al leer datos de usuario para la guía:", e);
    }
  }, [loading, error]);

  // Cierra el modal de guía de rutina y marca como vista
  const handleCerrarGuiaRutina = () => {
    try {
      marcarGuiaComoVista('rutina');
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      if (storedUser) {
        const updatedUser = { ...storedUser, ha_visto_guia_rutina: true };
        localStorage.setItem('movium_user', JSON.stringify(updatedUser));
      }
      setShowGuiaRutina(false);
    } catch (e) {
      console.error("Error al cerrar la guía de rutina:", e);
      setShowGuiaRutina(false);
    }
  };

  // Envía los datos actualizados de la rutina a la API.
  const handleUpdateRutinaInfo = async (e) => {
    e.preventDefault();
    setApiErrorFormEditar(null);
    setSuccessMsg(null); setExerciseSuccessMsg(null);
    const token = localStorage.getItem('movium_token');

    const body = {
      id: rutinaId,
      nombre: editedName,
      dias_semana: editedDays,
      orden: editedOrden,
      color_tag: editedColor
    };

    try {
      const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/update_rutina.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al actualizar la rutina.');
      }

      setRutinaInfo(prevInfo => ({
        ...prevInfo,
        ...data.rutina_info
      }));
      setEditedName(data.rutina_info.nombre);
      setEditedDays(data.rutina_info.dias_semana || '');
      setEditedOrden(data.rutina_info.orden);
      setEditedColor(data.rutina_info.color_tag || "");

      showTemporaryMessage("Rutina actualizada con éxito.", 'rutina');
      setIsEditingInfo(false);
    } catch (err) { setApiErrorFormEditar(err.message); }
  };

  // Abre el modal de confirmación para borrar la rutina.
  const handleDeleteRutina = () => { setIsDeleteModalOpen(true); };

  // Confirma y ejecuta el borrado de la rutina completa.
  const handleConfirmDelete = async () => {
    setApiErrorFormEditar(null); setIsDeleting(true);
    const token = localStorage.getItem('movium_token');
    try {
      const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/delete_rutina.php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id: rutinaId }) });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al eliminar la rutina.');
      }
      setIsDeleteModalOpen(false);
      setIsDeleting(false);
      setIsEditingInfo(false);
      navigate('/');
    } catch (err) {
      setApiErrorFormEditar(err.message);
      setIsDeleteModalOpen(false);
      setIsDeleting(false);
    }
  };

  // Cancela el modo de edición de la info de la rutina y resetea los valores.
  const handleCancelEditInfo = () => {
    setIsEditingInfo(false);
    setEditedName(rutinaInfo.nombre);
    setEditedDays(rutinaInfo.dias_semana || '');
    setEditedOrden(rutinaInfo.orden || 0);
    setEditedColor(rutinaInfo.color_tag || "");
    setApiErrorFormEditar(null);
    setSuccessMsg(null);
    setExerciseSuccessMsg(null);
  };

  // Callback del modal SelectorEjerciciosModal.
  const handleSelectEjercicio = (ej) => {
    setEjercicioSeleccionado(ej);
    setObjetivosParaAgregar([]);
    setApiErrorFormAgregar(null);
    setIsSelectorModalOpen(false);
    resetFuerzaInputs();
    resetCardioInputs();
    setSuccessMsg(null);
    setExerciseSuccessMsg(null);
  };

  // Valida y obtiene los datos de la serie de fuerza de los inputs.
  const getCurrentSerieData = () => {
    setApiErrorFormAgregar(null);
    let reps_min = null; let reps_max = null;

    if (!repsMinState) {
      setApiErrorFormAgregar("El campo 'Reps' (o 'Reps Mín') es obligatorio.");
      return null;
    }

    if (tipoRepState === 'fijo' || tipoRepState === 'fallo') {
      const repsParsed = parseInt(repsMinState, 10);
      if (isNaN(repsParsed) || (tipoRepState === 'fijo' && repsParsed < 1) || (tipoRepState === 'fallo' && repsParsed < 0)) {
        setApiErrorFormAgregar(`Valor inválido para '${tipoRepState === 'fallo' ? 'Reps Aprox.' : 'Reps'}' (>= ${tipoRepState === 'fallo' ? 0 : 1}).`);
        return null;
      }
      reps_min = (tipoRepState === 'fallo' && repsMinState === '') ? null : repsParsed;

    } else if (tipoRepState === 'rango') {
      if (!repsMaxState) {
        setApiErrorFormAgregar("El campo 'Reps Máx' es obligatorio para el tipo Rango.");
        return null;
      }
      const minParsed = parseInt(repsMinState, 10);
      const maxParsed = parseInt(repsMaxState, 10);
      if (isNaN(minParsed) || isNaN(maxParsed) || minParsed < 1 || maxParsed < minParsed) {
        setApiErrorFormAgregar("Las Repeticiones Máximas deber ser mayores o iguales que las Mínimas");
        return null;
      }
      reps_min = minParsed; reps_max = maxParsed;
    }

    if (!pesoState) {
      setApiErrorFormAgregar("El campo 'Peso' es obligatorio.");
      return null;
    }
    const pesoNum = parseFloat(pesoState);
    if (isNaN(pesoNum) || pesoNum < 0) {
      setApiErrorFormAgregar("El peso debe ser un número válido (>= 0).");
      return null;
    }

    const descansoNum = parseInt(descansoState, 10);
    if (descansoState && (isNaN(descansoNum) || descansoNum < 0)) {
      setApiErrorFormAgregar("El descanso debe ser un número válido (>= 0) o dejarse vacío.");
      return null;
    }

    return {
      num_serie: objetivosParaAgregar.length + 1, tipo_rep_objetivo: tipoRepState,
      reps_min_objetivo: reps_min, reps_max_objetivo: reps_max,
      peso_kg_objetivo: pesoNum,
      descanso_seg_post: (descansoState && !isNaN(descansoNum)) ? descansoNum : null,
      tiempo_min_objetivo: null, distancia_km_objetivo: null
    };
  };

  // Añade la serie validada a la lista temporal 'objetivosParaAgregar'.
  const handleAddSerieToList = () => {
    const serieData = getCurrentSerieData();
    if (serieData) {
      setObjetivosParaAgregar(prev => [...prev, serieData]);
      // --- ¡CAMBIO! No reseteamos los inputs ---
      // resetFuerzaInputs(); 
    }
  };

  // Valida y obtiene los datos del intervalo de cardio de los inputs.
  const getCurrentIntervaloData = () => {
    setApiErrorFormAgregar(null);
    if (!tiempoCardioState) {
      setApiErrorFormAgregar("El campo 'Tiempo' es obligatorio.");
      return null;
    }
    const tiempoNum = parseInt(tiempoCardioState, 10);
    if (isNaN(tiempoNum) || tiempoNum <= 0) {
      setApiErrorFormAgregar("El Tiempo debe ser un número válido mayor que 0.");
      return null;
    }

    if (!distanciaCardioState) {
      setApiErrorFormAgregar("El campo 'Distancia' es obligatorio.");
      return null;
    }
    const distNum = parseFloat(distanciaCardioState);
    if (isNaN(distNum) || distNum <= 0) {
      setApiErrorFormAgregar("La Distancia debe ser un número válido mayor que 0.");
      return null;
    }

    const descansoNum = parseInt(descansoCardioState, 10);
    if (descansoCardioState && (isNaN(descansoNum) || descansoNum < 0)) {
      setApiErrorFormAgregar("El descanso debe ser un número válido (>= 0) o dejarse vacío.");
      return null;
    }

    return {
      num_serie: objetivosParaAgregar.length + 1, tipo_rep_objetivo: 'fijo',
      reps_min_objetivo: null, reps_max_objetivo: null, peso_kg_objetivo: null,
      tiempo_min_objetivo: tiempoNum, distancia_km_objetivo: distNum,
      descanso_seg_post: (descansoCardioState && !isNaN(descansoNum)) ? descansoNum : null
    };
  };

  // Añade el intervalo validado a la lista temporal 'objetivosParaAgregar'.
  const handleAddIntervaloToList = () => {
    const intervaloData = getCurrentIntervaloData();
    if (intervaloData) {
      setObjetivosParaAgregar(prev => [...prev, intervaloData]);
      // --- ¡CAMBIO! No reseteamos los inputs ---
      // resetCardioInputs();
    }
  };

  // Envía el nuevo ejercicio a la API para guardarlo.
  const handleAgregarEjercicio = async (e) => {
    e.preventDefault();
    setApiErrorFormAgregar(null);
    setSuccessMsg(null); setExerciseSuccessMsg(null);
    const token = localStorage.getItem('movium_token');
    if (!ejercicioSeleccionado) { setApiErrorFormAgregar("Selecciona un ejercicio."); return; }

    const objetivosFinales = objetivosParaAgregar;

    if (objetivosFinales.length === 0) {
      setApiErrorFormAgregar(`Añade al menos un${ejercicioSeleccionado.tipo === 'cardio' ? ' intervalo' : 'a serie'} antes de guardar.`);
      return;
    }

    const nuevoEjercicioRutina = { rutina_id: rutinaId, ejercicio_id: ejercicioSeleccionado.id, objetivos: objetivosFinales };
    try {
      const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/add_ejercicio_a_rutina.php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(nuevoEjercicioRutina) });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al añadir el ejercicio a la rutina.');
      }

      setEjerciciosEnRutina(prev => [...prev, data.ejercicio_agregado]);
      setEjercicioSeleccionado(null);
      setObjetivosParaAgregar([]);
      resetFuerzaInputs();
      resetCardioInputs();
      showTemporaryMessage("Ejercicio añadido con éxito.", 'exercise');
    } catch (err) { setApiErrorFormAgregar(`Error al guardar: ${err.message}`); }
  };

  // Abre el modal para confirmar el borrado de un ejercicio
  const handleBorrarEjercicio = (ejercicio) => {
    setApiErrorFormAgregar(null);
    setSuccessMsg(null);
    setExerciseSuccessMsg(null);
    setEjercicioAEliminar({ id: ejercicio.id, nombre: ejercicio.nombre_ejercicio });
    setIsConfirmarBorrarEjercicioOpen(true);
  };

  // Confirma y ejecuta el borrado del ejercicio de la rutina.
  const handleConfirmarBorrarEjercicio = async () => {
    if (!ejercicioAEliminar) return;
    setApiErrorFormAgregar(null);
    setIsDeletingEjercicio(true);
    const token = localStorage.getItem('movium_token');
    try {
      const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/delete_ejercicio_de_rutina.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: ejercicioAEliminar.id })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al borrar el ejercicio');
      }
      setEjerciciosEnRutina(data.ejercicios_actualizados);
      showTemporaryMessage("Ejercicio borrado.", 'exercise');
    } catch (err) {
      setApiErrorFormAgregar(err.message);
    } finally {
      setIsConfirmarBorrarEjercicioOpen(false);
      setIsDeletingEjercicio(false);
      setEjercicioAEliminar(null);
    }
  };

  // Callback del modal EditarEjercicioModal.
  const handleGuardarCambios = async (datosEjercicio, setModalError) => {
    const token = localStorage.getItem('movium_token');
    setSuccessMsg(null); setExerciseSuccessMsg(null);
    try {
      const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/update_ejercicio_en_rutina.php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(datosEjercicio) });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al guardar cambios');
      }

      setEjerciciosEnRutina(data.ejercicios_actualizados);
      setEjercicioParaEditar(null); // Cierra el modal
      showTemporaryMessage("Ejercicio actualizado.", 'exercise');
    } catch (err) { setModalError(err.message); } // Muestra el error DENTRO del modal
  };

  // Renderizado de Carga
  if (loading) return <div className="rutina-detalle-container"><p className="subtitle">Cargando...</p></div>;

  // Renderizado de Error
  if (error) return (<div className="rutina-detalle-container"><button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver</button><div className="message">{error}</div></div>);

  // Renderizado de Rutina no encontrada
  if (!rutinaInfo) return <div className="rutina-detalle-container"><p className="subtitle">Rutina no encontrada.</p></div>;

  // Renderizado Principal
  return (
    <>
      <div className="rutina-detalle-container">

        <button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver</button>

        {/* --- Cabecera (Modo Vista o Modo Edición) --- */}
        {!isEditingInfo ? (
          // Modo Vista
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
              <img src={iconoCrear} alt="" width="64" height="64" /> <h2>{rutinaInfo.nombre}</h2>
            </div>
            <p className="subtitle" style={{ textAlign: 'center' }}>{rutinaInfo.dias_semana || "Añade o edita los ejercicios para este día."}</p>
            <button className="btn-edit-info" style={{ top: '0', right: '0' }} onClick={() => { setIsEditingInfo(true); setSuccessMsg(null); setExerciseSuccessMsg(null); setApiErrorFormEditar(null); }} title="Editar nombre y días">✏️</button>

            {successMsg && !apiErrorFormEditar && <div className="message success" style={{ marginTop: '1rem' }}>{successMsg}</div>}
          </div>
        ) : (
          // Modo Edición (Formulario para info de la rutina)
          <form className="form-editar-rutina-inline" onSubmit={handleUpdateRutinaInfo}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '10px' }}>
              <img src={iconoCrear} alt="" width="64" height="64" /> <h3>Configuración de la Rutina</h3>
            </div>
            {apiErrorFormEditar && <div className="message">{apiErrorFormEditar}</div>}

            <div className="form-grid">
              <div className="form-group-small" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="editedName">Nombre</label>
                <input type="text" id="editedName" value={editedName} onChange={(e) => { setEditedName(e.target.value); setSuccessMsg(null); }} required maxLength={MAX_TITULO_LENGTH} />
                <small className="char-counter">
                  {editedName.length} / {MAX_TITULO_LENGTH}
                </small>
              </div>
              <div className="form-group-small" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="editedDays">Días / Descripción</label>
                <input type="text" id="editedDays" value={editedDays} onChange={(e) => { setEditedDays(e.target.value); setSuccessMsg(null); }} placeholder="Ej: Lunes, Jueves" maxLength={MAX_DIAS_LENGTH} />
                <small className="char-counter">
                  {editedDays.length} / {MAX_DIAS_LENGTH}
                </small>
              </div>

              {/* Selector para el orden */}
              <div className="form-group-small">
                <label htmlFor="editedOrden">Orden en Inicio</label>
                <select
                  id="editedOrden"
                  value={editedOrden}
                  onChange={(e) => setEditedOrden(e.target.value)}
                  required
                >
                  {rutinaInfo && rutinaInfo.max_orden_disponible &&
                    Array.from({ length: rutinaInfo.max_orden_disponible }, (_, i) => i + 1)
                      .map(numero => (
                        <option key={numero} value={numero}>
                          {numero}
                        </option>
                      ))
                  }
                  {(!rutinaInfo || !rutinaInfo.max_orden_disponible) && (
                    <option value={editedOrden || 1}>{editedOrden || 1}</option>
                  )}
                </select>
              </div>

              {/* Selector de color */}
              <div className="form-group-small">
                <label htmlFor="editedColor">Color de Tarjeta</label>
                <div className="color-input-container">
                  <input
                    type="color"
                    id="editedColor"
                    value={editedColor || "#000000"}
                    onChange={(e) => setEditedColor(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-cancel-inline"
                    onClick={() => setEditedColor("")}
                    title="Quitar color"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>

            {/* Acciones del formulario de edición de rutina */}
            <div className="form-actions-rutina-inline">
              <button type="button" className="btn-delete-rutina-inline" onClick={handleDeleteRutina}>Eliminar Rutina</button>
              <div className="form-actions-rutina-inline-right">
                <button type="button" className="btn-cancel-inline" onClick={handleCancelEditInfo}>Cancelar</button>
                <button type="submit" className="transparent-btn-inline">Guardar</button>
              </div>
            </div>
          </form>
        )}

        {/* --- Formulario de Añadir Ejercicio --- */}
        <form className="form-agregar-ejercicio" onSubmit={handleAgregarEjercicio}>
          <h3>Añadir Ejercicio</h3>
          <div className="form-grid">
            <div className="form-group-select" style={{ gridColumn: '1 / -1' }}>
              <label>Ejercicio</label>
              <button
                type="button"
                className="select-ejercicio-btn"
                onClick={() => setIsSelectorModalOpen(true)}
              >
                {ejercicioSeleccionado
                  ? `${ejercicioSeleccionado.nombre} (${ejercicioSeleccionado.tipo})`
                  : "-- Selecciona --"}
              </button>
            </div>

            {/* Renderiza el formulario de Fuerza o Cardio según el ejercicio seleccionado */}
            {!ejercicioSeleccionado ?
              (
                <p className="subtitle" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Selecciona un ejercicio para añadir series o intervalos.</p>
              ) : ejercicioSeleccionado.tipo === 'cardio' ?
                (
                  <FormularioCardio
                    objetivos={objetivosParaAgregar} setObjetivos={setObjetivosParaAgregar}
                    tiempo={tiempoCardioState}
                    distancia={distanciaCardioState}
                    descanso={descansoCardioState}
                    onFormChange={handleAddFormChange} // <-- Pasa el handler
                  />
                ) : (
                  <FormularioFuerza
                    objetivos={objetivosParaAgregar} setObjetivos={setObjetivosParaAgregar}
                    tipoRep={tipoRepState} setTipoRep={setTipoRepState}
                    repsMin={repsMinState}
                    repsMax={repsMaxState}
                    peso={pesoState}
                    descanso={descansoState}
                    onFormChange={handleAddFormChange} // <-- Pasa el handler
                  />
                )}
          </div>

          {/* Botones de acción para añadir series/intervalos y guardar el ejercicio completo */}
          {ejercicioSeleccionado && (
            <div className="form-actions-right">
              {objetivosParaAgregar.length > 0 && (
                <button type="submit" className="transparent-btn">
                  Guardar Ejercicio en Rutina
                  {` (${objetivosParaAgregar.length} ${objetivosParaAgregar.length > 1
                    ? (ejercicioSeleccionado.tipo === 'cardio' ? 'intervalos' : 'series')
                    : (ejercicioSeleccionado.tipo === 'cardio' ? 'intervalo' : 'serie')})`}
                </button>
              )}
              <button
                type="button"
                onClick={ejercicioSeleccionado.tipo === 'cardio'
                  ? handleAddIntervaloToList
                  : handleAddSerieToList}
                className="btn-add-serie"
              >
                {ejercicioSeleccionado.tipo === 'cardio'
                  ? 'Añadir Intervalo'
                  : 'Añadir Serie'}
              </button>
            </div>
          )}
        </form>

        {/* --- Bloque de Mensajes (Errores o Éxito) --- */}
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          {apiErrorFormAgregar && <div className="message">{apiErrorFormAgregar}</div>}
          {exerciseSuccessMsg && !isEditingInfo && <div className="message success">{exerciseSuccessMsg}</div>}
        </div>

        {/* --- Lista de Ejercicios Guardados en la Rutina --- */}
        <div className="lista-ejercicios">
          <h3>Ejercicios en esta Rutina</h3>
          {ejerciciosEnRutina.length === 0 ?
            (
              <p className="no-rutinas-msg">Aún no has añadido ejercicios.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Orden</th><th>Ejercicio</th><th>Detalle</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {/* Ordena los ejercicios por su campo 'orden' antes de mapearlos */}
                    {ejerciciosEnRutina.sort((a, b) => a.orden - b.orden).map(ej => (
                      <tr key={ej.id}>
                        <td>{ej.orden}</td>
                        <td><strong>{ej.nombre_ejercicio}</strong> <small>({ej.tipo})</small></td>
                        <td className="cell-objetivos">
                          {ej.objetivos.length === 0 ? <small>Sin objetivos</small> : (
                            <ul>
                              {/* Ordena las series/intervalos por su 'num_serie' */}
                              {ej.objetivos.sort((a, b) => a.num_serie - b.num_serie).map(obj => (
                                <li key={obj.id || obj.num_serie}>
                                  {formatObjetivoTabla(obj, ej.tipo)}
                                </li>
                              ))}
                            </ul>)}
                        </td>
                        <td>
                          <div className="acciones-tabla">
                            <button className="btn-edit-small" onClick={() => {
                              setEjercicioParaEditar(ej);
                              setSuccessMsg(null); setExerciseSuccessMsg(null); setApiErrorFormAgregar(null);
                            }}>Editar</button>
                            <button className="btn-delete-small" onClick={() => handleBorrarEjercicio(ej)}>Borrar</button>
                          </div>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

      </div> {/* Fin rutina-detalle-container */}

      {/* --- Modales --- */}
      <SelectorEjerciciosModal
        isOpen={isSelectorModalOpen}
        onClose={() => {
          setIsSelectorModalOpen(false);
          setSuccessMsg(null); setExerciseSuccessMsg(null);
        }}
        listaEjercicios={ejerciciosMaestra}
        onEjercicioSelect={handleSelectEjercicio}
      />

      <EditarEjercicioModal
        isOpen={ejercicioParaEditar !== null}
        onClose={() => {
          setEjercicioParaEditar(null);
          setApiErrorFormAgregar(null); setSuccessMsg(null); setExerciseSuccessMsg(null);
        }}
        ejercicio={ejercicioParaEditar}
        onGuardar={handleGuardarCambios}
        // Pasa el número total de ejercicios (para el selector de orden)
        maxOrden={ejerciciosEnRutina.length}
      />

      <ConfirmarBorradoModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        rutinaNombre={rutinaInfo ? rutinaInfo.nombre : ""}
        isDeleting={isDeleting}
      />

      <ConfirmarBorrarEjercicioModal
        isOpen={isConfirmarBorrarEjercicioOpen}
        onClose={() => {
          setIsConfirmarBorrarEjercicioOpen(false);
          setEjercicioAEliminar(null);
        }}
        onConfirm={handleConfirmarBorrarEjercicio}
        ejercicioNombre={ejercicioAEliminar ? ejercicioAEliminar.nombre : ""}
        isDeleting={isDeletingEjercicio}
      />

      {/* Modal de Guía/Tutorial para esta página */}
      <GuiaModal
        isOpen={showGuiaRutina}
        onClose={handleCerrarGuiaRutina}
        titulo="¡Añade tu primer ejercicio!"
      >
        <p>¡Genial! Ya tienes tu rutina. Ahora pulsa <strong>"Añadir Ejercicio"</strong> para empezar.</p>
        <p><strong>1. Selecciona un Ejercicio:</strong> Elige de la lista (ej: "Press de Banca").</p>
        <p><strong>2. Define tus Series:</strong> Si es un ejercicio de fuerza, añade tus series (ej: 3 series de 10 repeticiones con 50kg).</p>
        <p><strong>3. Define tus Intervalos:</strong> Si es cardio, añade el tiempo y distancia (ej: 20 minutos / 3 km).</p>
        <p><strong>4. Guarda el Ejercicio:</strong> El ejercicio aparecerá en la tabla de abajo.</p>
        <p><strong>¡Truco extra!</strong> En el lápiz (✏️) que hay arriba, puedes <strong>asignarle un color a tu rutina</strong>. Así tu inicio será más visual, además, ese color aparecerá en el calendario para que sepas qué entrenaste de un vistazo.</p>
        <br />
        <p>¡No te preocupes! Puedes <strong>editar</strong> o <strong>borrar</strong> cualquier ejercicio cuando quieras usando los botones de la tabla.</p>
      </GuiaModal>
    </>
  );
}

export default RutinaDetalle;