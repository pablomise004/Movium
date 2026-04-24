// ---- frontend/src/Dashboard.js (Refactorizado con contadores y lógica de fecha corregida) ----

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Assets
import iconoInicio from './assets/inicio.png';
import iconoCrear from './assets/crear-ejercicios.png';

// CSS
import './Dashboard.css';
// Importamos el CSS de RutinaDetalle para usar la clase .char-counter
import './RutinaDetalle.css'; 

import { API_BASE_URL } from './config';

// ==================================================================
// --- (1) Helper Functions ---
// ==================================================================

/**
 * Decodifica el payload de un token JWT.
 */
const decodeToken = (token) => {
  try {
    const payloadBase64 = token.split('.')[1];
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decodificando token:", e);
    return null;
  }
};

/**
 * Formatea una fecha ISO a un string relativo (Hoy, Ayer, Jueves, En el futuro, etc.)
 */
const formatRelativeDate = (dateString) => {
  if (!dateString) { return 'Nunca entrenada'; }
  try {
    const sessionDate = new Date(dateString);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Invertimos la resta para comprobar si es en el futuro
    const diffTimeFuturo = sessionDate - today;

    if (diffTimeFuturo > 0) {
      return 'En el futuro';
    }

    // Lógica original para el pasado
    const diffTimePasado = today - sessionDate;
    const diffDays = Math.floor(diffTimePasado / (1000 * 60 * 60 * 24));

    if (diffDays === 0) { return 'Hoy'; }
    else if (diffDays === 1) { return 'Ayer'; }
    else if (diffDays > 1 && diffDays < 7) {
      const dayName = sessionDate.toLocaleDateString('es-ES', { weekday: 'long' });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      // --- ¡CAMBIO APLICADO! Se quita " pasado" ---
      return `${capitalizedDayName}`;
    } else {
      return sessionDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch (e) { 
    console.error("Error formateando fecha relativa:", dateString, e); 
    return 'Fecha inválida'; 
  }
};

// ==================================================================
// --- (2) Constants ---
// ==================================================================

const MAX_TITULO_LENGTH = 38;
const MAX_DIAS_LENGTH = 60;

// ==================================================================
// --- (3) Main Component ---
// ==================================================================

function Dashboard() {
  
  // --- Estados ---
  const [rutinas, setRutinas] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  // Estados para el formulario de creación (Inputs Controlados)
  const [newRutinaNombre, setNewRutinaNombre] = useState("");
  const [newRutinaDias, setNewRutinaDias] = useState("");
  
  // --- Hooks ---
  const navigate = useNavigate();

  // --- Efectos ---
  
  // Cargar rutinas y nombre de usuario al montar
  useEffect(() => {
    const token = localStorage.getItem('movium_token');
    
    // 1. Decodificar token (síncrono)
    if (token) {
      const decodedPayload = decodeToken(token);
      if (decodedPayload?.data?.nombre_usuario) { 
        setNombreUsuario(decodedPayload.data.nombre_usuario); 
      } else { 
        console.error("Nombre de usuario no encontrado en el token."); 
      }
    } else { 
      setError("Error de autenticación. No se encontró token."); 
    }
        
    // 2. Cargar rutinas (asíncrono)
    const cargarRutinas = async () => {
      try {
        if (!token) { 
          throw new Error("Error de autenticación. Por favor, inicia sesión de nuevo."); 
        }
        const response = await fetch(`${API_BASE_URL}get_rutinas.php`, { 
          method: 'GET', 
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          } 
        });
        const data = await response.json();
    
        if (!response.ok) { 
          throw new Error(data.mensaje || 'No se pudieron cargar las rutinas.'); 
        }
        setRutinas(data);
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    };

    if (token) { 
      cargarRutinas(); 
    } else { 
      setLoading(false); 
    }
  }, []); // Se ejecuta solo una vez al montar

  // --- Handlers ---

  /**
   * Navega a una ruta específica.
   */
  const handleNavigateToPath = (path) => { 
    navigate(path); 
  };

  /**
   * Envía la solicitud para crear una nueva rutina.
   * (Lee desde el estado en lugar de e.target)
   */
  const handleCreateRutina = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Lee desde los estados
    const nombreRutina = newRutinaNombre;
    const diasSemana = newRutinaDias;
    
    const token = localStorage.getItem('movium_token');
    
    if (!token) { 
      setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}crear_rutina.php`, { 
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
      
      const data = await response.json();
      
      if (!response.ok) { 
        throw new Error(data.mensaje || 'Error desconocido al crear la rutina.');
      }

      if (data.rutina && data.rutina.id) {
        navigate(`/rutina/${data.rutina.id}`);
      } else {
        setError("Rutina creada, pero no se pudo obtener el ID para redirigir.");
        setIsCreating(false);
        window.location.reload(); 
      }
    } catch (err) { 
      setError(err.message);
    }
  };

  /**
   * Limpia los estados del formulario de creación y cierra el modo 'isCreating'.
   */
  const handleCancelCreate = () => {
    setIsCreating(false);
    setError(null);
    setNewRutinaNombre("");
    setNewRutinaDias("");
  };

  // --- Renderizado ---
  return (
    <>
      <div className="dashboard-container">

        {/* Cabecera: Título e Icono */}
        {isCreating ? (
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

        {/* Zona de Errores */}
        {error && <div className="message">{error}</div>}

        {/* Botón "Crear Nueva Rutina" */}
        {!isCreating && (
          <div className="button-group" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <button 
              className="transparent-btn" 
              style={{ flex: 'none', width: 'auto', padding: '0 2rem' }} 
              onClick={() => setIsCreating(true)}
            >
              Crear Nueva Rutina
            </button>
          </div>
        )}

        {/* Contenido Principal: Formulario de Creación o Lista de Rutinas */}
        {isCreating ? (
          
          // Formulario de Creación (Controlado)
          <form className="rutina-form" onSubmit={handleCreateRutina}>
            
            <div className="form-group">
              <label htmlFor="nombre_rutina">Nombre de la Rutina</label>
              <input 
                type="text" 
                id="nombre_rutina" 
                name="nombre_rutina" 
                placeholder="Ej: Día de Pecho y Tríceps" 
                required 
                maxLength={MAX_TITULO_LENGTH}
                value={newRutinaNombre}
                onChange={(e) => setNewRutinaNombre(e.target.value)}
              />
              {/* Contador de caracteres */}
              <small className="char-counter">
                {newRutinaNombre.length} / {MAX_TITULO_LENGTH}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="dias_semana">Días / Descripción</label>
              <input 
                type="text" 
                id="dias_semana" 
                name="dias_semana" 
                placeholder="Ej: Lunes, Jueves / Rutina enfocada en hipertrofia" 
                maxLength={MAX_DIAS_LENGTH}
                value={newRutinaDias}
                onChange={(e) => setNewRutinaDias(e.target.value)}
              />
              {/* Contador de caracteres */}
              <small className="char-counter">
                {newRutinaDias.length} / {MAX_DIAS_LENGTH}
              </small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-edit" 
                onClick={handleCancelCreate}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-start">Guardar Rutina</button>
            </div>
          </form>

        ) : ( 
          
          // Lista de Rutinas
          loading ? ( 
            <div className="loading-container">
              <p className="no-rutinas-msg">Cargando tus rutinas...</p>
            </div> 
          ) : ( 
            <div className="rutinas-grid">
              {rutinas.length === 0 && !error ? ( 
                <p className="no-rutinas-msg">Aún no tienes ninguna rutina...</p> 
              ) : (
                rutinas.map((rutina) => {
                  const fechaRelativa = formatRelativeDate(rutina.ultima_sesion);
                  const nuncaEntrenada = fechaRelativa === 'Nunca entrenada';
                  const cardStyle = {};
                  
                  if (rutina.color_tag) {
                    cardStyle.boxShadow = `0 5px 15px ${rutina.color_tag}90`;
                  }

                  return (
                    <div className="rutina-card" key={rutina.id} style={cardStyle}>
                      <button 
                        className="btn-edit-icon" 
                        onClick={() => handleNavigateToPath(`/rutina/${rutina.id}`)} 
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
                        {/* --- ¡LÓGICA DE FECHA CORREGIDA! --- */}
                        {/* Si incluye '/' es una fecha completa, si no, es relativa */}
                        { fechaRelativa.includes('/') ? 
                          `Última vez: ${fechaRelativa}` : fechaRelativa 
                        }
                      </p>

                      <div className="card-actions">
                        <button 
                          className="btn-edit" 
                          onClick={() => handleNavigateToPath(`/progreso/${rutina.id}`)}
                        >
                          Progreso
                        </button>
                        <button 
                          className="btn-start" 
                          onClick={() => handleNavigateToPath(`/sesion/${rutina.id}`)}
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