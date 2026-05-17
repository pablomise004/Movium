import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import iconoInicio from './assets/inicio.png';
import iconoCrear from './assets/crear-ejercicios.png';
import './PanelPrincipal.css';
import { API_BASE_URL } from './config';

const MAX_TITULO = 38;
const MAX_DIAS = 60;

function PanelPrincipal() {

  const formatearFechaRelativa = (fechaIso) => {
    if (!fechaIso) return 'Nunca entrenada';
    const fechaSesion = new Date(fechaIso);
    const hoy = new Date();
    const diffMs = hoy - fechaSesion;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDias === 0) return 'Hoy';
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return fechaSesion.toLocaleDateString('es-ES', { weekday: 'long' });
    return fechaSesion.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const [rutinas, setRutinas] = useState([]);
  const [creando, setCreando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [nombreRutinaNueva, setNombreRutinaNueva] = useState("");
  const [diasRutinaNueva, setDiasRutinaNueva] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('movium_token');

    if (token) {
      const datosUsuario = JSON.parse(localStorage.getItem('movium_user') || '{}');
      setNombreUsuario(datosUsuario.nombre_usuario || '');
    } else {
      setError("Error de autenticación. No se encontró token.");
    }

    const cargarRutinas = async () => {
      const respuesta = await fetch(`${API_BASE_URL}get_rutinas.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) setError(datos.mensaje || 'No se pudieron cargar las rutinas.');
      else setRutinas(datos);
      setCargando(false);
    };

    if (token) {
      cargarRutinas();
    } else {
      setCargando(false);
    }
  }, []);

  const crearRutina = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('movium_token');

    if (!token) {
      setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
      return;
    }

    const respuesta = await fetch(`${API_BASE_URL}crear_rutina.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre_rutina: nombreRutinaNueva,
        dias_semana: diasRutinaNueva
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      setError(datos.mensaje || 'Error desconocido al crear la rutina.');
      return;
    }

    if (datos.rutina && datos.rutina.id) {
      navigate(`/rutina/${datos.rutina.id}`);
    } else {
      setError("Rutina creada, pero no se pudo obtener el ID para redirigir.");
      setCreando(false);
      window.location.reload();
    }
  };

  const cancelarCrear = () => {
    setCreando(false);
    setError(null);
    setNombreRutinaNueva("");
    setDiasRutinaNueva("");
  };

  return (
    <>
      <div className="dashboard-container">

        {creando ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
              <img src={iconoCrear} alt="" width="64" height="64" />
               <h2>Crear Nueva Rutina</h2>
            </div>
            <p className="subtitle" style={{ textAlign: 'center' }}>
               Define el nombre y los días para tu nueva rutina.
            </p>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
              <img src={iconoInicio} alt="" width="64" height="64" />
              <h2>Hola {nombreUsuario || 'Usuario'} ¡Bienvenido de nuevo!</h2>
            </div>
            <p className="subtitle" style={{ textAlign: 'center' }}>
              Selecciona una rutina para empezar o crea una nueva.
            </p>
          </>
        )}

        {error && <div className="message">{error}</div>}

        {!creando && (
          <div className="button-group" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <button
              className="transparent-btn"
              style={{ flex: 'none', width: 'auto', padding: '0 2rem' }}
              onClick={() => setCreando(true)}
            >
              Crear Nueva Rutina
            </button>
          </div>
        )}

        {creando ? (
          <form className="rutina-form" onSubmit={crearRutina}>

            <div className="form-group">
              <label htmlFor="nombre_rutina">Nombre de la Rutina</label>
              <input
                type="text"
                id="nombre_rutina"
                name="nombre_rutina"
                placeholder="Ej: Día de Pecho y Tríceps"
                required
                maxLength={MAX_TITULO}
                value={nombreRutinaNueva}
                onChange={(e) => setNombreRutinaNueva(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dias_semana">Días / Descripción</label>
              <input
                type="text"
                id="dias_semana"
                name="dias_semana"
                placeholder="Ej: Lunes, Jueves / Rutina enfocada en hipertrofia"
                maxLength={MAX_DIAS}
                value={diasRutinaNueva}
                onChange={(e) => setDiasRutinaNueva(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-edit"
                onClick={cancelarCrear}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-start">Guardar Rutina</button>
            </div>
          </form>

        ) : (
          cargando ? (
            <div className="loading-container">
              <p className="no-rutinas-msg">Cargando tus rutinas...</p>
            </div>
          ) : (
            <div className="rutinas-grid">
              {rutinas.length === 0 && !error ? (
                <p className="no-rutinas-msg">Aún no tienes ninguna rutina...</p>
              ) : (
                rutinas.map((rutina) => {
                  const fechaRelativa = formatearFechaRelativa(rutina.ultima_sesion);
                  const nuncaEntrenada = fechaRelativa === 'Nunca entrenada';
                  return (
                    <div className="rutina-card" key={rutina.id}>
                      <button
                        className="btn-edit-icon"
                        onClick={() => navigate(`/rutina/${rutina.id}`)}
                        title="Editar rutina"
                      >
                        ✏️
                      </button>

                      <h3>{rutina.nombre}</h3>
                      <p>{rutina.dias || rutina.dias_semana || ''}</p>

                      <p
                        className="ultima-sesion"
                        style={{fontStyle: nuncaEntrenada ? 'italic' : 'normal' }}
                      >
                        { fechaRelativa.includes('/') ?
                          `Última vez: ${fechaRelativa}` : fechaRelativa
                        }
                      </p>

                      <div className="card-actions">
                        <button
                          className="btn-edit"
                          onClick={() => navigate(`/progreso/${rutina.id}`)}
                        >
                          Progreso
                        </button>
                        <button
                          className="btn-start"
                          onClick={() => navigate(`/sesion/${rutina.id}`)}
                        >
                          Entrenar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
        )}
      </div>

    </>
  );
}

export default PanelPrincipal;