// ---- frontend/src/Estadisticas.js ----

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Estadisticas.css';
import RankingCard from './components/RankingCard';
import CardioRankingCard from './components/CardioRankingCard';
import SelectorEjerciciosModal from './components/SelectorEjerciciosModal';
import iconoTrofeo from './assets/trofeo.png';
// Icono principal
import iconoRanking from './assets/ranking.png';   // Icono para Rankings Destacados
import iconoEstrella from './assets/estrella.png'; // Icono para Mis PRs
// ¡NUEVA IMPORTACIÓN!
import GuiaModal from './components/GuiaModal'; 

// ==================================================================
// --- Componente Interno: Pestaña "Mis PRs" (Sin cambios) ---
// ==================================================================
const TabMisPRs = ({ token }) => {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGrupoPRs, setFiltroGrupoPRs] = useState("Todos");

  useEffect(() => {
    const cargarMisPRs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost/programacion/TFG/movium/backend/api/get_mis_todos_prs.php', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al cargar mis PRs.");
   
           setPrs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
        cargarMisPRs();
    } else {
        setError("Token no disponible.");
        setLoading(false);
    }
  }, [token]);

  const gruposMuscularesPRs = useMemo(() => {
    const grupos = new Set(prs.map(pr => pr.grupo_muscular).filter(Boolean));
    return ["Todos", ...Array.from(grupos).sort()]; // Ordenar alfabéticamente
  }, [prs]);

  const listaFiltrada = useMemo(() => {
    return prs.filter(pr => {
      const pasaFiltroGrupo = (filtroGrupoPRs === "Todos") || (pr.grupo_muscular === filtroGrupoPRs);
      const filtroLower = filtroNombre.toLowerCase();
      const pasaFiltroNombre = !filtroNombre ||
         pr.nombre.toLowerCase().includes(filtroLower) ||
        (pr.grupo_muscular && pr.grupo_muscular.toLowerCase().includes(filtroLower));
      return pasaFiltroGrupo && pasaFiltroNombre;
    });
  }, [prs, filtroNombre, filtroGrupoPRs]);

  // *** FUNCIÓN renderPR MODIFICADA PARA MOSTRAR 0 ***
  const renderPR = (pr) => {
    if (pr.tipo === 'cardio') {
      const hasSpeed = pr.max_velocidad_media != null;
      // Variables para mostrar, usando '0' como default y añadiendo unidad
      const tiempoDisplay = pr.max_tiempo != null ? `${pr.max_tiempo} min` : '0 min';
      const distDisplay = pr.max_dist != null ? `${pr.max_dist} km` : '0 km';
      const speedDisplay = hasSpeed ? `${pr.max_velocidad_media} km/h` : '0 km/h';
      
      // Mantenemos 3 columnas siempre para consistencia visual
      const gridColumns = '1fr 1fr 1fr';

      return (
        <div className="pr-records-grid" style={{ gridTemplateColumns: gridColumns }}>
          <div className="pr-record-item">
            <strong>Mayor Tiempo</strong>
            <span>{tiempoDisplay}</span>
          </div>
          <div className="pr-record-item">
            <strong>Mayor Distancia</strong>
            <span>{distDisplay}</span>
    
          </div>
          {/* Mostramos siempre la velocidad, atenuada si es 0 */}
          <div className="pr-record-item" style={!hasSpeed ? { opacity: 0.6 } : {}}>
              <strong>Velocidad Media Máx</strong>
              <span>{speedDisplay}</span>
          </div>
        </div>
      );
    } else { // fuerza o calistenia
      // Variables para mostrar, usando '0' como default y añadiendo unidad
      const pesoDisplay = pr.max_peso != null ? `${pr.max_peso} kg` : '0 kg';
      const repsDisplay = pr.max_reps != null ? pr.max_reps : '0';
      // Reps no lleva unidad

      return (
         <div className="pr-records-grid">
          <div className="pr-record-item">
            <strong>Mayor Peso</strong>
            <span>{pesoDisplay}</span>
          </div>
          <div className="pr-record-item">
            <strong>Máximas Reps</strong>
         
             <span>{repsDisplay}</span>
          </div>
        </div>
      );
    }
  };
  // *** FIN FUNCIÓN renderPR MODIFICADA ***

  return (
    <div>
      {/* Filtros */}
      <div className="pr-filtros">
        <input
          type="search"
          placeholder="Filtrar por nombre..."
          className="modal-search pr-search-input" // Reutiliza clase modal-search si aplica
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
        <select
          className="modal-group-select" // Reutiliza clase modal-group-select si aplica
          value={filtroGrupoPRs}
          onChange={(e) => setFiltroGrupoPRs(e.target.value)}
        >
          {gruposMuscularesPRs.map(grupo => (
            <option key={grupo} value={grupo}>
               {grupo === "Todos" ? "Todos los Grupos" : (grupo || "Sin Grupo")}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '0' }}>
        <img src={iconoEstrella} alt="" width="64" height="64" />
        <h3
          className="section-title"
  
           style={{
            marginTop: '0',
            marginBottom: '1.5rem',
          }}
        >
          Tus Records Personales
        </h3>
      </div>

      {/* Mensajes de estado */}
      {error && <div className="message" style={{marginBottom: '1.5rem'}}>{error}</div>}
 
           {loading && <p className="subtitle" style={{textAlign: 'center', marginTop: '2rem'}}>Cargando tus récords...</p>}

      {/* Lista de PRs */}
      {!loading && !error && (
        <div className="pr-list-container">
          {listaFiltrada.length > 0 ?
 (
            listaFiltrada.map(pr => (
               <div key={pr.ejercicio_id} className="pr-item-card">
                  <div className="pr-item-header">
                    <strong>{pr.nombre}</strong>
                    <span>{pr.grupo_muscular || 'General'}</span>
        
                   </div>
                  {renderPR(pr)}
                </div>
            ))
          ) : (
             <p className="no-data-msg" style={{border: 'none', padding: '2rem 0'}}>
             
               {prs.length === 0
                  ? `Aún no tienes PRs registrados.`
                  : "No se encontraron PRs con ese filtro."
                }
             </p>
          )}
        </div>
 
           )}
    </div>
  );
};
// ==================================================================

