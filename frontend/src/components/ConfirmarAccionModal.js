import React from 'react';
import './ConfirmarBorradoModal.css';

// Modal generico para acciones peligrosas
function ConfirmarAccionModal({ 
  isOpen: abierto, 
  onClose: cerrar, 
  onConfirm: confirmar, 
  titulo, 
  mensaje, 
  textoBotonConfirmar = "Confirmar",
  isConfirmando = false
}) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="modal-backdrop-danger" onClick={cerrar}>
      <div className="modal-content-danger" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header-danger">
          <h3>{titulo}</h3>
          <button 
            className="modal-close-btn-danger" 
            onClick={cerrar} 
            disabled={isConfirmando}
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body-danger">
          <p>{mensaje}</p>
        </div>
        
        <div className="modal-footer-danger">
          <button
            type="button"
            className="btn-cancel-danger"
            onClick={cerrar}
            disabled={isConfirmando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-confirm-danger"
            onClick={confirmar} 
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