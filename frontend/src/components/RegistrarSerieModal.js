// ---- frontend/src/components/RegistrarSerieModal.js (CORREGIDO - Función añadida) ----

import React, { useState, useEffect } from 'react';
import './RegistrarSerieModal.css';

// --- Función de formateo V6.0 (Usa SIEMPRE el objetivo original para el texto) ---
const formatObjetivoText = (objOriginal, tipo) => {
  // Asegurarse de que objOriginal no sea undefined o null
  if (!objOriginal) return "Objetivo no definido";
  if (tipo === 'cardio') {
    const metricas = [];
    if (objOriginal.tiempo_min_objetivo != null) metricas.push(`${objOriginal.tiempo_min_objetivo} min`);
    if (objOriginal.distancia_km_objetivo != null) metricas.push(`${objOriginal.distancia_km_objetivo} km`);
    if (metricas.length === 0) return "Objetivo: Registrar cardio";
    // Une con " y " o ", "
    if (metricas.length > 2) {
        return `Objetivo: ${metricas.slice(0, -1).join(', ')} y ${metricas.slice(-1)}`;
    } else {
        return `Objetivo: ${metricas.join(' y ')}`;
    }
  }

  // Lógica Fuerza V6.0 (usa objOriginal)
  let repStr = "";
  if (objOriginal.tipo_rep_objetivo === 'fallo') {
    repStr = "Al Fallo";
  } else if (objOriginal.tipo_rep_objetivo === 'rango') {
    repStr = `${objOriginal.reps_min_objetivo ?? '?'} - ${objOriginal.reps_max_objetivo ?? '?'} reps`; // Usamos guion
  } else { // 'fijo'
    repStr = `${objOriginal.reps_min_objetivo ?? '?'} reps`;
  }

  let pesoStr = objOriginal.peso_kg_objetivo != null ? ` con ${objOriginal.peso_kg_objetivo} kg` : '';
  return `Objetivo: ${repStr}${pesoStr}`;
};

// --- ¡¡NUEVO!! Definición de formatObjetivoNatural ---
const formatObjetivoNatural = (obj, tipo) => {
  if (!obj) return ''; // Seguridad

  if (tipo === 'cardio') {
    const metricas = [];
    if (obj.tiempo_min_objetivo) metricas.push(`${obj.tiempo_min_objetivo} min`);
    if (obj.distancia_km_objetivo) metricas.push(`${obj.distancia_km_objetivo} km`);

    // Une con " y " o ", " según cuántos elementos haya
    if (metricas.length > 2) {
        // (Esta lógica ya no es necesaria con 2 campos, pero no hace daño)
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

  // Añadir peso con "con"
  if (obj.peso_kg_objetivo != null) {
    textoPrincipal += ` con ${obj.peso_kg_objetivo} kg`;
  }

  // Añadir descanso (lo dejamos entre paréntesis como antes, es claro)
  if (obj.descanso_seg_post != null) {
    textoPrincipal += ` (${obj.descanso_seg_post}s)`;
  }

  return textoPrincipal;
};
// --- FIN NUEVO ---


// --- Función para formatear el Tooltip (más detallado) ---
const formatTooltip = (objetivo, serieReal, tipo) => {
    // La llamada a formatObjetivoNatural ahora funciona porque está definida arriba
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
            tooltip += ` ${serieReal.repeticiones_realizadas ?? '?'} reps`;
            if (serieReal.fue_al_fallo) tooltip += ` (¡Al Fallo!)`;
            if (serieReal.peso_kg_usado != null) tooltip += ` con ${serieReal.peso_kg_usado} kg`;
        }
        if (serieReal.notas_serie) tooltip += `\nNotas: ${serieReal.notas_serie}`;
    }
    return tooltip;
};

