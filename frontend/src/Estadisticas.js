import React, { useState, useEffect } from 'react';
import './Estadisticas.css';
import iconoTrofeo from './assets/trofeo.png';
import iconoEstrella from './assets/estrella.png';
import { API_BASE_URL } from './config';

const TabMisPRs = ({ token }) => {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');

  useEffect(() => {
    const cargarMisPRs = async () => {
      setCargando(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}get_mis_todos_prs.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const datos = await res.json();
      if (!res.ok) setError(datos.mensaje || 'Error al cargar mis PRs.');
      else setRegistros(datos);
      setCargando(false);
    };

    if (token) {
      cargarMisPRs();
    } else {
      setError('Token no disponible.');
      setCargando(false);
    }
  }, [token]);

  const gruposMuscularesPRs = ['Todos'];
  registros.forEach(pr => {
    if (pr.grupo_muscular && gruposMuscularesPRs.indexOf(pr.grupo_muscular) === -1) {
      gruposMuscularesPRs.push(pr.grupo_muscular);
    }
  });

  const listaFiltrada = registros.filter(pr => {
    if (filtroGrupo !== 'Todos' && pr.grupo_muscular !== filtroGrupo) return false;
    if (filtroTexto && !pr.nombre.toLowerCase().includes(filtroTexto.toLowerCase())) return false;
    return true;
  });

  const renderPR = (pr) => {
    if (pr.tipo === 'cardio') {
      const hasSpeed = pr.max_velocidad_media != null;
      const tiempoDisplay = pr.max_tiempo != null ? `${pr.max_tiempo} min` : '0 min';
      const distDisplay = pr.max_dist != null ? `${pr.max_dist} km` : '0 km';
      const speedDisplay = hasSpeed ? `${pr.max_velocidad_media} km/h` : '0 km/h';

      return (
        <div className="pr-records-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="pr-record-item">
            <strong>Mayor Tiempo</strong>
            <span>{tiempoDisplay}</span>
          </div>
          <div className="pr-record-item">
            <strong>Mayor Distancia</strong>
            <span>{distDisplay}</span>
          </div>
          <div className="pr-record-item" style={!hasSpeed ? { opacity: 0.6 } : {}}>
            <strong>Velocidad Media Max</strong>
            <span>{speedDisplay}</span>
          </div>
        </div>
      );
    }

    const pesoDisplay = pr.max_peso != null ? `${pr.max_peso} kg` : '0 kg';
    const repsDisplay = pr.max_reps != null ? pr.max_reps : '0';
    const hasE1rm = pr.max_e1rm != null;
    const e1rmDisplay = hasE1rm ? `${pr.max_e1rm} kg` : '-';

    return (
      <div className="pr-records-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="pr-record-item">
          <strong>Mayor Peso</strong>
          <span>{pesoDisplay}</span>
        </div>
        <div className="pr-record-item">
          <strong>Maximas Reps</strong>
          <span>{repsDisplay}</span>
        </div>
        <div className="pr-record-item" style={!hasE1rm ? { opacity: 0.6 } : {}}>
          <strong>e1RM Est.</strong>
          <span>{e1rmDisplay}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="pr-filtros">
        <input
          type="search"
          placeholder="Filtrar por nombre..."
          className="modal-search pr-search-input"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
        <select
          className="modal-group-select"
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
        >
          {gruposMuscularesPRs.map(grupo => (
            <option key={grupo} value={grupo}>
              {grupo === 'Todos' ? 'Todos los Grupos' : (grupo || 'Sin Grupo')}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '0' }}>
        <img src={iconoEstrella} alt="" width="64" height="64" />
        <h3 className="section-title" style={{ marginTop: '0', marginBottom: '1.5rem' }}>
          Tus Records Personales
        </h3>
      </div>

      {error && <div className="message" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {cargando && <p className="subtitle" style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando tus records...</p>}

      {!cargando && !error && (
        <div className="pr-list-container">
          {listaFiltrada.length > 0 ? (
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
            <p className="no-data-msg" style={{ border: 'none', padding: '2rem 0' }}>
              {registros.length === 0 ? 'Aun no tienes PRs registrados.' : 'No se encontraron PRs con ese filtro.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

function Estadisticas() {
  const token = localStorage.getItem('movium_token');

  return (
    <div className="estadisticas-container">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
        <img src={iconoTrofeo} alt="" width="64" height="64" />
        <h2>Records</h2>
      </div>
      <p className="subtitle" style={{ textAlign: 'center' }}>
        Tu historial de mejores marcas personales.
      </p>

      <TabMisPRs token={token} />
    </div>
  );
}

export default Estadisticas;