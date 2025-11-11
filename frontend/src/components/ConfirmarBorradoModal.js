import React from 'react';
import './ConfirmarBorradoModal.css'; 

function ConfirmarBorradoModal({ isOpen, onClose, onConfirm, rutinaNombre, isDeleting }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop-danger" onClick={onClose}>
      <div className="modal-content-danger" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header-danger">
          <h3>Confirmar Eliminación</h3>
          <button className="modal-close-btn-danger" onClick={onClose} disabled={isDeleting}>
            &times;
          </button>
        </div>
        
        <div className="modal-body-danger">
          <p>¡Atención! Estás a punto de borrar permanentemente la rutina:</p>
          <strong>{rutinaNombre}</strong>
          <p>Esta acción no se puede deshacer.</p>
          
          {/* --- CORRECCIÓN AQUÍ --- 
              Añadimos un <span> con la clase de peligro al texto clave
          */}
          <p className="text-danger-warning">
            Se borrarán todos los ejercicios de la rutina y, lo más importante, 
            <strong> todo el historial de progreso de ella, los ejercios asociados desaparecerán del feed de tus amigos y de tu calendario</strong>, aunque no perderás tus PRs ni cualquier comparativa con tus amigos en los Rankings.
          </p>
          
          {/* --- CORRECCIÓN AQUÍ --- 
              Eliminamos el punto que se había colado
          */}
          
          <p>¿Estás completamente seguro?</p>
        </div>

        <div className="modal-footer-danger">
          <button 
            type="button" 
            className="btn-cancel-danger" 
            onClick={onClose} 
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn-confirm-danger" 
            onClick={onConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar todo'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConfirmarBorradoModal;