import React from 'react';
// Reutilizamos el CSS del modal de borrado, ya que es una acción "peligrosa" (pérdida de datos)
import './ConfirmarBorradoModal.css'; 

/**
 * Un modal genérico para confirmar la salida, advirtiendo de la pérdida de progreso.
 */
function ConfirmarSalirModal({ isOpen, onClose, onConfirm }) {
  
  // No renderizar si no está abierto
  if (!isOpen) {
    return null;
  }

  return (
    // Usamos las clases de CSS del modal de borrado
    <div className="modal-backdrop-danger" onClick={onClose}>
      <div className="modal-content-danger" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header-danger">
          <h3>Confirmar Salida</h3>
          <button className="modal-close-btn-danger" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="modal-body-danger">
          <p>¿Estás seguro de que quieres salir?</p>
          
          {/* Reutilizamos el estilo de advertencia */}
          <p className="text-danger-warning">
            <strong>Se perderá todo el progreso</strong> que has registrado en esta sesión.
          </p>
        </div>
        
        <div className="modal-footer-danger">
          <button
            type="button"
            className="btn-cancel-danger"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-confirm-danger" // Botón rojo
            onClick={onConfirm} 
          >
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarSalirModal;