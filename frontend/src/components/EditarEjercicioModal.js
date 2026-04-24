// ---- frontend/src/components/EditarEjercicioModal.js (MODIFICADO CON VALIDACIÓN DE INPUTS) ----

import React, { useState, useEffect } from 'react';
import './EditarEjercicioModal.css';

// --- ¡NUEVO! Helper de Perfil.js: Bloquea teclas (e, +, -, etc.) ---
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
 * Función helper para formatear el objeto de objetivo (serie o intervalo)
 * en un string legible para el usuario.
 */
const formatObjetivoNatural = (obj, tipo) => {
  if (!obj) return '';
  if (tipo === 'cardio') {
    // Formateo para Cardio
    const metricas = [];
    if (obj.tiempo_min_objetivo) metricas.push(`${obj.tiempo_min_objetivo} min`);
    if (obj.distancia_km_objetivo) metricas.push(`${obj.distancia_km_objetivo} km`);
    let texto = metricas.join(' / ');
    if (obj.descanso_seg_post) texto += ` (${obj.descanso_seg_post}s)`;
    return texto || "Intervalo vacío";
  } else {
    // Formateo para Fuerza
    let repStr = "";
    if (obj.tipo_rep_objetivo === 'fallo') {
      repStr = `Al Fallo${obj.reps_min_objetivo ? ` (~${obj.reps_min_objetivo}r)` : ''}`;
    } else if (obj.tipo_rep_objetivo === 'rango') {
      repStr = `${obj.reps_min_objetivo || '?'}-${obj.reps_max_objetivo || '?'} reps`;
    } else { // 'fijo'
      repStr = `${obj.reps_min_objetivo || '?'} reps`;
    }
    let pesoStr = obj.peso_kg_objetivo != null ? ` con ${obj.peso_kg_objetivo} kg` : '';
    let descansoStr = obj.descanso_seg_post != null ? ` (${obj.descanso_seg_post}s)` : '';
    return `${repStr}${pesoStr}${descansoStr}`;
  }
};

/**
 * Componente interno para gestionar la edición de series de FUERZA.
 */
const FormularioFuerzaEditable = ({ objetivos, setObjetivos }) => {
  // Estados para los inputs del formulario de edición/creación
  const [tipoRep, setTipoRep] = useState('fijo');
  const [repsMin, setRepsMin] = useState("10"); 
  const [repsMax, setRepsMax] = useState("12");
  const [peso, setPeso] = useState("");
  const [descanso, setDescanso] = useState("");
  const [editingSerieNum, setEditingSerieNum] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // --- ¡NUEVO! Handler de validación para el formulario "Editar Fuerza" ---
  const handleValidationChange = (e) => {
    const { name, value } = e.target;
    
    // Reglas de Regex
    const max3Int = /^\d{0,3}$/; // Máx 3 dígitos enteros
    const max4Int = /^\d{0,4}$/; // Máx 4 dígitos enteros
    const decimal_5_2 = /^(|\d{1,3}([.,]\d{0,2})?)$/; // Máx 999.99 (6 chars total)

    switch (name) {
      case 'repsMin':
        if (max3Int.test(value)) setRepsMin(value);
        break;
      case 'repsMax':
        if (max3Int.test(value)) setRepsMax(value);
        break;
      case 'peso':
        if (decimal_5_2.test(value) && value.length <= 6) {
          setPeso(value.replace(',', '.'));
        }
        break;
      case 'descanso':
        if (max4Int.test(value)) setDescanso(value);
        break;
      default:
        break;
    }
  };


  /**
   * Carga los datos de una serie existente en los inputs del formulario para editarla.
   */
  const handleSelectSerieForEdit = (serie) => {
    setEditingSerieNum(serie.num_serie);
    setShowForm(true);
    setTipoRep(serie.tipo_rep_objetivo || 'fijo');
    setRepsMin(serie.reps_min_objetivo || "");
    setRepsMax(serie.reps_max_objetivo || "");
    setPeso(serie.peso_kg_objetivo || "");
    setDescanso(serie.descanso_seg_post || "");
  };

  /**
   * Muestra el formulario con valores por defecto para añadir una NUEVA serie.
   */
  const handleShowAddForm = () => {
    setEditingSerieNum(null); // No estamos editando
    setShowForm(true);
    // Resetea inputs a valores por defecto para una nueva serie
    setTipoRep('rango');
    setRepsMin("8");
    setRepsMax("10");
    setPeso("");
    setDescanso("");
  };

  /**
   * Oculta el formulario y resetea el estado de edición.
   */
  const handleCancelOrReset = () => {
    setEditingSerieNum(null);
    setShowForm(false);
  };

  /**
   * Valida y guarda la serie (nueva o actualizada) en el estado 'objetivos'.
   */
  const handleSaveOrAddSerie = () => {
    // --- Validaciones de inputs ---
    if (tipoRep === 'fijo') {
      if (!repsMin || parseInt(repsMin, 10) < 1) {
        alert("Para 'Reps Fijo', introduce un número válido (>= 1).");
        return;
      }
    } else if (tipoRep === 'rango') {
      const min = parseInt(repsMin, 10);
      const max = parseInt(repsMax, 10);
      if (!repsMin || !repsMax || isNaN(min) || isNaN(max) || min < 1 || max < min) {
        alert("Para 'Rango', introduce un rango válido (Mín >= 1, Máx >= Mín).");
        return;
      }
    } else if (tipoRep === 'fallo') {
      const repsAprox = parseInt(repsMin, 10);
      if (repsMin && (isNaN(repsAprox) || repsAprox < 0)) { // Permite vacío o >= 0
        alert("Para 'Al Fallo', las repeticiones aproximadas deben ser un número válido (>= 0) o dejarse vacío.");
        return;
      }
    }
    const pesoNum = parseFloat(peso);
    if (peso && (isNaN(pesoNum) || pesoNum < 0)) {
      alert("El peso debe ser un número válido (>= 0) o dejarse vacío.");
      return;
    }
    const descansoNum = parseInt(descanso, 10);
    if (descanso && (isNaN(descansoNum) || descansoNum < 0)) {
      alert("El descanso debe ser un número válido (>= 0) o dejarse vacío.");
      return;
    }

    // --- Creación del objeto serie ---
    const serieActualizada = {
      tipo_rep_objetivo: tipoRep,
      reps_min_objetivo: (tipoRep !== 'fallo') ?
        (repsMin || null) : (repsMin && !isNaN(parseInt(repsMin, 10)) ? parseInt(repsMin, 10) : null),
      reps_max_objetivo: (tipoRep === 'rango') ?
        (repsMax || null) : null,
      peso_kg_objetivo: (peso && !isNaN(pesoNum)) ?
        pesoNum : null,
      descanso_seg_post: (descanso && !isNaN(descansoNum)) ?
        descansoNum : null,
      // Asegura que los campos de cardio estén nulos
      tiempo_min_objetivo: null,
      distancia_km_objetivo: null,
    };

    if (editingSerieNum !== null) {
      // --- Lógica para ACTUALIZAR una serie existente ---
      setObjetivos(objetivos.map(s =>
        s.num_serie === editingSerieNum
          ? { ...s, ...serieActualizada } // Actualiza la serie
          : s
      ));
      handleCancelOrReset(); // Oculta el form
    } else {
      // --- Lógica para AÑADIR una nueva serie ---
      const nuevaSerie = {
        ...serieActualizada,
        // Asigna el siguiente número de serie
        num_serie: (objetivos[objetivos.length - 1]?.num_serie || 0) + 1,
      };
      setObjetivos([...objetivos, nuevaSerie]); // Añade la nueva serie al array
      setShowForm(false); // Oculta el form
    }
  };

  /**
   * Borra una serie de la lista y renumera las restantes.
   */
  const handleRemoveSerie = (num_serie_to_remove) => {
    const seriesFiltradas = objetivos.filter(s => s.num_serie !== num_serie_to_remove);
    // Renumera las series restantes para mantener consistencia (1, 2, 3...)
    const seriesRenumeradas = seriesFiltradas.map((s, index) => ({ ...s, num_serie: index + 1 }));
    setObjetivos(seriesRenumeradas);

    // Si se estaba editando la serie que se borró, cancela la edición
    if (editingSerieNum === num_serie_to_remove) {
      handleCancelOrReset();
    }
  };

  return (
    <>
      {/* Lista de series (preview) */}
      <div className="lista-series-preview" style={{ gridColumn: '1 / -1' }}>
        {objetivos.length === 0 ? (
          <p className="subtitle" style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>Añade una serie...</p>
        ) : (
          objetivos.map(s => (
            <div
              key={s.id || s.num_serie} 
              className={`serie-preview-item ${s.num_serie === editingSerieNum ? 'editing-serie' : ''}`}
            >
              <span className="serie-info">
                <strong>Serie {s.num_serie}:</strong> {formatObjetivoNatural(s, 'fuerza')}
              </span>
              <div className="serie-actions">
                <button
                  type="button" className="btn-icon-edit"
                  onClick={() => handleSelectSerieForEdit(s)}
                  title="Editar esta serie"
                  disabled={editingSerieNum === s.num_serie} 
                >✏️</button>
                <button
                  type="button" className="btn-icon-delete"
                  onClick={() => handleRemoveSerie(s.num_serie)}
                  title="Borrar esta serie"
                >&times;</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón "+ Añadir Nueva Serie" */}
      {!showForm && (
        <div className="add-new-serie-container" style={{ gridColumn: '1 / -1' }}>
          <button type="button" className="btn-add-new-serie" onClick={handleShowAddForm}>
            + Añadir Nueva Serie
          </button>
        </div>
      )}

      {/* Formulario Inputs (CONDICIONAL) */}
      {showForm && (
        <div className="edit-serie-form" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--input-border-color)', paddingTop: '1rem', marginTop: '1rem' }}>

          {/* --- Grid para Reps (adaptado para fallo) --- */}
          <div className="form-rep-grid" style={{ gridColumn: 'span 3' }}>
            <div className="form-group-small">
              <label>Tipo Reps</label>
              <select value={tipoRep} onChange={(e) => setTipoRep(e.target.value)}>
                <option value="fijo">Fijo</option>
                <option value="rango">Rango</option>
                <option value="fallo">Al fallo</option>
              </select>
            </div>

            <div className="form-group-small">
              <label>{tipoRep === 'rango' ? 'Reps Mín' : (tipoRep === 'fallo' ? 'Reps Aprox.' : 'Reps')}</label>
              {tipoRep === 'fallo' ?
              (
                  <input
                    type="number" min="0"
                    value={repsMin}
                    // --- ¡CAMBIOS DE VALIDACIÓN! ---
                    name="repsMin"
                    onChange={handleValidationChange}
                    onKeyDown={(e) => handleNumericKeyDown(e, false)}
                    // --- FIN CAMBIOS ---
                  />
                ) : (
                  <input
                    type="number" min="1"
                    value={repsMin}
                    required
                    // --- ¡CAMBIOS DE VALIDACIÓN! ---
                    name="repsMin"
                    onChange={handleValidationChange}
                    onKeyDown={(e) => handleNumericKeyDown(e, false)}
                    // --- FIN CAMBIOS ---
                  />
                )}
            </div>

            {/* Input Máximo (solo para Rango) */}
            {tipoRep === 'rango' && (
              <div className="form-group-small">
                <label>Reps Máx</label>
                <input
                  type="number"
                  min={(parseInt(repsMin, 10) || 0) + 1}
                  value={repsMax}
                  required
                  // --- ¡CAMBIOS DE VALIDACIÓN! ---
                  name="repsMax"
                  onChange={handleValidationChange}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  // --- FIN CAMBIOS ---
                />
              </div>
            )}
          </div>

          {/* Inputs para Peso y Descanso */}
          <div className="form-group-small" style={{ gridColumn: tipoRep === 'rango' ? 'span 1' : 'span 2' }}>
            <label>Peso (kg)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              value={peso} 
              // --- ¡CAMBIOS DE VALIDACIÓN! ---
              name="peso"
              onChange={handleValidationChange} 
              onKeyDown={(e) => handleNumericKeyDown(e, true)}
              // --- FIN CAMBIOS ---
            />
          </div>
          <div className="form-group-small" style={{ gridColumn: tipoRep === 'rango' ? 'span 1' : 'span 1' }}>
            <label>Descanso (s)</label>
            <input 
              type="number" 
              min="0" 
              value={descanso} 
              placeholder="Opcional" 
              // --- ¡CAMBIOS DE VALIDACIÓN! ---
              name="descanso"
              onChange={handleValidationChange}
              onKeyDown={(e) => handleNumericKeyDown(e, false)}
              // --- FIN CAMBIOS ---
            />
          </div>

          {/* Botones Acción Serie */}
          <div className="form-actions-edit-serie" style={{ gridColumn: '1 / -1' }}>
            <button type="button" onClick={handleSaveOrAddSerie} className={editingSerieNum ? "btn-update-serie" : "btn-add-serie"}>
              {editingSerieNum ? `Actualizar Serie ${editingSerieNum}` : 'Confirmar Serie'}
            </button>
            <button type="button" className="btn-cancel-edit" onClick={handleCancelOrReset}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Componente interno para gestionar la edición de intervalos de CARDIO.
 */
const FormularioCardioEditable = ({ objetivos, setObjetivos }) => {
  // Estados de los inputs para cardio
  const [tiempo, setTiempo] = useState("");
  const [distancia, setDistancia] = useState("");
  const [descanso, setDescanso] = useState("");
  const [editingIntervaloNum, setEditingIntervaloNum] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // --- ¡NUEVO! Handler de validación para el formulario "Editar Cardio" ---
  const handleValidationChange = (e) => {
    const { name, value } = e.target;
    
    // Reglas de Regex
    const max4Int = /^\d{0,4}$/; // Máx 4 dígitos enteros
    const decimal_5_2 = /^(|\d{1,3}([.,]\d{0,2})?)$/; // Máx 999.99 (6 chars total)

    switch (name) {
      case 'tiempo':
        if (max4Int.test(value)) setTiempo(value);
        break;
      case 'distancia':
        if (decimal_5_2.test(value) && value.length <= 6) {
          setDistancia(value.replace(',', '.'));
        }
        break;
      case 'descanso':
        if (max4Int.test(value)) setDescanso(value);
        break;
      default:
        break;
    }
  };

  /**
   * Carga datos del intervalo seleccionado en el formulario.
   */
  const handleSelectIntervaloForEdit = (intervalo) => {
    setEditingIntervaloNum(intervalo.num_serie);
    setShowForm(true);
    setTiempo(intervalo.tiempo_min_objetivo || "");
    setDistancia(intervalo.distancia_km_objetivo || "");
    setDescanso(intervalo.descanso_seg_post || "");
  };

  /**
   * Muestra el formulario vacío para añadir un nuevo intervalo.
   */
  const handleShowAddForm = () => {
    setEditingIntervaloNum(null);
    setShowForm(true);
    setTiempo("");
    setDistancia("");
    setDescanso("");
  };

  /**
   * Oculta el formulario y resetea el estado de edición.
   */
  const handleCancelOrReset = () => {
    setEditingIntervaloNum(null);
    setShowForm(false);
  };

  /**
   * Valida y guarda el intervalo (nuevo o editado) en el estado 'objetivos'.
   */
  const handleSaveOrAddIntervalo = () => {
    // --- Validaciones Cardio ---
    const tiempoNum = parseInt(tiempo, 10);
    const distNum = parseFloat(distancia);
    const descansoNum = parseInt(descanso, 10);

    // Debe tener al menos tiempo o distancia
    if ((!tiempo || isNaN(tiempoNum) || tiempoNum <= 0) && (!distancia || isNaN(distNum) || distNum <= 0)) {
      alert("Introduce un valor válido (> 0) para Tiempo o Distancia.");
      return;
    }
    // Validaciones individuales (permiten 0 o vacío si el *otro* campo está relleno)
    if (tiempo && (isNaN(tiempoNum) || tiempoNum < 0)) {
      alert("El tiempo debe ser un número válido (>= 0).");
      return;
    }
    if (distancia && (isNaN(distNum) || distNum < 0)) {
      alert("La distancia debe ser un número válido (>= 0).");
      return;
    }
    if (descanso && (isNaN(descansoNum) || descansoNum < 0)) {
      alert("El descanso debe ser un número válido (>= 0) o dejarse vacío.");
      return;
    }

    // --- Creación del objeto intervalo ---
    const intervaloActualizado = {
      tiempo_min_objetivo: (tiempo && !isNaN(tiempoNum)) ? tiempoNum : null,
      distancia_km_objetivo: (distancia && !isNaN(distNum)) ? distNum : null,
      descanso_seg_post: (descanso && !isNaN(descansoNum)) ? descansoNum : null,
      // Asegura que los campos de fuerza estén nulos
      tipo_rep_objetivo: 'fijo', // Valor por defecto
      reps_min_objetivo: null,
      reps_max_objetivo: null,
      peso_kg_objetivo: null,
    };

    if (editingIntervaloNum !== null) {
      // --- Lógica para ACTUALIZAR ---
      setObjetivos(objetivos.map(i =>
        i.num_serie === editingIntervaloNum ? { ...i, ...intervaloActualizado } : i
      ));
      handleCancelOrReset();
    } else {
      // --- Lógica para AÑADIR ---
      const nuevoIntervalo = {
        ...intervaloActualizado,
        num_serie: (objetivos[objetivos.length - 1]?.num_serie || 0) + 1,
      };
      setObjetivos([...objetivos, nuevoIntervalo]);
      setShowForm(false);
    }
  };

  /**
   * Borra un intervalo de la lista y renumera los restantes.
   */
  const handleRemoveIntervalo = (num_serie_to_remove) => {
    const intervalosFiltrados = objetivos.filter(i => i.num_serie !== num_serie_to_remove);
    const intervalosRenumerados = intervalosFiltrados.map((i, index) => ({ ...i, num_serie: index + 1 }));
    setObjetivos(intervalosRenumerados);
    if (editingIntervaloNum === num_serie_to_remove) {
      handleCancelOrReset();
    }
  };

  return (
    <>
      {/* Lista de intervalos (preview) */}
      <div className="lista-series-preview" style={{ gridColumn: '1 / -1' }}>
        {objetivos.length === 0 ? (
          <p className="subtitle" style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>Añade un intervalo...</p>
        ) : (
          objetivos.map(i => (
            <div
              key={i.id || i.num_serie}
              className={`serie-preview-item ${i.num_serie === editingIntervaloNum ? 'editing-serie' : ''}`}
            >
              <span className="serie-info">
                <strong>Intervalo {i.num_serie}:</strong> {formatObjetivoNatural(i, 'cardio')}
              </span>
              <div className="serie-actions">
                <button type="button" className="btn-icon-edit" onClick={() => handleSelectIntervaloForEdit(i)} title="Editar intervalo" disabled={editingIntervaloNum === i.num_serie}>✏️</button>
                <button type="button" className="btn-icon-delete" onClick={() => handleRemoveIntervalo(i.num_serie)} title="Borrar intervalo">&times;</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón "+ Añadir Nuevo Intervalo" */}
      {!showForm && (
        <div className="add-new-serie-container" style={{ gridColumn: '1 / -1' }}>
          <button type="button" className="btn-add-new-serie" onClick={handleShowAddForm}>
            + Añadir Nuevo Intervalo
          </button>
        </div>
      )}

      {/* Formulario Inputs Cardio (CONDICIONAL) */}
      {showForm && (
        <div className="edit-serie-form" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--input-border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
          <div className="form-grid">
            <div className="form-group-small">
              <label>Tiempo (min)</label>
              <input
                type="number" min="0" step="1" 
                value={tiempo} 
                // --- ¡CAMBIOS DE VALIDACIÓN! ---
                name="tiempo"
                onChange={handleValidationChange}
                onKeyDown={(e) => handleNumericKeyDown(e, false)}
                // --- FIN CAMBIOS ---
              />
            </div>
            <div className="form-group-small">
              <label>Distancia (km)</label>
              <input 
                type="number" min="0" step="0.01"
                value={distancia} 
                // --- ¡CAMBIOS DE VALIDACIÓN! ---
                name="distancia"
                onChange={handleValidationChange} 
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                // --- FIN CAMBIOS ---
              />
            </div>
            <div className="form-group-small">
              <label>Descanso (s)</label>
              <input 
                type="number" min="0" 
                value={descanso} 
                placeholder="Opcional" 
                // --- ¡CAMBIOS DE VALIDACIÓN! ---
                name="descanso"
                onChange={handleValidationChange}
                onKeyDown={(e) => handleNumericKeyDown(e, false)}
                // --- FIN CAMBIOS ---
              />
            </div>
          </div>

          {/* Botones Acción Intervalo */}
          <div className="form-actions-edit-serie" style={{ gridColumn: '1 / -1' }}>
            <button type="button" onClick={handleSaveOrAddIntervalo} className={editingIntervaloNum ? "btn-update-serie" : "btn-add-serie"}>
              {editingIntervaloNum ? `Actualizar Intervalo ${editingIntervaloNum}` : 'Confirmar Intervalo'}
            </button>
            <button type="button" className="btn-cancel-edit" onClick={handleCancelOrReset}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};


/**
 * Componente Principal del Modal para Editar un Ejercicio en una Rutina.
 */
function EditarEjercicioModal({ isOpen, onClose, ejercicio, onGuardar, maxOrden }) {
  // Estado para el orden del ejercicio en la rutina
  const [orden, setOrden] = useState(1);
  // Estado para la lista de objetivos (series o intervalos)
  const [objetivos, setObjetivos] = useState([]);
  // Estado para errores de la API al guardar
  const [apiError, setApiError] = useState(null);

  /**
   * Efecto para cargar los datos del ejercicio en el estado local del modal
   */
  useEffect(() => {
    if (isOpen && ejercicio) {
      setOrden(ejercicio.orden);
      // Clona el array de objetivos para evitar mutaciones directas del estado padre
      setObjetivos(ejercicio.objetivos ? [...ejercicio.objetivos] : []);
      setApiError(null); // Limpia errores previos
    } else if (!isOpen) {
      // Resetea estados al cerrar para evitar mostrar datos viejos
      setOrden(1);
      setObjetivos([]);
      setApiError(null);
    }
  }, [isOpen, ejercicio]); // Se ejecuta si isOpen o ejercicio cambian

  /**
   * Manejador del submit del formulario principal del modal.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null); // Limpia errores antes de intentar guardar

    // Validaciones básicas antes de enviar
    if (parseInt(orden, 10) < 1) {
      setApiError("El orden debe ser 1 o mayor.");
      return;
    }
    if (objetivos.length === 0) {
      setApiError(`Debes definir al menos un${ejercicio.tipo === 'cardio' ? ' intervalo' : 'a serie'}.`);
      return;
    }

    // Renumera las series/intervalos por si se borró alguna intermedia
    const objetivosRenumerados = objetivos.map((o, i) => ({ ...o, num_serie: i + 1 }));
    
    // Prepara el objeto final para enviar a la API
    const datosAGuardar = {
      id: ejercicio.id, // ID de la tabla rutina_ejercicios
      orden: parseInt(orden, 10),
      objetivos: objetivosRenumerados // El array actualizado de series/intervalos
    };
    
    // Llama a la función onGuardar pasada como prop
    onGuardar(datosAGuardar, setApiError);
  };

  // Si el modal no debe estar abierto o no hay datos del ejercicio, no renderiza nada
  if (!isOpen || !ejercicio) {
    return null;
  }

  // Renderizado del modal
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del modal */}
        <div className="modal-header">
          <h3>Editar Ejercicio</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Formulario principal */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Muestra errores de validación o de la API aquí */}
          {apiError && <div className="message" style={{ marginBottom: '1rem' }}>{apiError}</div>}

          {/* Nombre del ejercicio (no editable) */}
          <p className="edit-ejercicio-nombre">{ejercicio.nombre_ejercicio} ({ejercicio.tipo})</p>

          {/* Grid para inputs */}
          <div className="edit-form-grid">

            {/* Selector para el Orden del Ejercicio */}
            <div className="form-group-small" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="orden-ejercicio">Orden en la Rutina</label>
              <select
                id="orden-ejercicio"
                name="orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                required
              >
                {/* Genera dinámicamente las opciones de orden (1 hasta maxOrden) */}
                {maxOrden > 0 &&
                  Array.from({ length: maxOrden }, (_, i) => i + 1)
                    .map(numero => (
                      <option key={numero} value={numero}>
                        {numero}
                      </option>
                    ))
                }
                {(!maxOrden || maxOrden === 0) && (
                  <option value={orden}>{orden}</option>
                )}
              </select>
            </div>

            {/* Renderiza el componente adecuado para editar Fuerza o Cardio */}
            {ejercicio.tipo === 'cardio' ?
              (<FormularioCardioEditable objetivos={objetivos} setObjetivos={setObjetivos} />)
              :
              (<FormularioFuerzaEditable objetivos={objetivos} setObjetivos={setObjetivos} />)
            }
          </div>

          {/* Footer con el botón de guardar */}
          <div className="modal-footer">
            <button type="submit" className="transparent-btn"> Guardar Cambios </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarEjercicioModal;