// frontend/src/components/ConfirmarBorrarEjercicioModal.js
import React from 'react';
// Puedes crear un CSS específico o reutilizar/adaptar el de ConfirmarBorradoModal
import './ConfirmarBorradoModal.css'; // O crea './ConfirmarBorrarEjercicioModal.css' si prefieres

function ConfirmarBorrarEjercicioModal({ isOpen, onClose, onConfirm, ejercicioNombre, isDeleting }) {
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
          <p>¿Estás seguro de que quieres eliminar permanentemente el ejercicio:</p>
          {/* Mostramos el nombre del ejercicio */}
          <strong>{ejercicioNombre}</strong>
          <p>de esta rutina?</p>
          {/* Aviso importante */}
          <p className="text-danger-warning">
            Esta acción <strong>no</strong> borrará tu historial o récords pasados para este ejercicio en general, solo lo quitará de la rutina actual.
          </p>
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
            onClick={onConfirm} // Llama a la función que pasamos como prop
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarBorrarEjercicioModal;