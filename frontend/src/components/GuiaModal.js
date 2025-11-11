import React from 'react';
import './GuiaModal.css'; // Usaremos un CSS nuevo y limpio

function GuiaModal({ isOpen, onClose, titulo, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop (fondo oscuro)
    <div className="modal-backdrop-guia" onClick={onClose}>
      
      {/* Contenido del modal */}
      <div className="modal-content-guia" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera */}
        <div className="modal-header-guia">
          <h3>{titulo}</h3>
          <button className="modal-close-btn-guia" onClick={onClose}>
            &times;
          </button>
        </div>
        
        {/* Cuerpo (aquí se inyecta el texto) */}
        <div className="modal-body-guia">
          {children}
        </div>

        {/* Pie (solo un botón de 'Entendido') */}
        <div className="modal-footer-guia">
           <button 
            type="button" 
            className="btn-confirm-guia" // Un botón con estilo principal
            onClick={onClose} 
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}

export default GuiaModal;