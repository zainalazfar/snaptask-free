import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Plus, X, Image as ImageIcon, UploadCloud, ZoomIn } from 'lucide-react';

const MAX_EVIDENCE_IMAGES = 1;

export default function CompleteModal({
  isOpen,
  task,
  onConfirm,
  onCancel,
  onOpenImage
}) {
  const [remark, setRemark] = useState('');
  const [evidencePictures, setEvidencePictures] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const modalCardRef = useRef(null);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen && task) {
      setRemark(task.remark || '');
      setEvidencePictures(task.evidencePictures ? task.evidencePictures.slice(0, 1) : []);
    }
  }, [isOpen, task]);

  // Handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !task) return null;

  // Process incoming image file (strictly 1 image per evidence)
  const processImageFiles = (files) => {
    const validFiles = Array.from(files).filter(
      (file) => file && (file.type?.startsWith('image/') || file.type?.indexOf('image') !== -1)
    );
    if (validFiles.length === 0) return;

    const file = validFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      const imageName = file.name || `Evidence_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`;

      // Stores strictly one evidence image (replaces any previous one)
      setEvidencePictures([
        {
          id: `ev-${Date.now()}`,
          name: imageName,
          data: imageData,
          size: (file.size / 1024).toFixed(1) + ' KB'
        }
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste (Ctrl+V) handler for screenshots
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    const files = e.clipboardData?.files;
    let imageFiles = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type?.startsWith('image/')) {
          imageFiles.push(files[i]);
        }
      }
    }

    if (imageFiles.length === 0 && items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type?.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      processImageFiles(imageFiles);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const removeEvidence = (id) => {
    setEvidencePictures((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onConfirm({
      remark: remark.trim(),
      evidencePictures
    });
  };

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div 
        ref={modalCardRef}
        className={`complete-modal-card ${isDragOver ? 'drag-over' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPaste={handlePaste}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        <button type="button" className="confirm-modal-close-btn" onClick={onCancel} title="Close">
          <X size={16} />
        </button>

        <form onSubmit={handleSubmit} className="complete-modal-form">
          {/* Remark Text Field */}
          <div className="complete-input-group">
            <label className="complete-input-label" htmlFor="complete-remark">
              Remark
            </label>
            <textarea
              id="complete-remark"
              className="complete-modal-textarea"
              placeholder="Remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              style={{ resize: 'none' }}
              autoFocus
            />
          </div>

          {/* Evidence Section */}
          <div className="complete-input-group">
            <div className="complete-evidence-header">
              <label className="complete-input-label">
                Evidence
                {evidencePictures.length > 0 && (
                  <span className="evidence-count-badge">({evidencePictures.length})</span>
                )}
              </label>
            </div>

            {/* Evidence Preview / Upload Area */}
            <div className="complete-evidence-gallery">
              {evidencePictures.map((pic, idx) => (
                <div 
                  key={pic.id || idx} 
                  className="complete-evidence-preview-card"
                  onClick={() => onOpenImage && onOpenImage({ data: pic.data, name: pic.name || 'Evidence Screenshot' })}
                  title="Click to enlarge / view full-screen"
                >
                  <img 
                    src={pic.data} 
                    alt={pic.name || `Evidence ${idx + 1}`} 
                  />
                  <div className="evidence-preview-hover-overlay">
                    <ZoomIn size={22} />
                    <span>Click to enlarge</span>
                  </div>
                  <button
                    type="button"
                    className="remove-evidence-thumb-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEvidence(pic.id);
                    }}
                    title="Remove evidence"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {evidencePictures.length < MAX_EVIDENCE_IMAGES && (
                <label className="complete-add-evidence-btn" title="Add image evidence">
                  <Plus size={22} />
                  <span>Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="complete-modal-actions">
            <button type="button" className="complete-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="complete-btn-confirm">
              <CheckCircle2 size={16} />
              <span>Done</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