function RegistrarSerieModal({ isOpen, onClose, datosSerie, onGuardar }) {
  // ... (Resto del componente sin cambios) ...
  // Estados
  const [reps, setReps] = useState('');
  const [peso, setPeso] = useState('');
  const [fueAlFallo, setFueAlFallo] = useState(false);
  const [tiempo, setTiempo] = useState('');
  const [dist, setDist] = useState('');
  const [apiError, setApiError] = useState(null);
  const [objetivoTexto, setObjetivoTexto] = useState("Objetivo:");
  const [notas, setNotas] = useState('');
  const MAX_NOTAS_LENGTH = 1000;

  // useEffect para cargar datos
  useEffect(() => {
    if (isOpen && datosSerie && datosSerie.objetivoOriginal) {
      const { objetivoOriginal, datosGuardados, tipo } = datosSerie;
      setObjetivoTexto(formatObjetivoText(objetivoOriginal, tipo));
      const fuenteDatosInputs = datosGuardados || objetivoOriginal;
      if(tipo === 'cardio') {
        setTiempo(fuenteDatosInputs.tiempo_min_realizado ?? fuenteDatosInputs.tiempo_min_objetivo ?? '');
        setDist(fuenteDatosInputs.distancia_km_realizada ?? fuenteDatosInputs.distancia_km_objetivo ?? '');
        setReps(''); setPeso(''); setFueAlFallo(false);
      } else {
        setReps(String(fuenteDatosInputs.repeticiones_realizadas ?? objetivoOriginal.reps_min_objetivo ?? ''));
        setPeso(String(fuenteDatosInputs.peso_kg_usado ?? objetivoOriginal.peso_kg_objetivo ?? ''));
        setFueAlFallo(fuenteDatosInputs.fue_al_fallo ?? (objetivoOriginal.tipo_rep_objetivo === 'fallo'));
        setTiempo(''); setDist('');
      }
      setNotas(datosGuardados?.notas_serie || datosSerie.notas || '');
      setApiError(null);
    } else if (!isOpen) {
       setReps(''); setPeso(''); setFueAlFallo(false);
       setTiempo(''); setDist('');
       setNotas(''); setApiError(null); setObjetivoTexto("Objetivo:");
    }
  }, [isOpen, datosSerie]);

  // Handler del Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);
    if (!datosSerie) return;
    const { tipo } = datosSerie;
    let datosFinales = { notas };
    if (tipo === 'cardio') {
      if (!tiempo && !dist) {
        setApiError("Debes registrar al menos un valor cardio."); return;
      }
      datosFinales = { ...datosFinales, tiempo: tiempo || null, dist: dist || null };
    } else {
      const repsNum = parseFloat(reps);
      if (isNaN(repsNum) || repsNum < 0) {
        setApiError("Las repeticiones deben ser un número válido (0 o más)."); return;
      }
      const pesoNum = parseFloat(peso);
      if (peso !== '' && peso !== null && (isNaN(pesoNum) || pesoNum < 0)) {
        setApiError("El peso no puede ser negativo."); return;
      }
      datosFinales = {
        ...datosFinales,
        reps: parseInt(reps, 10),
        fue_al_fallo: fueAlFallo,
        peso: (peso === '' || peso === null) ? null : parseFloat(peso)
      };
    }
    onGuardar(datosFinales);
  };

  // Handler para notas
  const handleNotasChange = (e) => {
    if (e.target.value.length <= MAX_NOTAS_LENGTH) {
      setNotas(e.target.value);
    }
  };

  if (!isOpen || !datosSerie) { return null; }
  const ejercicio = datosSerie.ejercicio || { nombre_ejercicio: "Ejercicio desconocido" };
  const numSerie = datosSerie.numSerie;
  const tipo = datosSerie.tipo;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{ejercicio.nombre_ejercicio} - Serie {numSerie}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <p className="objetivo-texto">{objetivoTexto}</p>
          {apiError && <div className="message" style={{marginBottom: '1rem'}}>{apiError}</div>}
          {tipo === 'cardio' ? (
            <div className="form-grid-registro" style={{gridTemplateColumns: '1fr 1fr'}}>
               <div className="form-group-small">
                <label>Tiempo (min)</label>
                <input type="number" min="0" value={tiempo} onChange={(e) => setTiempo(e.target.value)} placeholder="0" />
               </div>
              <div className="form-group-small">
                <label>Distancia (km)</label>
                <input type="number" step="0.1" min="0" value={dist} onChange={(e) => setDist(e.target.value)} placeholder="0.0"/>
              </div>
            </div>
          ) : (
            <>
              <div className="form-grid-registro">
                <div className="form-group-small">
                  <label>Reps Realizadas</label>
                  <input type="number" min="0" value={reps} onChange={(e) => setReps(e.target.value)} required placeholder="0"/>
                </div>
                <div className="form-group-small">
                  <label>Peso Usado (kg)</label>
                  <input type="number" step="0.5" min="0" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0.0"/>
                </div>
              </div>
              <div className="form-group-checkbox">
                 <input type="checkbox" id={`fallo_check_${numSerie}`} checked={fueAlFallo} onChange={(e) => setFueAlFallo(e.target.checked)} />
                 <label htmlFor={`fallo_check_${numSerie}`}>Marcar como serie al fallo</label>
              </div>
            </>
          )}
          <div className="form-group-small" style={{marginTop: '1rem'}}>
            <label htmlFor={`notas_serie_${numSerie}`}>Notas (opcional)</label>
            <textarea
              id={`notas_serie_${numSerie}`}
              value={notas}
              onChange={handleNotasChange}
              placeholder="Ej: Buenas sensaciones..."
              rows="3"
              maxLength={MAX_NOTAS_LENGTH}
            />
            <small style={{ textAlign: 'right', color: 'var(--text-secondary-color)', marginTop: '0.25rem' }}>
              {notas.length} / {MAX_NOTAS_LENGTH}
            </small>
          </div>
          <div className="modal-footer">
             <button type="submit" className="transparent-btn">Guardar Serie</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarSerieModal;