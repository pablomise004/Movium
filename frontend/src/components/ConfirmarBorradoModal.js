import React from 'react';
import './ConfirmarBorradoModal.css'; 

function ConfirmarBorradoModal({ isOpen: abierto, onClose: cerrar, onConfirm: confirmar, rutinaNombre: nombreRutina, isDeleting: borrando }) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="modal-backdrop-danger" onClick={cerrar}>
      <div className="modal-content-danger" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header-danger">
          <h3>Confirmar Eliminación</h3>
          <button className="modal-close-btn-danger" onClick={cerrar} disabled={borrando}>
            &times;
          </button>
        </div>
        
        <div className="modal-body-danger">
          <p>¡Atención! Estás a punto de borrar permanentemente la rutina:</p>
          <strong>{nombreRutina}</strong>
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
            onClick={cerrar} 
            disabled={borrando}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn-confirm-danger" 
            onClick={confirmar} 
            disabled={borrando}
          >
            {borrando ? 'Eliminando...' : 'Sí, eliminar todo'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConfirmarBorradoModal;