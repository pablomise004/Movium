// ---- frontend/src/components/CardioRankingCard.js (NUEVO ARCHIVO) ----

import React from 'react';
import './CardioRankingCard.css'; // Crearemos este CSS

// Helper para renderizar una lista de ranking (Top 3)
const renderRankingList = (data, miUsuarioId, label) => {
  if (!data || data.length === 0) {
    return <p className="no-ranking-data">Sin datos</p>;
  }

  // Usamos los mismos emojis de medalla que en RankingCard
  const MEDALLAS = ['🥇', '🥈', '🥉'];

  return (
    <ol className="mini-ranking-list">
      {data.map((item, index) => {
        const esUsuarioLogueado = item.usuario_id == miUsuarioId;
        return (
          <li key={item.usuario_id} className={`mini-ranking-item ${esUsuarioLogueado ? 'is-me' : ''}`}>
            <span className="mini-ranking-pos">{MEDALLAS[index] || `${index + 1}.`}</span>
            <span className="mini-ranking-user">
              {item.nombre_usuario} {esUsuarioLogueado && '(Tú)'}
            </span>
            <span className="mini-ranking-value">
              {item.valor || 0}
              <span className="mini-ranking-label">{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

function CardioRankingCard({ title, rankings, miUsuarioId }) {
  // rankings = { max_dist: [...], max_tiempo: [...], max_velocidad_media: [...] }

  return (
    <div className="cardio-ranking-card">
      <div className="cardio-ranking-header">
        <strong>{title}</strong>
      </div>
      <div className="cardio-ranking-body">
        {/* Sección Max Distancia */}
        <div className="metric-section">
          <h4>📍 Mayor Distancia</h4>
          {renderRankingList(rankings?.max_distancia, miUsuarioId, 'km')}
        </div>

        {/* Sección Max Tiempo */}
        <div className="metric-section">
          <h4>⏱️ Mayor Tiempo</h4>
          {renderRankingList(rankings?.max_tiempo, miUsuarioId, 'min')}
        </div>

        {/* Sección Max Velocidad */}
        <div className="metric-section">
          <h4>⚡ Velocidad Media Máx</h4>
          {renderRankingList(rankings?.max_velocidad_media, miUsuarioId, 'km/h')}
        </div>
      </div>
    </div>
  );
}

export default CardioRankingCard;