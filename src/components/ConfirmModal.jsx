import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  message = "Are you sure you want to delete this task ? This action cannot be undone.", 
  confirmText = "Delete Task",
  onConfirm, 
  onCancel 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="confirm-modal-close-btn" onClick={onCancel}>
          <X size={16} />
        </button>

        <div className="confirm-modal-header">
          <p className="confirm-modal-text">{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button type="button" className="confirm-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="confirm-btn-danger" onClick={onConfirm}>
            <Trash2 size={16} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
