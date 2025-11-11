// ---- frontend/src/components/RankingCard.js (NUEVO ARCHIVO) ----

import React from 'react';
import './RankingCard.css'; // Crearemos este CSS

// Array de medallas para el Top 3
const MEDALLAS = ['🥇', '🥈', '🥉'];

function RankingCard({ title, data, miUsuarioId, labelOverride = null }) {

  // Comprueba si hay datos o si está vacío
  const hayDatos = data && data.length > 0;

  return (
    <div className="ranking-podium-card">
      <div className="ranking-podium-header">
        <strong>{title}</strong>
      </div>
      <div className="ranking-podium-body">
        {hayDatos ? (
          <ol className="podium-list">
            {data.map((item, index) => {
              // Comprobamos si esta fila es del usuario logueado
              const esUsuarioLogueado = item.usuario_id == miUsuarioId;
              
              return (
                <li 
                  key={item.usuario_id} 
                  className={`podium-item ${esUsuarioLogueado ? 'is-me' : ''}`}
                >
                  <span className="podium-pos">{MEDALLAS[index] || `${index + 1}.`}</span>
                  <span className="podium-user">
                    {item.nombre_usuario} {esUsuarioLogueado && '(Tú)'}
                  </span>
                  <span className="podium-value">
                    {/* Usamos el 'valor' y la 'label' que nos da el PHP.
                      (p.ej. 100 kg, 10.5 km, 25 min, 14.2 km/h)
                    */}
                    {item.valor || 0}
                    <span className="podium-label">{labelOverride || item.label}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="podium-no-data">
            Aún no hay récords para este ejercicio entre tus amigos.
          </p>
        )}
      </div>
    </div>
  );
}

export default RankingCard;