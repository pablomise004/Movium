// ---- frontend/src/Dashboard.js (Refactorizado con contadores y lógica de fecha corregida) ----

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes
import GuiaModal from './components/GuiaModal';

// Assets
import iconoInicio from './assets/inicio.png';
import iconoCrear from './assets/crear-ejercicios.png';
import iconoCalendario from './assets/calendario.png';

// CSS
import './Dashboard.css';
// Importamos el CSS de RutinaDetalle para usar la clase .char-counter
import './RutinaDetalle.css'; 

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

/**
 * Llama a la API para marcar una guía como vista.
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
  const [showGuiaInicio, setShowGuiaInicio] = useState(false);
  
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
        const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/get_rutinas.php', { 
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

  // Mostrar la guía de inicio si no se ha visto
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      if (storedUser && !storedUser.ha_visto_guia_inicio) {
        setShowGuiaInicio(true);
      }
    } catch (e) {
      console.error("Error al leer datos de usuario para la guía:", e);
    }
  }, []); // Se ejecuta solo una vez al montar

  // --- Handlers ---

  /**
   * Cierra el modal de la guía de inicio y actualiza el localStorage.
   */
  const handleCerrarGuiaInicio = () => {
    try {
      marcarGuiaComoVista('inicio');
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      if (storedUser) {
        const updatedUser = { ...storedUser, ha_visto_guia_inicio: true };
        localStorage.setItem('movium_user', JSON.stringify(updatedUser));
      }
      setShowGuiaInicio(false);
    } catch (e) {
      console.error("Error al cerrar la guía de inicio:", e);
      setShowGuiaInicio(false);
    }
  };

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
      const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/crear_rutina.php', { 
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

        {/* Botón de Historial (Calendario) en la esquina */}
        {!isCreating && (
          <button
            className="btn-historial-calendario"
            onClick={() => navigate('/historial')}
            title="Ver historial de calendario"
          >
            <img src={iconoCalendario} alt="Ver historial" />
          </button>
        )}

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
      
      {/* Modal de Guía (Tutorial) */}
      <GuiaModal
          isOpen={showGuiaInicio}
          onClose={handleCerrarGuiaInicio}
          titulo="¡Bienvenido a Movium!"
      >
          <p>¡Hola <strong>{nombreUsuario || 'Usuario'}</strong>! Parece que es tu primera vez aquí.</p>
          <p>
              Esta es la pantalla de <strong>Inicio</strong>. Aquí puedes crear y ver todas tus <strong>Rutinas</strong>.
          </p>
          <p>
              Una <strong>Rutina</strong> es como un plan para un día de entreno (ej: "Día de Pecho", "Día de Pierna").
          </p>
          <p>
              Primero creas la rutina y luego, dentro de ella, añades los ejercicios y series que quieres hacer.
          </p>
          <ul style={{ marginTop: '0.5rem', marginBottom: '1rem', paddingLeft: '1.2rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                  Pulsa en <strong>"Entrenar"</strong> para iniciar una sesión basada en esa rutina.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                  Pulsa en <strong>"Progreso"</strong> para ver gráficas de cómo has mejorado en esa rutina.
              </li>
              <li>
                  Fíjate en el <strong>botón con el icono de calendario</strong> en la esquina superior derecha. Te llevará a un calendario en el que podrás ver qué días has entrenado.
              </li>

          </ul>
          <p>¡Usa <strong>"Crear Nueva Rutina"</strong> para empezar!</p>
      </GuiaModal>
    </>
  );
}

export default Dashboard;