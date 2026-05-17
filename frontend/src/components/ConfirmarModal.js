import React from 'react';
import './ConfirmarBorradoModal.css';

function ConfirmarModal({ isOpen, onClose, onConfirm, isDeleting, nombre, mensaje }) {
  if (!isOpen) return null;

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
          <p>¿Estás seguro de que quieres eliminar:</p>
          <strong>{nombre}</strong>
          {mensaje && <p className="text-danger-warning">{mensaje}</p>}
          <p>Esta acción no se puede deshacer.</p>
        </div>
        <div className="modal-footer-danger">
          <button type="button" className="btn-cancel-danger" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </button>
          <button type="button" className="btn-confirm-danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarModal;
