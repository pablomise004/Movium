import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RutinaDetalle.css';
import SelectorEjerciciosModal from './components/SelectorEjerciciosModal';
import ConfirmarModal from './components/ConfirmarModal';
import iconoCrear from './assets/crear-ejercicios.png';
import { API_BASE_URL } from './config';

const FormularioFuerza = ({
  objetivos,
  setObjetivos,
  tipoRep, setTipoRep,
  repsMin,
  repsMax,
  peso,
  descanso,
  onFormChange
}) => {

  const borrarSerie = (num_serie) => {
    setObjetivos(objetivos.filter(s => s.num_serie !== num_serie).map((s, i) => ({ ...s, num_serie: i + 1 })));
  };

  const formatearPreview = (obj) => {
    let repStr = "";
    if (obj.tipo_rep_objetivo === 'fallo') {
      repStr = `Al Fallo (~${obj.reps_min_objetivo || '?'}r)`;
    } else if (obj.tipo_rep_objetivo === 'rango') {
      repStr = `${obj.reps_min_objetivo || '?'}-${obj.reps_max_objetivo || '?'} reps`;
    } else {
      repStr = `${obj.reps_min_objetivo || '?'} reps`;
    }
    let pesoStr = obj.peso_kg_objetivo ? ` con ${obj.peso_kg_objetivo}kg` : '';
    let descansoStr = obj.descanso_seg_post ? ` (${obj.descanso_seg_post}s)` : '';
    return `${repStr}${pesoStr}${descansoStr}`;
  };

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div className="lista-series-preview">
        {objetivos.length === 0 ? (
          <p className="subtitle" style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>Añade tu primera serie...</p>
        ) : (
          objetivos.map(s => (
            <div key={s.num_serie} className="serie-preview-item">
              <span><strong>Serie {s.num_serie}:</strong> {formatearPreview(s)}</span>
              <button type="button" className="btn-delete-small" onClick={() => borrarSerie(s.num_serie)}>Borrar</button>
            </div>
          ))
        )}
      </div>

      <div className="form-grid" style={{ borderTop: '1px solid var(--color-borde-input)', paddingTop: '1rem', marginTop: '1rem' }}>
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
              type="number"
              min={tipoRep === 'fallo' ? "0" : "1"}
              value={repsMin}
              placeholder="Obligatorio"
              name="repsMin"
              onChange={onFormChange}            />
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
                name="repsMax"
                onChange={onFormChange}
              />
            </div>
          )}
        </div>
        <div className="form-group-small">
          <label htmlFor={`peso-input-${objetivos.length + 1}`}>Peso (kg)</label>
          <input
            id={`peso-input-${objetivos.length + 1}`}
            type="number"
            step="0.01"
            min="0"
            value={peso}
            placeholder="Obligatorio"
            name="peso"
            onChange={onFormChange}
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
          />
        </div>
      </div>
    </div>
  );
};

const FormularioCardio = ({
  objetivos,
  setObjetivos,
  tiempo,
  distancia,
  descanso,
  onFormChange
}) => {

  const borrarIntervalo = (num_serie) => {
    setObjetivos(objetivos.filter(s => s.num_serie !== num_serie).map((s, i) => ({ ...s, num_serie: i + 1 })));
  };

  const formatearPreview = (obj) => {
    const partes = [];
    if (obj.tiempo_min_objetivo) partes.push(`${obj.tiempo_min_objetivo} min`);
    if (obj.distancia_km_objetivo) partes.push(`${obj.distancia_km_objetivo} km`);
    let texto = partes.join(' / ');
    if (obj.descanso_seg_post) texto += ` (${obj.descanso_seg_post}s descanso)`;
    return texto || "Intervalo vacío";
  };

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div className="lista-series-preview">
        {objetivos.length === 0 ? (
          <p className="subtitle" style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>Añade tu primer intervalo...</p>
        ) : (
          objetivos.map(s => (
            <div key={s.num_serie} className="serie-preview-item">
              <span><strong>Intervalo {s.num_serie}:</strong> {formatearPreview(s)}</span>
              <button type="button" className="btn-delete-small" onClick={() => borrarIntervalo(s.num_serie)}>Borrar</button>
            </div>
          ))
        )}
      </div>

      <div className="form-grid" style={{ borderTop: '1px solid var(--color-borde-input)', paddingTop: '1rem', marginTop: '1rem', alignItems: 'end' }}>
        <div className="form-group-small">
          <label htmlFor={`tiempo-input-${objetivos.length + 1}`}>Tiempo (Min)</label>
          <input
            id={`tiempo-input-${objetivos.length + 1}`}
            type="number"
            min="1"
            step="1"
            value={tiempo}
            placeholder="Obligatorio"
            name="tiempoCardio"
            onChange={onFormChange}
          />
        </div>
        <div className="form-group-small">
          <label htmlFor={`distancia-input-${objetivos.length + 1}`}>Distancia (km)</label>
          <input
            id={`distancia-input-${objetivos.length + 1}`}
            type="number"
            min="0.1"
            step="0.01"
            value={distancia}
            placeholder="Obligatorio"
            name="distanciaCardio"
            onChange={onFormChange}
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
          />
        </div>
      </div>
    </div>
  );
};

function RutinaDetalle() {

  const { id: rutinaId } = useParams();
  const navigate = useNavigate();

  const [infoRutina, setInfoRutina] = useState(null);
  const [ejerciciosRutina, setEjerciciosRutina] = useState([]);
  const [ejerciciosBase, setEjerciciosBase] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeOkEjercicio, setMensajeOkEjercicio] = useState(null);

  const [modalSelectorAbierto, setModalSelectorAbierto] = useState(false);
  const [modalBorrarRutinaAbierto, setModalBorrarRutinaAbierto] = useState(false);
  const [borrandoRutina, setBorrandoRutina] = useState(false);

  const [ejercicioElegido, setEjercicioElegido] = useState(null);
  const [objetivosNuevoEjercicio, setObjetivosNuevoEjercicio] = useState([]);
  const [errorAgregar, setErrorAgregar] = useState(null);

  const [tipoRepNuevo, setTipoRepNuevo] = useState("rango");
  const [repsMinNueva, setRepsMinNueva] = useState("");
  const [repsMaxNueva, setRepsMaxNueva] = useState("");
  const [pesoNuevo, setPesoNuevo] = useState("");
  const [descansoNuevo, setDescansoNuevo] = useState("");
  const [tiempoCardioNuevo, setTiempoCardioNuevo] = useState("");
  const [distanciaCardioNueva, setDistanciaCardioNueva] = useState("");
  const [descansoCardioNuevo, setDescansoCardioNuevo] = useState("");

  const [ejercicioBorrar, setEjercicioBorrar] = useState(null);
  const [modalBorrarEjercicioAbierto, setModalBorrarEjercicioAbierto] = useState(false);
  const [borrandoEjercicio, setBorrandoEjercicio] = useState(false);

  const manejarCambioFormAgregar = (e) => {
    const nombre = e.target.name;
    const valor = e.target.value;
    setErrorAgregar(null);
    if (nombre === 'repsMin') {
      setRepsMinNueva(valor);
    } else if (nombre === 'repsMax') {
      setRepsMaxNueva(valor);
    } else if (nombre === 'peso') {
      setPesoNuevo(valor);
    } else if (nombre === 'descanso') {
      setDescansoNuevo(valor);
    } else if (nombre === 'tiempoCardio') {
      setTiempoCardioNuevo(valor);
    } else if (nombre === 'distanciaCardio') {
      setDistanciaCardioNueva(valor);
    } else if (nombre === 'descansoCardio') {
      setDescansoCardioNuevo(valor);
    }
  };

  const resetearInputsFuerza = () => {
    setTipoRepNuevo("rango"); setRepsMinNueva("");
    setRepsMaxNueva(""); setPesoNuevo(""); setDescansoNuevo("");
  };

  const resetearInputsCardio = () => {
    setTiempoCardioNuevo(""); setDistanciaCardioNueva(""); setDescansoCardioNuevo("");
  };

  const formatearObjetivoTabla = (obj, tipo) => {
    if (tipo === 'cardio') {
      const metricas = [];
      if (obj.tiempo_min_objetivo) metricas.push(`${obj.tiempo_min_objetivo} min`);
      if (obj.distancia_km_objetivo) metricas.push(`${obj.distancia_km_objetivo} km`);
      let texto = metricas.join(' / ');
      if (obj.descanso_seg_post) texto += ` (${obj.descanso_seg_post}s)`;
      return <span><strong>Int. {obj.num_serie}:</strong> {texto || "Objetivo no especificado"}</span>;
    }
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

  useEffect(() => {
    const cargarDatosRutina = async () => {
      setCargando(true); setError(null); setErrorAgregar(null); setMensajeOkEjercicio(null);
      const token = localStorage.getItem('movium_token');
      if (!token) { setError("Autenticación requerida."); setCargando(false); return; }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      const info = await fetch(`${API_BASE_URL}get_rutina_info.php?id=${rutinaId}`, { headers });
      const dataInfo = await info.json();
      if (!info.ok) { setError(dataInfo.mensaje || "Error info rutina"); setCargando(false); return; }

      const ejerciciosGuardados = await fetch(`${API_BASE_URL}get_ejercicios_de_rutina.php?id=${rutinaId}`, { headers });
      const dataEjerciciosGuardados = await ejerciciosGuardados.json();
      if (!ejerciciosGuardados.ok) { setError(dataEjerciciosGuardados.mensaje || "Error ejercicios guardados"); setCargando(false); return; }

      const maestra = await fetch(`${API_BASE_URL}get_ejercicios_maestra.php`, { headers });
      const dataMaestra = await maestra.json();
      if (!maestra.ok) { setError(dataMaestra.mensaje || "Error maestra"); setCargando(false); return; }

      setInfoRutina(dataInfo);
      setEjerciciosRutina(dataEjerciciosGuardados);
      setEjerciciosBase(dataMaestra);
      setCargando(false);
    };
    cargarDatosRutina();
  }, [rutinaId]);

  const confirmarBorrarRutina = async () => {
    setBorrandoRutina(true);
    const token = localStorage.getItem('movium_token');
    const response = await fetch(`${API_BASE_URL}delete_rutina.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: rutinaId })
    });
    const data = await response.json();
    setModalBorrarRutinaAbierto(false);
    setBorrandoRutina(false);
    if (response.ok) navigate('/');
  };

  const seleccionarEjercicio = (ej) => {
    setEjercicioElegido(ej);
    setObjetivosNuevoEjercicio([]);
    setErrorAgregar(null);
    setModalSelectorAbierto(false);
    resetearInputsFuerza();
    resetearInputsCardio();
    setMensajeOkEjercicio(null);
  };

  const obtenerSerieActual = () => {
    setErrorAgregar(null);
    let reps_min = null;
    let reps_max = null;

    if (!repsMinNueva) {
      setErrorAgregar("El campo 'Reps' es obligatorio.");
      return null;
    }

    if (tipoRepNuevo === 'fijo' || tipoRepNuevo === 'fallo') {
      reps_min = parseInt(repsMinNueva, 10);
      // Con fijo minimo 1 rep, con fallo puede ser 0 (no sabes cuántas vas a hacer)
      if (isNaN(reps_min) || reps_min < 0) {
        setErrorAgregar("Valor de reps inválido.");
        return null;
      }
    } else if (tipoRepNuevo === 'rango') {
      if (!repsMaxNueva) {
        setErrorAgregar("El campo 'Reps Máx' es obligatorio para el tipo Rango.");
        return null;
      }
      reps_min = parseInt(repsMinNueva, 10);
      reps_max = parseInt(repsMaxNueva, 10);
      if (isNaN(reps_min) || isNaN(reps_max) || reps_min < 1 || reps_max < reps_min) {
        setErrorAgregar("Las Repeticiones Máximas deben ser mayores o iguales que las Mínimas.");
        return null;
      }
    }

    if (!pesoNuevo) {
      setErrorAgregar("El campo 'Peso' es obligatorio.");
      return null;
    }
    const pesoNum = parseFloat(pesoNuevo);
    if (isNaN(pesoNum) || pesoNum < 0) {
      setErrorAgregar("El peso debe ser un número válido.");
      return null;
    }

    // El descanso es opcional, solo se guarda si se ha escrito algo
    const descansoNum = parseInt(descansoNuevo, 10);
    const descansoFinal = (descansoNuevo && !isNaN(descansoNum)) ? descansoNum : null;

    return {
      num_serie: objetivosNuevoEjercicio.length + 1,
      tipo_rep_objetivo: tipoRepNuevo,
      reps_min_objetivo: reps_min,
      reps_max_objetivo: reps_max,
      peso_kg_objetivo: pesoNum,
      descanso_seg_post: descansoFinal,
      tiempo_min_objetivo: null,
      distancia_km_objetivo: null
    };
  };

  const agregarSerieLista = () => {
    const serieData = obtenerSerieActual();
    if (serieData) setObjetivosNuevoEjercicio([...objetivosNuevoEjercicio, serieData]);
  };

  const obtenerIntervaloActual = () => {
    setErrorAgregar(null);

    if (!tiempoCardioNuevo) {
      setErrorAgregar("El campo 'Tiempo' es obligatorio.");
      return null;
    }
    const tiempoNum = parseInt(tiempoCardioNuevo, 10);
    if (isNaN(tiempoNum) || tiempoNum <= 0) {
      setErrorAgregar("El Tiempo debe ser mayor que 0.");
      return null;
    }

    if (!distanciaCardioNueva) {
      setErrorAgregar("El campo 'Distancia' es obligatorio.");
      return null;
    }
    const distNum = parseFloat(distanciaCardioNueva);
    if (isNaN(distNum) || distNum <= 0) {
      setErrorAgregar("La Distancia debe ser mayor que 0.");
      return null;
    }

    const descansoNum = parseInt(descansoCardioNuevo, 10);
    return {
      num_serie: objetivosNuevoEjercicio.length + 1,
      tipo_rep_objetivo: 'fijo',
      reps_min_objetivo: null,
      reps_max_objetivo: null,
      peso_kg_objetivo: null,
      tiempo_min_objetivo: tiempoNum,
      distancia_km_objetivo: distNum,
      descanso_seg_post: (descansoCardioNuevo && !isNaN(descansoNum)) ? descansoNum : null
    };
  };

  const agregarIntervaloLista = () => {
    const intervaloData = obtenerIntervaloActual();
    if (intervaloData) setObjetivosNuevoEjercicio([...objetivosNuevoEjercicio, intervaloData]);
  };

  const guardarEjercicio = async (e) => {
    e.preventDefault();
    setErrorAgregar(null); setMensajeOkEjercicio(null);
    const token = localStorage.getItem('movium_token');
    if (!ejercicioElegido) { setErrorAgregar("Selecciona un ejercicio."); return; }
    if (objetivosNuevoEjercicio.length === 0) {
      setErrorAgregar(`Añade al menos un${ejercicioElegido.tipo === 'cardio' ? ' intervalo' : 'a serie'} antes de guardar.`);
      return;
    }

    const nuevoEjercicioRutina = { rutina_id: rutinaId, ejercicio_id: ejercicioElegido.id, objetivos: objetivosNuevoEjercicio };
    const response = await fetch(`${API_BASE_URL}add_ejercicio_a_rutina.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(nuevoEjercicioRutina)
    });
    const data = await response.json();
    if (!response.ok) { setErrorAgregar(data.mensaje || 'Error al añadir el ejercicio.'); return; }
    setEjerciciosRutina(prev => [...prev, data.ejercicio_agregado]);
    setEjercicioElegido(null);
    setObjetivosNuevoEjercicio([]);
    resetearInputsFuerza();
    resetearInputsCardio();
    setMensajeOkEjercicio("Ejercicio añadido con éxito.");
    setTimeout(() => setMensajeOkEjercicio(null), 3000);
  };

  const abrirBorrarEjercicio = (ejercicio) => {
    setErrorAgregar(null); setMensajeOkEjercicio(null);
    setEjercicioBorrar({ id: ejercicio.id, nombre: ejercicio.nombre_ejercicio });
    setModalBorrarEjercicioAbierto(true);
  };

  const confirmarBorrarEjercicio = async () => {
    if (!ejercicioBorrar) return;
    setErrorAgregar(null); setBorrandoEjercicio(true);
    const token = localStorage.getItem('movium_token');
    const response = await fetch(`${API_BASE_URL}delete_ejercicio_de_rutina.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: ejercicioBorrar.id })
    });
    const data = await response.json();
    if (!response.ok) {
      setErrorAgregar(data.mensaje || 'Error al borrar el ejercicio');
    } else {
      setEjerciciosRutina(data.ejercicios_actualizados);
      setMensajeOkEjercicio("Ejercicio borrado.");
      setTimeout(() => setMensajeOkEjercicio(null), 3000);
    }
    setModalBorrarEjercicioAbierto(false);
    setBorrandoEjercicio(false);
    setEjercicioBorrar(null);
  };

  if (cargando) return <div className="rutina-detalle-container"><p className="subtitle">Cargando...</p></div>;
  if (error) return (<div className="rutina-detalle-container"><button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver</button><div className="message">{error}</div></div>);
  if (!infoRutina) return <div className="rutina-detalle-container"><p className="subtitle">Rutina no encontrada.</p></div>;

  return (
    <>
      <div className="rutina-detalle-container">

        <button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver</button>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
            <img src={iconoCrear} alt="" width="64" height="64" />
            <h2>{infoRutina.nombre}</h2>
          </div>
          <p className="subtitle" style={{ textAlign: 'center' }}>{infoRutina.dias_semana || "Añade o edita los ejercicios para este día."}</p>
          <button
            className="btn-delete-rutina-inline"
            style={{ marginTop: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            onClick={() => setModalBorrarRutinaAbierto(true)}
          >
            Eliminar Rutina
          </button>
        </div>

        {/* Formulario de agregar ejercicio */}
        <form className="form-agregar-ejercicio" onSubmit={guardarEjercicio}>
          <h3>Añadir Ejercicio</h3>
          <div className="form-grid">
            <div className="form-group-select" style={{ gridColumn: '1 / -1' }}>
              <label>Ejercicio</label>
              <button type="button" className="select-ejercicio-btn" onClick={() => setModalSelectorAbierto(true)}>
                {ejercicioElegido ? `${ejercicioElegido.nombre} (${ejercicioElegido.tipo})` : "-- Selecciona --"}
              </button>
            </div>

            {!ejercicioElegido ? (
              <p className="subtitle" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Selecciona un ejercicio para añadir series o intervalos.</p>
            ) : ejercicioElegido.tipo === 'cardio' ? (
              <FormularioCardio
                objetivos={objetivosNuevoEjercicio} setObjetivos={setObjetivosNuevoEjercicio}
                tiempo={tiempoCardioNuevo} distancia={distanciaCardioNueva} descanso={descansoCardioNuevo}
                onFormChange={manejarCambioFormAgregar}
              />
            ) : (
              <FormularioFuerza
                objetivos={objetivosNuevoEjercicio} setObjetivos={setObjetivosNuevoEjercicio}
                tipoRep={tipoRepNuevo} setTipoRep={setTipoRepNuevo}
                repsMin={repsMinNueva} repsMax={repsMaxNueva} peso={pesoNuevo} descanso={descansoNuevo}
                onFormChange={manejarCambioFormAgregar}
              />
            )}
          </div>

          {ejercicioElegido && (
            <div className="form-actions-right">
              {objetivosNuevoEjercicio.length > 0 && (
                <button type="submit" className="transparent-btn">
                  Guardar Ejercicio en Rutina
                  {` (${objetivosNuevoEjercicio.length} ${objetivosNuevoEjercicio.length > 1
                    ? (ejercicioElegido.tipo === 'cardio' ? 'intervalos' : 'series')
                    : (ejercicioElegido.tipo === 'cardio' ? 'intervalo' : 'serie')})`}
                </button>
              )}
              <button
                type="button"
                onClick={ejercicioElegido.tipo === 'cardio' ? agregarIntervaloLista : agregarSerieLista}
                className="btn-add-serie"
              >
                {ejercicioElegido.tipo === 'cardio' ? 'Añadir Intervalo' : 'Añadir Serie'}
              </button>
            </div>
          )}
        </form>

        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          {errorAgregar && <div className="message">{errorAgregar}</div>}
          {mensajeOkEjercicio && <div className="message success">{mensajeOkEjercicio}</div>}
        </div>

        {/* Lista de Ejercicios en la Rutina */}
        <div className="lista-ejercicios">
          <h3>Ejercicios en esta Rutina</h3>
          {ejerciciosRutina.length === 0 ? (
            <p className="no-rutinas-msg">Aún no has añadido ejercicios.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Ejercicio</th><th>Detalle</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {ejerciciosRutina.map(ej => (
                    <tr key={ej.id}>
                      <td><strong>{ej.nombre_ejercicio}</strong> <small>({ej.tipo})</small></td>
                      <td className="cell-objetivos">
                        {ej.objetivos.length === 0 ? <small>Sin objetivos</small> : (
                          <ul>
                            {ej.objetivos.sort((a, b) => a.num_serie - b.num_serie).map(obj => (
                              <li key={obj.id || obj.num_serie}>
                                {formatearObjetivoTabla(obj, ej.tipo)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>
                        <div className="acciones-tabla">
                          <button className="btn-delete-small" onClick={() => abrirBorrarEjercicio(ej)}>Borrar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modales */}
      <SelectorEjerciciosModal
        isOpen={modalSelectorAbierto}
        onClose={() => setModalSelectorAbierto(false)}
        listaEjercicios={ejerciciosBase}
        onEjercicioSelect={seleccionarEjercicio}
      />

      <ConfirmarModal
        isOpen={modalBorrarRutinaAbierto}
        onClose={() => setModalBorrarRutinaAbierto(false)}
        onConfirm={confirmarBorrarRutina}
        isDeleting={borrandoRutina}
        nombre={infoRutina ? infoRutina.nombre : ""}
        mensaje="Se borrarán todos los ejercicios de la rutina y el historial de progreso."
      />

      <ConfirmarModal
        isOpen={modalBorrarEjercicioAbierto}
        onClose={() => { setModalBorrarEjercicioAbierto(false); setEjercicioBorrar(null); }}
        onConfirm={confirmarBorrarEjercicio}
        isDeleting={borrandoEjercicio}
        nombre={ejercicioBorrar ? ejercicioBorrar.nombre : ""}
        mensaje="Solo lo quitará de esta rutina. No borrará tu historial ni récords pasados."
      />
    </>
  );
}

export default RutinaDetalle;