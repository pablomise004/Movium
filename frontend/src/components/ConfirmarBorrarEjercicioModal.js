import React from 'react';
import './ConfirmarBorradoModal.css';

function ConfirmarBorrarEjercicioModal({ isOpen: abierto, onClose: cerrar, onConfirm: confirmar, ejercicioNombre: nombreEjercicio, isDeleting: borrando }) {
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
          <p>¿Estás seguro de que quieres eliminar permanentemente el ejercicio:</p>
          <strong>{nombreEjercicio}</strong>
          <p>de esta rutina?</p>
          <p className="text-danger-warning">
            Esta acción <strong>no</strong> borrará tu historial o récords pasados para este ejercicio en general, solo lo quitará de la rutina actual.
          </p>
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
            {borrando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarBorrarEjercicioModal;