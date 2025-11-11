// ---- frontend/src/components/UsuarioCard.js (CORREGIDO) ----

import React from 'react';
import './UsuarioCard.css';

function UsuarioCard({ usuario, tipo, onAddAmigo, onDeleteAmigo, onVerPRs }) {
  
  const { id, nombre_usuario, son_amigos, solicitante_id } = usuario;

  // --- ¡CORRECCIÓN DE LÓGICA AQUÍ! ---
  // 'id' es el ID del amigo (ej: 10)
  // 'solicitante_id' es quién inició la amistad (ej: 5 si fui yo, 10 si fue él)
  // Si son iguales, significa que él inició la amistad ("Te añadió").
  const teAnadioEl = (solicitante_id === id);

  return (
    <div className="usuario-card">
      <div className="usuario-info">
        <strong>{nombre_usuario}</strong>
        {tipo === 'amigo' && (
          // Usamos la lógica corregida
          <span>{teAnadioEl ? 'Te añadió' : 'Añadido por ti'}</span>
        )}
      </div>
      
      <div className="usuario-actions">
        {tipo === 'amigo' ? (
          <>
            <button 
              className="btn-card-action btn-card-delete" // Botón gris
              onClick={onVerPRs}
            >
              Ver PRs
            </button>
            <button 
              className="btn-card-action btn-card-unfriend" // Botón rojo
              onClick={onDeleteAmigo}
            >
              Eliminar
            </button>
          </>
        ) : (
          // tipo === 'busqueda'
          son_amigos ? (
            <button 
              className="btn-card-action btn-card-delete" // Botón gris
              onClick={onDeleteAmigo}
            >
              Eliminar Amigo
            </button>
          ) : (
            <button 
              className="btn-card-action btn-card-add" // Botón azul/verde
              onClick={onAddAmigo}
            >
              Añadir Amigo
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default UsuarioCard;