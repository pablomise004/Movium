// ---- frontend/src/FeedPage.js (ACTUALIZADO CON DETALLES EXPANDIBLES) ----

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feed.css'; 
// ¡IMPORTANTE! Reutilizamos los estilos del historial
import './RutinaProgreso.css'; 
import iconoFeed from './assets/feed.png';

// --- Funciones Helper (formatRelativeDate, formatDuracion) ---
// (Pega aquí las funciones que te pasé en el mensaje anterior)
const formatRelativeDate = (dateString) => {
    if (!dateString) { return null; }
    try {
        const sessionDate = new Date(dateString);
        const today = new Date();
        const diffTime = today.getTime() - sessionDate.getTime();
        if (diffTime < 0) return "En el futuro"; // Por si acaso

        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) { return "Ahora mismo"; }
        if (diffMinutes < 60) { return `Hace ${diffMinutes} min`; }
        if (diffHours < 24) { return `Hace ${diffHours} h`; }
        if (diffDays === 1) { return 'Ayer'; }
        if (diffDays < 7) { return `Hace ${diffDays} días`; }
        
        return sessionDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
    } catch (e) { 
        console.error("Error formateando fecha:", e); 
        return 'fecha inválida'; 
    }
};

const formatDuracion = (duracionSql) => {
    if (!duracionSql || duracionSql === '00:00:00') return null;
    const partes = duracionSql.split(':');
    const horas = parseInt(partes[0], 10);
    const minutos = parseInt(partes[1], 10);
    let resultado = '';
    if (horas > 0) { resultado += `${horas}h `; }
    if (minutos > 0 || horas === 0) { resultado += `${minutos}m`; }
    return resultado.trim();
};
// --- Fin Funciones Helper ---


/**
 * ---------------------------------
 * Componente Interno para el Item del Feed
 * ---------------------------------
 */
const FeedItem = ({ item, token }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    const [detallesEjercicios, setDetallesEjercicios] = useState([]); // Aquí guardamos los ejercicios

    // Formateo de datos del item (resumen)
    const fechaRelativa = formatRelativeDate(item.fecha_fin);
    const duracionFormateada = formatDuracion(item.duracion);
    const volTotal = parseFloat(item.total_volumen_fuerza);
    const tiempoTotal = parseFloat(item.total_tiempo_cardio);
    const distTotal = parseFloat(item.total_distancia_cardio);

    // Función para buscar los detalles de ESTA sesión
    const handleToggleDetails = async () => {
        if (isExpanded) {
            setIsExpanded(false); // Si ya estaba abierto, solo lo cierra
            return;
        }

        // Si no está abierto y no tenemos datos, los busca
        setIsExpanded(true);
        if (detallesEjercicios.length > 0) {
            return; // Ya los teníamos, no hace falta buscar
        }

        setIsLoadingDetails(true);
        setErrorDetails(null);
        try {
            const res = await fetch(`http://localhost/programacion/TFG/movium/backend/api/get_session_details.php?id=${item.sesion_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.mensaje || "Error al cargar detalles.");
            setDetallesEjercicios(data); // Guardamos el array de ejercicios
        } catch (err) {
            setErrorDetails(err.message);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    return (
        <div className="feed-item">
            
            {/* 1. Cabecera (Nombre, Rutina y Fecha) */}
            <div className="feed-item-header">
                <div className="feed-item-main">
                    <strong className="feed-user">
                        {item.nombre_usuario}
                    </strong>
                    <span> ha completado </span>
                    <span className="feed-rutina">
                        {item.nombre_rutina || '[Rutina Eliminada]'}
                    </span>
                </div>
                {fechaRelativa && (
                    <span className="feed-fecha">
                        {fechaRelativa}
                    </span>
                )}
            </div>

            {/* 2. Cuerpo con los stats (Resumen) */}
            <div className="feed-item-stats">
                {duracionFormateada && ( <span>🕒 {duracionFormateada}</span> )}
                {volTotal > 0 && ( <span>🏋️ {Math.round(volTotal)} kg</span> )}
                {tiempoTotal > 0 && ( <span>⏱️ {tiempoTotal} min</span> )}
                {distTotal > 0 && ( <span>📍 {distTotal.toFixed(1)} km</span> )}
            </div>

            {/* 3. Botón para expandir */}
            <div className="feed-item-actions">
                <button onClick={handleToggleDetails} className="btn-feed-details">
                    {isExpanded ? "Ocultar Detalles" : "Ver Detalles"}
                </button>
            </div>

            {/* 4. Contenedor de Detalles (condicional) */}
            {isExpanded && (
                <div className="feed-item-details">
                    {isLoadingDetails && <p className="subtitle" style={{fontSize: '0.9rem', textAlign: 'center'}}>Cargando detalles...</p>}
                    {errorDetails && <div className="message" style={{fontSize: '0.9rem', padding: '0.5rem'}}>{errorDetails}</div>}
                    
                    {/* ¡¡REUTILIZAMOS EL CSS DE RutinaProgreso.js!! */}
                    <div className="ejercicios-container" style={{gap: '0.75rem', marginTop: '0.5rem'}}>
                        {detallesEjercicios.map(ejercicio => (
                            <div key={ejercicio.orden + '_' + ejercicio.nombre_ejercicio} className="ejercicio-grupo" style={{gap: '0.25rem'}}>
                                <strong>{ejercicio.nombre_ejercicio}</strong>
                                <ul>
                                    {ejercicio.series.map((serie, index) => (
                                        <li key={index} className="serie-item">
                                            <span>S{serie.num_serie}:</span>
                                            {ejercicio.tipo_ejercicio === 'cardio' ? (
                                                <span>
                                                    {(serie.tiempo_min_realizado != null && serie.tiempo_min_realizado > 0) ? `${serie.tiempo_min_realizado} min` : ''}
                                                    {(serie.distancia_km_realizada != null && serie.distancia_km_realizada > 0) ? ` ${ (serie.tiempo_min_realizado != null && serie.tiempo_min_realizado > 0) ? '📍' : '' } ${serie.distancia_km_realizada} km` : ''}
                                                    {!(serie.tiempo_min_realizado > 0) && !(serie.distancia_km_realizada > 0) && '-'}
                                                </span>
                                            ) : (
                                                <span>
                                                    {serie.repeticiones_realizadas ?? '-'} reps
                                                    {serie.peso_kg_usado != null && ` x ${serie.peso_kg_usado} kg`}
                                                    {serie.fue_al_fallo && <span className="fallo-tag" title="Al fallo">F</span>}
                                                </span>
                                            )}
                                            {/* Aquí podríamos añadir el icono de nota 📝 si quisiéramos */}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
/**
 * ---------------------------------
 * Componente Principal (FeedPage)
 * ---------------------------------
 */
function FeedPage() {
    const [feedItems, setFeedItems] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('movium_token');

    // Carga el feed INICIAL (solo resúmenes)
    const cargarFeed = useCallback(async () => {
        setLoadingFeed(true);
        setError(null);
        try {
            // Este PHP es el de la semana pasada, el rápido
            const res = await fetch('http://localhost/programacion/TFG/movium/backend/api/get_amigos_feed.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.mensaje || "Error al cargar el feed.");
            // Guardamos los items, CADA UNO CON SU sesion_id
            setFeedItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingFeed(false);
        }
    }, [token]);

    useEffect(() => {
        cargarFeed();
    }, [cargarFeed]);


    if (loadingFeed) {
        return (
            <div className="feed-page-container">
                <button className="btn-volver" onClick={() => navigate('/comunidad')} disabled>&larr; Volver a Comunidad</button>
                <div className="feed-header">
                    <img src={iconoFeed} alt="" width="64" height="64" />
                    <h2>Feed de Actividad</h2>
                    <p className="subtitle">Mira la actividad reciente de tus amigos.</p>
                </div>
                <p className="subtitle" style={{ textAlign: 'center', marginTop: '3rem' }}>Cargando actividad...</p>
            </div>
        );
    }

    return (
        <div className="feed-page-container">
            
            <button className="btn-volver" onClick={() => navigate('/comunidad')}>
                &larr; Volver a Comunidad
            </button>
            
            <div className="feed-header">
                <img src={iconoFeed} alt="" width="64" height="64" />
                <h2>Feed de Actividad</h2>
                <p className="subtitle">Mira la actividad reciente de tus amigos.</p>
            </div>

            {error && <div className="message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            {feedItems.length > 0 ? (
                <div className="feed-container">
                    {/* Mapeamos y renderizamos el componente FeedItem */}
                    {feedItems.map((item, index) => (
                        <FeedItem 
                            key={item.sesion_id || index} // Usar sesion_id como key
                            item={item} 
                            token={token} 
                        />
                    ))}
                </div>
            ) : (
                <p className="feed-empty">
                    Aún no hay actividad reciente de tus amigos. ¡Anímales a entrenar!
                </p>
            )}
        </div>
    );
}

export default FeedPage;