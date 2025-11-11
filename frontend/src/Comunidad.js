// ---- frontend/src/Comunidad.js (Refactorizado con botón de Feed) ----

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. IMPORTADO
import './Comunidad.css';
import UsuarioCard from './components/UsuarioCard';
import AmigoPRsModal from './components/AmigoPRsModal';
import iconoComunidad from './assets/amigos.png';
import iconoBusqueda from './assets/busqueda.png';
import iconoFeed from './assets/feed.png'; // <-- 2. IMPORTADO
import GuiaModal from './components/GuiaModal';
import ConfirmarAccionModal from './components/ConfirmarAccionModal';

// --- Constante de longitud ---
const MAX_QUERY_LENGTH = 18;

function Comunidad() {
  const [activeTab, setActiveTab] = useState('amigos'); // <-- 3. Renombrado
  const [misAmigos, setMisAmigos] = useState([]);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [query, setQuery] = useState('');
  const [loadingAmigos, setLoadingAmigos] = useState(true);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [error, setError] = useState(null);
  const [amigoParaVerPRs, setAmigoParaVerPRs] = useState(null);
  const [showGuiaComunidad, setShowGuiaComunidad] = useState(false);

  const [isConfirmarAmigoOpen, setIsConfirmarAmigoOpen] = useState(false);
  const [amigoParaBorrar, setAmigoParaBorrar] = useState(null);
  const [isDeletingAmigo, setIsDeletingAmigo] = useState(false);

  const [haBuscado, setHaBuscado] = useState(false);
  
  const navigate = useNavigate(); // <-- 4. Añadido

  // --- Helper para marcar guía (sin cambios) ---
  const marcarGuiaComoVista = async (nombreGuia) => {
    const token = localStorage.getItem('movium_token');
    if (!token) return;
    try {
      await fetch('http://localhost/programacion/TFG/movium/backend/api/marcar_guia_vista.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ guia_vista: nombreGuia })
      });
    } catch (error) {
      console.error("Error al marcar la guía como vista:", error);
    }
  };

  // --- useEffect para mostrar guía (sin cambios) ---
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      if (storedUser && !storedUser.ha_visto_guia_comunidad) {
        setShowGuiaComunidad(true);
      }
    } catch (e) {
      console.error("Error al leer datos de usuario para la guía de Comunidad:", e);
    }
  }, []);

  // --- Handler para cerrar guía (sin cambios) ---
  const handleCerrarGuiaComunidad = () => {
    try {
      marcarGuiaComoVista('comunidad');
      const storedUser = JSON.parse(localStorage.getItem('movium_user'));
      if (storedUser) {
        const updatedUser = { ...storedUser, ha_visto_guia_comunidad: true };
        localStorage.setItem('movium_user', JSON.stringify(updatedUser));
      }
      setShowGuiaComunidad(false);
    } catch (e) {
      console.error("Error al cerrar la guía de Comunidad:", e);
      setShowGuiaComunidad(false);
    }
  };

  const token = localStorage.getItem('movium_token');

  // --- Función para manejar el input de búsqueda (sin cambios) ---
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setHaBuscado(false); 
    setResultadosBusqueda([]); 
    
    if (error === "Escribe al menos 2 caracteres para buscar.") {
      setError(null);
    }
  };

  // --- API: Cargar "Mis Amigos" (sin cambios) ---
  const cargarMisAmigos = useCallback(async () => {
    setLoadingAmigos(true);
    setError(null);
    try {
      const res = await fetch('http://localhost/programacion/TFG/movium/backend/api/get_mis_amigos.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error al cargar amigos.");
      setMisAmigos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAmigos(false);
    }
  }, [token]);

  // --- 5. useEffect modificado para cargar según la pestaña activa ---
  useEffect(() => {
    // Limpiamos errores al cambiar de pestaña
    setError(null);
    
    if (activeTab === 'amigos') {
      // Cargamos amigos solo si estamos en esa pestaña
      cargarMisAmigos();
    }
    // No es necesario 'else' porque 'buscar' se activa con el submit
  }, [activeTab, cargarMisAmigos]); // Se ejecuta si cambia la pestaña

  // --- API: Buscar Usuarios (sin cambios) ---
  const handleSearchSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (query.trim().length < 2) {
      setError("Escribe al menos 2 caracteres para buscar.");
      setHaBuscado(false); 
      setResultadosBusqueda([]); 
      return;
    }

    setLoadingBusqueda(true);
    setError(null);
    setHaBuscado(false); 

    try {
      const res = await fetch(`http://localhost/programacion/TFG/movium/backend/api/search_usuarios.php?query=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error al buscar.");
      setResultadosBusqueda(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBusqueda(false);
      setHaBuscado(true); 
    }
  };

  // --- API: Añadir Amigo (sin cambios) ---
  const addAmigo = async (id) => {
    setError(null);
    try {
      const res = await fetch('http://localhost/programacion/TFG/movium/backend/api/add_amigo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amigo_a_anadir_id: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error al añadir.");
      
      setResultadosBusqueda(prev =>
        prev.map(user => user.id === id ? { ...user, son_amigos: true } : user)
      );
      // Recarga la lista de amigos en segundo plano
      cargarMisAmigos();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Función deleteAmigo (sin cambios) ---
  const deleteAmigo = (id) => {
    setError(null);
    const amigo = misAmigos.find(a => a.id === id) || resultadosBusqueda.find(u => u.id === id);
    if (amigo) {
      setAmigoParaBorrar(amigo);
      setIsConfirmarAmigoOpen(true);
    } else {
      console.error("No se pudo encontrar al amigo para borrar.");
    }
  };

  // --- Función handleConfirmDeleteAmigo (sin cambios) ---
  const handleConfirmDeleteAmigo = async () => {
    if (!amigoParaBorrar) return;
    setIsDeletingAmigo(true);
    setError(null);
    const id = amigoParaBorrar.id;

    try {
      const res = await fetch('http://localhost/programacion/TFG/movium/backend/api/delete_amigo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amigo_a_borrar_id: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error al eliminar.");
      
      setResultadosBusqueda(prev =>
        prev.map(user => user.id === id ? { ...user, son_amigos: false } : user)
      );
      setMisAmigos(prev => prev.filter(user => user.id !== id));

    } catch (err) {
      setError(err.message);
    } finally {
      setIsConfirmarAmigoOpen(false);
      setIsDeletingAmigo(false);
      setAmigoParaBorrar(null);
    }
  };

  // --- 6. NUEVA FUNCIÓN para navegar al Feed ---
  const handleNavigateToFeed = () => {
    navigate('/comunidad/feed'); // Ajusta esta ruta si es diferente en tu App.js
  };

  // --- Renderizado ---
  return (
    <>
      <div className="comunidad-container">
        {/* --- Título e icono principal (sin cambios) --- */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
          <img src={iconoComunidad} alt="" width="64" height="64" />
          <h2>Comunidad</h2>
        </div>
        <p className="subtitle" style={{ textAlign: 'center' }}>
          Encuentra nuevos compañeros o revisa el progreso de tus amigos.
        </p>

        {/* --- 7. BOTÓN DE FEED AÑADIDO --- */}
        <button
          className="btn-feed-link" // Usará la nueva clase CSS
          onClick={handleNavigateToFeed}
          title="Ver Feed de Actividad"
        >
          <img src={iconoFeed} alt="Feed" />
        </button>

        {error && <div className="message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* --- 8. Pestañas (actualizadas a activeTab) --- */}
        <div className="comunidad-tabs">
          <button className={`tab-btn ${activeTab === 'amigos' ? 'active' : ''}`} onClick={() => setActiveTab('amigos')}>
            Mis Amigos ({misAmigos.length})
          </button>
          <button className={`tab-btn ${activeTab === 'buscar' ? 'active' : ''}`} onClick={() => setActiveTab('buscar')}>
            Buscar Usuarios
          </button>
        </div>

        {/* --- Contenido Pestaña "Mis Amigos" (actualizado a activeTab) --- */}
        {activeTab === 'amigos' && (
          <div className="comunidad-content">
            {loadingAmigos && <p className="subtitle">Cargando amigos...</p>}
            {!loadingAmigos && misAmigos.length === 0 && (
              <p className="no-rutinas-msg" style={{ gridColumn: '1 / -1' }}>
                Aún no tienes amigos. ¡Usa la pestaña "Buscar Usuarios" para añadir algunos!
              </p>
            )}
            {!loadingAmigos && misAmigos.map(amigo => (
              <UsuarioCard
                key={amigo.id}
                usuario={amigo}
                tipo="amigo"
                onDeleteAmigo={() => deleteAmigo(amigo.id)}
                onVerPRs={() => setAmigoParaVerPRs(amigo)}
              />
            ))}
          </div>
        )}

        {/* --- Contenido Pestaña "Buscar Usuarios" (actualizado a activeTab) --- */}
        {activeTab === 'buscar' && (
          <div>
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <div className="search-input-container">
                <input
                  type="search"
                  className="search-input"
                  placeholder="Buscar por nombre de usuario..."
                  value={query}
                  onChange={handleQueryChange}
                  maxLength={MAX_QUERY_LENGTH}
                />
                <img
                  src={iconoBusqueda}
                  alt="Buscar"
                  className="search-icon-inside"
                  onClick={handleSearchSubmit}
                />
                <small className="search-char-counter">
                  {query.length} / {MAX_QUERY_LENGTH}
                </small>
              </div>
            </form>

            <div className="comunidad-content">
              {loadingBusqueda && <p className="subtitle">Buscando...</p>}
              
              {!loadingBusqueda && haBuscado && resultadosBusqueda.length === 0 && (
                <p className="no-rutinas-msg" style={{ gridColumn: '1 / -1' }}>
                  No se encontraron usuarios con ese nombre.
                </p>
              )}

              {!loadingBusqueda && resultadosBusqueda.map(user => (
                <UsuarioCard
                  key={user.id}
                  usuario={user}
                  tipo="busqueda"
                  onAddAmigo={() => addAmigo(user.id)}
                  onDeleteAmigo={() => deleteAmigo(user.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- Modal PRs Amigo (Sin cambios) --- */}
      <AmigoPRsModal
        isOpen={amigoParaVerPRs !== null}
        onClose={() => setAmigoParaVerPRs(null)}
        amigo={amigoParaVerPRs}
        token={token}
      />

      {/* --- Modal Guía Comunidad (Sin cambios) --- */}
      <GuiaModal
          isOpen={showGuiaComunidad}
          onClose={handleCerrarGuiaComunidad}
          titulo="¡Conecta y Compara!"
      >
          <p>¡Bienvenido a la <strong>Comunidad</strong>!</p>
          <p>Conectar con otros es clave para mantener la motivación. Esta sección tiene tres funciones principales:</p>
          <ul style={{ marginTop: '0.5rem', marginBottom: '1rem', paddingLeft: '1.2rem' }}>

              {/* --- LÍNEA CORREGIDA --- */}
              <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Feed de Actividad:</strong> Pulsa el <strong>botón con el icono de 'feed'</strong> en la esquina superior derecha para ver un resumen de las últimas sesiones que han completado tus amigos.
              </li>
              {/* --- FIN CORRECCIÓN --- */}

              <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Mis Amigos (Pestaña):</strong> Aquí verás tu lista de amigos. Desde aquí puedes hacer clic para ver todos sus Récords Personales (PRs).
              </li>
              <li>
                  <strong>Buscar Usuarios (Pestaña):</strong> Usa el buscador para encontrar a tus compañeros de gimnasio por su nombre de usuario y añadirlos.
              </li>
          </ul>
      </GuiaModal>

      {/* --- MODAL DE CONFIRMACIÓN (Sin cambios) --- */}
      <ConfirmarAccionModal
        isOpen={isConfirmarAmigoOpen}
        onClose={() => {
          setIsConfirmarAmigoOpen(false);
          setAmigoParaBorrar(null);
        }}
        onConfirm={handleConfirmDeleteAmigo}
        titulo="Eliminar Amigo"
        mensaje={`¿Estás seguro de que quieres eliminar a ${amigoParaBorrar?.nombre_usuario}? Esta acción es mutua y ambos seréis eliminados de vuestras listas.`}
        textoBotonConfirmar="Sí, eliminar"
        isConfirmando={isDeletingAmigo}
      />
    </>
  );
}

export default Comunidad;