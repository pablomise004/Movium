// Pagina principal de rutinas

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Assets
import iconoInicio from './assets/inicio.png';
import iconoCrear from './assets/crear-ejercicios.png';

// CSS
import './PanelPrincipal.css';
// Importar el CSS de RutinaDetalle para usar la clase .char-counter
import './RutinaDetalle.css';

import { API_BASE_URL } from './configuracion';

// Constantes
const MAX_TITULO = 38;
const MAX_DIAS = 60;

function Dashboard() {

  // Devuelve texto legible para la fecha de la ultima sesion
  const formatearFechaRelativa = (fechaIso) => {
    if (!fechaIso) { return 'Nunca entrenada'; }
    try {
      const fechaSesion = new Date(fechaIso);
      fechaSesion.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const diffTiempo = hoy - fechaSesion;
      const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

      if (diffDias === 0) { return 'Hoy'; }
      else if (diffDias === 1) { return 'Ayer'; }
      else if (diffDias > 1 && diffDias < 7) {
        const nombreDia = fechaSesion.toLocaleDateString('es-ES', { weekday: 'long' });
        const nombreDiaOk = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
        return `${nombreDiaOk}`;
      } else {
        return fechaSesion.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  // Estados
  const [rutinas, setRutinas] = useState([]);
  const [creando, setCreando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  // Estados del formulario de creacion
  const [nombreRutinaNueva, setNombreRutinaNueva] = useState("");
  const [diasRutinaNueva, setDiasRutinaNueva] = useState("");
  
  // Hooks
  const navigate = useNavigate();

  // Efectos
  // Cargar rutinas y nombre de usuario al montar
  useEffect(() => {
    const token = localStorage.getItem('movium_token');
    
    if (token) {
      const datosUsuario = JSON.parse(localStorage.getItem('movium_user') || '{}');
      setNombreUsuario(datosUsuario.nombre_usuario || '');
    } else {
      setError("Error de autenticación. No se encontró token.");
    }
        
    // Cargar rutinas
    const cargarRutinas = async () => {
      try {
        if (!token) { 
          throw new Error("Error de autenticación. Por favor, inicia sesión de nuevo."); 
        }
        const respuesta = await fetch(`${API_BASE_URL}get_rutinas.php`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.mensaje || 'No se pudieron cargar las rutinas.');
        }
        console.log('rutinas cargadas:', datos);
        setRutinas(datos);
      } catch (error) {
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };

    if (token) { 
      cargarRutinas(); 
    } else { 
      setCargando(false); 
    }
  }, []); // Se ejecuta solo una vez al montar

  // Handlers

  // Navega a una ruta especifica
  const irA = (ruta) => { 
    navigate(ruta); 
  };

  // Envia la solicitud para crear una nueva rutina
  const crearRutina = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Lee desde los estados
    const nombreRutina = nombreRutinaNueva;
    const diasSemana = diasRutinaNueva;
    
    const token = localStorage.getItem('movium_token');
    
    if (!token) { 
      setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
      return;
    }

    try {
      const respuesta = await fetch(`${API_BASE_URL}crear_rutina.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre_rutina: nombreRutina,
          dias_semana: diasSemana
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'Error desconocido al crear la rutina.');
      }

      if (datos.rutina && datos.rutina.id) {
        navigate(`/rutina/${datos.rutina.id}`);
      } else {
        setError("Rutina creada, pero no se pudo obtener el ID para redirigir.");
        setCreando(false);
        window.location.reload();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Limpia el formulario y cierra el modo creacion
  const cancelarCrear = () => {
    setCreando(false);
    setError(null);
    setNombreRutinaNueva("");
    setDiasRutinaNueva("");
  };

  // Renderizado
  return (
    <>
      <div className="dashboard-container">

        {/* Cabecera: titulo e icono */}
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

        {/* Zona de errores */}
        {error && <div className="message">{error}</div>}

        {/* Boton "Crear Nueva Rutina" */}
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

        {/* Contenido principal: formulario o lista de rutinas */}
        {creando ? (
          
          // Formulario de creacion (controlado)
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
          
          // Lista de rutinas
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
                        onClick={() => irA(`/rutina/${rutina.id}`)} 
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
                        {/* Logica de fecha */}
                        {/* Si incluye '/', es fecha completa; si no, es relativa */}
                        { fechaRelativa.includes('/') ? 
                          `Última vez: ${fechaRelativa}` : fechaRelativa 
                        }
                      </p>

                      <div className="card-actions">
                        <button 
                          className="btn-edit" 
                          onClick={() => irA(`/progreso/${rutina.id}`)}
                        >
                          Progreso
                        </button>
                        <button 
                          className="btn-start" 
                          onClick={() => irA(`/sesion/${rutina.id}`)}
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

export default Dashboard;