// ==================================================================
// --- Componente Interno: Pestaña "Rankings de Amigos" (Sin cambios) ---
// ==================================================================
const TabRankings = ({ token, miUsuarioId }) => {
  const [rankingDataGlobal, setRankingDataGlobal] = useState(null);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ejercicioSelectComp, setEjercicioSelectComp] = useState(null);
  const [rankingDetalleComp, setRankingDetalleComp] = useState(null);
  const [loadingComp, setLoadingComp] = useState(false);
  const [errorComp, setErrorComp] = useState(null);
  const [listaMaestra, setListaMaestra] = useState([]);

  useEffect(() => {
    const cargarGlobalRankings = async () => {
      setLoadingGlobal(true);
      setErrorGlobal(null);
      setRankingDataGlobal(null);
      if (!token) {
        setErrorGlobal("Token no disponible para cargar rankings.");
        setLoadingGlobal(false);
        return;
      }
      try {
        const res = await fetch('http://localhost/programacion/TFG/movium/backend/api/get_global_rankings.php', {
       
             headers: { 'Authorization': `Bearer ${token}` }
          });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al cargar los rankings globales.");
        const defaultData = {
          press_banca: [], sentadilla: [], peso_muerto: [],
          max_distancia: [], max_tiempo: [], max_velocidad_media: []
        };
 
           setRankingDataGlobal({...defaultData, ...data});
      } catch (err) {
        setErrorGlobal(err.message);
      } finally {
        setLoadingGlobal(false);
      }
    };
    cargarGlobalRankings();
   }, [token]);

  useEffect(() => {
     const cargarMaestra = async () => {
      if (!token || listaMaestra.length > 0) return;
      try {
        const res = await fetch(`http://localhost/programacion/TFG/movium/backend/api/get_ejercicios_maestra.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al cargar ejercicios");
        setListaMaestra(data);
      } catch (err) {
        console.error("Error cargando lista maestra:", err);
      }
     };
    cargarMaestra();
    }, [token, listaMaestra]);

  const handleSelectEjercicioComp = async (ej) => {
    setIsModalOpen(false);
    if (ejercicioSelectComp?.id === ej.id) return;

    setEjercicioSelectComp(ej);
    setLoadingComp(true);
    setErrorComp(null);
    setRankingDetalleComp(null);
    if (!token) {
        setErrorComp("Token no disponible para cargar detalles.");
        setLoadingComp(false);
        return;
    }

    try {
      const res = await fetch(`http://localhost/programacion/TFG/movium/backend/api/get_ranking_detalle.php?id=${ej.id}`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || `Error al cargar ranking para ${ej.nombre}`);
      setRankingDetalleComp(data);
    } catch (err) {
      setErrorComp(err.message);
    } finally {
      setLoadingComp(false);
    }
   };

  return (
    <div className="tab-rankings-content">
      {/* SECCIÓN 1: RANKINGS DESTACADOS */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '10px', marginTop: '2.5rem' }}>
        <img src={iconoRanking} alt="" width="64" height="64" />
        <h3 className="section-title" style={{ marginTop: '0'}}>
          Rankings Destacados
        </h3>
      </div>

      {errorGlobal && <div className="message" style={{marginBottom: '1.5rem'}}>{errorGlobal}</div>}
      {loadingGlobal && <p className="subtitle" style={{textAlign: 'center'}}>Cargando récords globales...</p>}

      {!loadingGlobal && !errorGlobal && rankingDataGlobal && (
        <div className="ranking-grid-container">
            <RankingCard title="Press de Banca" data={rankingDataGlobal.press_banca} miUsuarioId={miUsuarioId} />
            <RankingCard title="Sentadilla" data={rankingDataGlobal.sentadilla} miUsuarioId={miUsuarioId} />
            <RankingCard title="Peso Muerto" data={rankingDataGlobal.peso_muerto} miUsuarioId={miUsuarioId} />
            <CardioRankingCard
 
               title="Récords de Carrera (Cinta)"
              rankings={{
                max_distancia: rankingDataGlobal.max_distancia,
                max_tiempo: rankingDataGlobal.max_tiempo,
                max_velocidad_media: rankingDataGlobal.max_velocidad_media
              }}
     
               miUsuarioId={miUsuarioId}
            />
        </div>
      )}

      {/* SECCIÓN 2: COMPARADOR DINÁMICO */}
      <h3 className="section-title separator">
        Comparar un Ejercicio Específico
      </h3>
      <div className="comparator-controls">
          <button
            
             className="transparent-btn"
            onClick={() => setIsModalOpen(true)}
            disabled={listaMaestra.length === 0 || loadingGlobal}
          >
            {ejercicioSelectComp ?
 `Comparando: ${ejercicioSelectComp.nombre}` : 'Seleccionar Ejercicio'}
          </button>
      </div>
       {loadingComp && <p className="subtitle" style={{marginTop: '1rem', textAlign: 'center'}}>Cargando ranking...</p>}
       {errorComp && <div className="message" style={{marginTop: '1rem'}}>{errorComp}</div>}
       {rankingDetalleComp && ejercicioSelectComp && !loadingComp && !errorComp && (
        <div className="ranking-grid-container results-comparator">
          {(ejercicioSelectComp.tipo === 'fuerza' || ejercicioSelectComp.tipo === 'calistenia') && rankingDetalleComp.max_peso?.length > 0 && (
      
             <RankingCard title={`${ejercicioSelectComp.nombre} (Max Peso)`} data={rankingDetalleComp.max_peso} miUsuarioId={miUsuarioId} />
          )}
          {(ejercicioSelectComp.tipo === 'fuerza' || ejercicioSelectComp.tipo === 'calistenia') && rankingDetalleComp.max_reps?.length > 0 && (
             <RankingCard
                title={`${ejercicioSelectComp.nombre} (Mejor Serie e1RM)`}
                data={rankingDetalleComp.max_reps}
        
                 miUsuarioId={miUsuarioId}
             />
          )}
          {ejercicioSelectComp.tipo === 'cardio' && rankingDetalleComp.max_dist?.length > 0 && (
            <RankingCard title={`${ejercicioSelectComp.nombre} (Max Distancia)`} data={rankingDetalleComp.max_dist} miUsuarioId={miUsuarioId}/>
          )}
          {ejercicioSelectComp.tipo === 'cardio' && rankingDetalleComp.max_tiempo?.length > 0 && (
      
             <RankingCard title={`${ejercicioSelectComp.nombre} (Max Tiempo)`} data={rankingDetalleComp.max_tiempo} miUsuarioId={miUsuarioId}/>
          )}
          { !loadingComp && rankingDetalleComp &&
             (!rankingDetalleComp.max_peso || rankingDetalleComp.max_peso.length === 0) &&
             (!rankingDetalleComp.max_reps || rankingDetalleComp.max_reps.length === 0) &&
             (!rankingDetalleComp.max_dist || rankingDetalleComp.max_dist.length === 0) &&
             (!rankingDetalleComp.max_tiempo || rankingDetalleComp.max_tiempo.length === 0) &&
             <p className="no-data-msg comparator-no-data" style={{textAlign: 'center'}}>
                 No hay récords registrados para "{ejercicioSelectComp.nombre}" entre tus amigos.
             </p>
           }
        </div>
      )}
      <SelectorEjerciciosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listaEjercicios={listaMaestra}
        onEjercicioSelect={handleSelectEjercicioComp}
      />

    </div>
  );
};
// ==================================================================


// ==================================================================
// --- Componente Principal Estadisticas (MODIFICADO) ---
// ==================================================================
function Estadisticas() {
    const [vista, setVista] = useState('mis_prs');
    const [miUsuarioId, setMiUsuarioId] = useState(null);
    const token = localStorage.getItem('movium_token');

    // --- ¡NUEVO! ESTADO PARA LA GUÍA ---
    const [showGuiaRecords, setShowGuiaRecords] = useState(false);

    // --- ¡NUEVO! HELPER PARA MARCAR GUÍA (copiado de Dashboard.js) ---
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

    // --- ¡NUEVO! USE EFFECT PARA MOSTRAR GUÍA ---
    useEffect(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('movium_user'));
            // Asumimos que añadirás 'ha_visto_guia_records' al login.php y marcar_guia_vista.php
            if (storedUser && !storedUser.ha_visto_guia_records) {
                setShowGuiaRecords(true);
            }
        } catch (e) {
            console.error("Error al leer datos de usuario para la guía de Récords:", e);
        }
    }, []); // Se ejecuta solo al montar

    // --- ¡NUEVO! HANDLER PARA CERRAR GUÍA ---
    const handleCerrarGuiaRecords = () => {
        try {
            marcarGuiaComoVista('records'); // Clave 'records'
            const storedUser = JSON.parse(localStorage.getItem('movium_user'));
            if (storedUser) {
                const updatedUser = { ...storedUser, ha_visto_guia_records: true };
                localStorage.setItem('movium_user', JSON.stringify(updatedUser));
            }
            setShowGuiaRecords(false);
        } catch (e) {
            console.error("Error al cerrar la guía de Récords:", e);
            setShowGuiaRecords(false);
        }
    };

    // useEffect para decodificar token (existente)
    useEffect(() => {
        try {
            if (token) {
                const payloadBase64 = token.split('.')[1];
                const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      
                     return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decodedPayload = JSON.parse(jsonPayload);

                if (decodedPayload.data && decodedPayload.data.id) {
                     setMiUsuarioId(decodedPayload.data.id);
       
                   } else {
                     console.error("ID de usuario no encontrado en el payload del token:", decodedPayload);
                }
            } else {
                 console.warn("No se encontró token de autenticación.");
     
               }
        } catch (e) {
            console.error("Error decodificando token:", e);
        }
    }, [token]);

    // Renderizado principal
    return (
        <>
            <div className="estadisticas-container">
                {/* Cabecera principal con icono */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
                  <img src={iconoTrofeo} alt="" width="64" height="64" />
                  <h2>Récords</h2>
                </div>
        
                 <p className="subtitle" style={{ textAlign: 'center' }}>
                  Tu "Salón de la Fama" personal y rankings de amigos.
                </p>

                {/* Pestañas */}
                <div className="comunidad-tabs">
                    <button
             
                         className={`tab-btn ${vista === 'mis_prs' ? 'active' : ''}`}
                        onClick={() => setVista('mis_prs')}
                    >
                        Mis PRs
                    </button>
           
                     <button
                        className={`tab-btn ${vista === 'rankings' ? 'active' : ''}`}
                        onClick={() => setVista('rankings')}
                    >
                        Rankings de Amigos
        
                     </button>
                </div>

                {/* Contenido condicional */}
                {vista === 'mis_prs' && <TabMisPRs token={token} />}
                {vista === 'rankings' && <TabRankings token={token} miUsuarioId={miUsuarioId} />}

            </div>

            {/* --- ¡NUEVO! RENDERIZADO DEL MODAL DE GUÍA --- */}
            <GuiaModal
                isOpen={showGuiaRecords}
                onClose={handleCerrarGuiaRecords}
                titulo="¡Tu Salón de la Fama!"
            >
                <p>¡Bienvenido a tus <strong>Récords</strong>!</p>
                <p>Esta sección es donde mides tu progreso real y te comparas con amigos. Se divide en dos pestañas:</p>
                <ul style={{ marginTop: '0.5rem', marginBottom: '1rem', paddingLeft: '1.2rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                        <strong>Mis PRs:</strong> Aquí verás <i>todos</i> tus Récords Personales (Mayor Peso, Máximas Reps, etc.) para <i>cada</i> ejercicio que hayas registrado.
                    </li>
                    <li>
                        <strong>Rankings de Amigos:</strong> Compara tus mejores marcas en ejercicios clave (como Press de Banca o Sentadilla) con las de tus amigos.
                    </li>
                </ul>
                <p>¡Registra tus entrenos para empezar a llenar esta sección!</p>
            </GuiaModal>
        </>
    );
}

export default Estadisticas;