import React from 'react';
// Reutilizamos el CSS del modal de borrado para el estilo "danger"
import './ConfirmarBorradoModal.css';

/**
 * Un modal genérico para confirmar acciones peligrosas (rojas).
 * Acepta props para personalizar el texto.
 */
function ConfirmarAccionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo, 
  mensaje, 
  textoBotonConfirmar = "Confirmar", // Texto por defecto
  isConfirmando = false // Para mostrar estado de carga
}) {
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop-danger" onClick={onClose}>
      <div className="modal-content-danger" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header-danger">
          <h3>{titulo}</h3>
          <button 
            className="modal-close-btn-danger" 
            onClick={onClose} 
            disabled={isConfirmando}
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body-danger">
          {/* El mensaje se pasa como prop */}
          <p>{mensaje}</p>
        </div>
        
        <div className="modal-footer-danger">
          <button
            type="button"
            className="btn-cancel-danger"
            onClick={onClose}
            disabled={isConfirmando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-confirm-danger"
            onClick={onConfirm} 
            disabled={isConfirmando}
          >
            {isConfirmando ? 'Cargando...' : textoBotonConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarAccionModal;