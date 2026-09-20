import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, X } from 'lucide-react';
import { uploadTaskImage } from '../services/imageUploadService.js';

export default function ChatInput({ onAddTask }) {
  const [description, setDescription] = useState('');
  const [pastedImages, setPastedImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [description]);

  // Helper to process any image file (from drop, file input, or paste)
  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      const imageName = file.name || `Screenshot_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`;
      
      setPastedImages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          name: imageName,
          data: imageData,
          file: file,
          size: (file.size / 1024).toFixed(1) + ' KB'
        }
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Direct Clipboard Paste Handler (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    const files = e.clipboardData && e.clipboardData.files;

    let processedAny = false;

    // Check files array first (when copying multiple image files from File Explorer)
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          processImageFile(files[i]);
          processedAny = true;
        }
      }
    }

    // Check items (for direct screen capture pastes)
    if (!processedAny && items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
          }
        }
      }
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        processImageFile(file);
      });
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        processImageFile(file);
      });
    }
  };

  const removeImage = (id) => {
    setPastedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Submit / Store Task
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!description.trim() && pastedImages.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const picturesList = await Promise.all(
        pastedImages.map(async (img) => ({
          id: img.id,
          name: img.name,
          data: img.file ? await uploadTaskImage(img.file, img.data) : img.data
        }))
      );

      onAddTask({
        description: description.trim(),
        pictures: picturesList,
        pictureData: picturesList.length > 0 ? picturesList[0].data : null,
        pictureName: picturesList.length > 0 ? picturesList[0].name : '',
        pictureDesc: '',
        status: 'Not Started'
      });

      setDescription('');
      setPastedImages([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = (!description.trim() && pastedImages.length === 0) || isUploading;

  return (
    <div className={`chat-box-container ${pastedImages.length > 0 ? 'has-images' : ''} ${isDragOver ? 'drag-over' : ''}`}>
      {/* Inline Theme SVG Gradient Definition */}
      <svg width="0" height="0" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <linearGradient id="theme-store-arrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </svg>

      <div 
        className="chat-box-wrapper"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Attached Images Preview Row (Gemini Style: smooth grid expansion + hover tooltip) */}
        <div className={`image-previews-expand-wrapper ${pastedImages.length > 0 ? 'open' : ''}`}>
          <div className="image-previews-expand-inner">
            <div className="image-previews-container">
              {pastedImages.map((img) => (
                <div key={img.id} className="image-preview-card">
                  <img src={img.data} alt={img.name} className="img-thumbnail" />
                  <button 
                    type="button" 
                    className="remove-img-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                  <div className="image-hover-tooltip">{img.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Single Row: '+' Icon + 'Add Task' Textarea + Theme Gradient Arrow Icon */}
        <div className="chat-input-single-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />

          {/* Left: Pure '+' Icon button */}
          <button
            type="button"
            className="plus-icon-btn-pure"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={25} />
          </button>

          {/* Center: Textarea */}
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Add Task"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          {/* Right: Pure Arrow Icon with Theme Gradient inline with text */}
          <button
            type="button"
            className={`store-icon-btn-pure ${isDisabled || isUploading ? 'disabled' : ''}`}
            onClick={handleSubmit}
            disabled={isDisabled || isUploading}
          >
            <Send size={25} className="store-icon-gradient" />
          </button>
        </div>
      </div>
    </div>
  );
}
