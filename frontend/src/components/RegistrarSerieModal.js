import React, { useState, useEffect } from 'react';
import './RegistrarSerieModal.css';
import { formatearObjetivo } from '../utils/formato';

function RegistrarSerieModal({ isOpen, onClose, datosSerie, onGuardar }) {
  const [reps, setReps] = useState('');
  const [peso, setPeso] = useState('');
  const [alFallo, setAlFallo] = useState(false);
  const [tiempo, setTiempo] = useState('');
  const [distancia, setDistancia] = useState('');
  const [errorApi, setErrorApi] = useState(null);
  const [textoObjetivo, setTextoObjetivo] = useState("Objetivo:");
  const [notas, setNotas] = useState('');
  const MAX_NOTAS_LENGTH = 1000;

  useEffect(() => {
    if (isOpen && datosSerie && datosSerie.objetivoOriginal) {
      const { objetivoOriginal, datosGuardados, tipo } = datosSerie;
      setTextoObjetivo('Objetivo: ' + formatearObjetivo(objetivoOriginal, tipo));
      const fuenteDatosInputs = datosGuardados || objetivoOriginal;
      if(tipo === 'cardio') {
        setTiempo(fuenteDatosInputs.tiempo_min_realizado || fuenteDatosInputs.tiempo_min_objetivo || '');
        setDistancia(fuenteDatosInputs.distancia_km_realizada || fuenteDatosInputs.distancia_km_objetivo || '');
        setReps(''); setPeso(''); setAlFallo(false);
      } else {
        setReps(String(fuenteDatosInputs.repeticiones_realizadas || objetivoOriginal.reps_min_objetivo || ''));
        setPeso(String(fuenteDatosInputs.peso_kg_usado || objetivoOriginal.peso_kg_objetivo || ''));
        let eraAlFallo = false;
        if (datosGuardados && datosGuardados.fue_al_fallo !== undefined) {
          eraAlFallo = datosGuardados.fue_al_fallo;
        } else {
          eraAlFallo = objetivoOriginal.tipo_rep_objetivo === 'fallo';
        }
        setAlFallo(eraAlFallo);
        setTiempo(''); setDistancia('');
      }
      const notasGuardadas = datosGuardados ? datosGuardados.notas_serie : '';
      setNotas(notasGuardadas || datosSerie.notas || '');
      setErrorApi(null);
    } else if (!isOpen) {
       setReps(''); setPeso(''); setAlFallo(false);
       setTiempo(''); setDistancia('');
       setNotas(''); setErrorApi(null); setTextoObjetivo("Objetivo:");
    }
  }, [isOpen, datosSerie]);

  const guardar = (e) => {
    e.preventDefault();
    setErrorApi(null);
    if (!datosSerie) return;
    const { tipo } = datosSerie;
    let datosFinales = { notas };
    if (tipo === 'cardio') {
      if (!tiempo && !distancia) {
        setErrorApi("Debes registrar al menos un valor cardio."); return;
      }
      datosFinales = { ...datosFinales, tiempo: tiempo || null, dist: distancia || null };
    } else {
      const repsNum = parseFloat(reps);
      if (isNaN(repsNum) || repsNum < 0) {
        setErrorApi("Las repeticiones deben ser un número válido (0 o más)."); return;
      }
      const pesoNum = parseFloat(peso);
      if (peso !== '' && peso !== null && (isNaN(pesoNum) || pesoNum < 0)) {
        setErrorApi("El peso no puede ser negativo."); return;
      }
      datosFinales = {
        ...datosFinales,
        reps: parseInt(reps, 10),
        fue_al_fallo: alFallo,
        peso: (peso === '' || peso === null) ? null : parseFloat(peso)
      };
    }
    onGuardar(datosFinales);
  };

  const manejarNotas = (e) => {
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
        <form className="modal-form" onSubmit={guardar}>
          <p className="objetivo-texto">{textoObjetivo}</p>
          {errorApi && <div className="message" style={{marginBottom: '1rem'}}>{errorApi}</div>}
          {tipo === 'cardio' ? (
            <div className="form-grid-registro" style={{gridTemplateColumns: '1fr 1fr'}}>
               <div className="form-group-small">
                <label>Tiempo (min)</label>
                <input type="number" min="0" value={tiempo} onChange={(e) => setTiempo(e.target.value)} placeholder="0" />
               </div>
              <div className="form-group-small">
                <label>Distancia (km)</label>
                <input type="number" step="0.1" min="0" value={distancia} onChange={(e) => setDistancia(e.target.value)} placeholder="0.0"/>
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
                 <input type="checkbox" id={`fallo_check_${numSerie}`} checked={alFallo} onChange={(e) => setAlFallo(e.target.checked)} />
                 <label htmlFor={`fallo_check_${numSerie}`}>Marcar como serie al fallo</label>
              </div>
            </>
          )}
          <div className="form-group-small" style={{marginTop: '1rem'}}>
            <label htmlFor={`notas_serie_${numSerie}`}>Notas (opcional)</label>
            <textarea
              id={`notas_serie_${numSerie}`}
              value={notas}
              onChange={manejarNotas}
              placeholder="Ej: Buenas sensaciones..."
              rows="3"
              maxLength={MAX_NOTAS_LENGTH}
            />
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