import React, { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageLightbox({ image, onClose }) {
  const pictures = (image?.pictures && image.pictures.length > 0)
    ? image.pictures
    : (image?.data ? [{ data: image.data, name: image.name }] : []);

  const [activeIndex, setActiveIndex] = useState(image?.currentIndex || 0);

  useEffect(() => {
    if (image?.currentIndex !== undefined) {
      setActiveIndex(image.currentIndex);
    }
  }, [image]);

  const total = pictures.length;
  const currentPic = pictures[activeIndex] || pictures[0] || {};

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && total > 1) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && total > 1) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, total]);

  if (!image || total === 0) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPic.data;
    link.download = currentPic.name || `meeting_screenshot_${activeIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      {/* Navigation Arrow Left OUTSIDE Lightbox content */}
      {total > 1 && (
        <button 
          type="button"
          className="lightbox-nav-btn prev" 
          onClick={(e) => {
            e.stopPropagation();
            handlePrev(e);
          }} 
        >
          <ChevronLeft size={30} />
        </button>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {/* Floating Action Buttons Overlay at top-right corner */}
        <div className="lightbox-overlay-actions">
          {total > 1 && (
            <span className="lightbox-count-badge">
              {activeIndex + 1} / {total}
            </span>
          )}
          <button className="overlay-icon-btn" onClick={handleDownload}>
            <Download size={18} />
          </button>
          <button className="overlay-icon-btn close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="lightbox-body">
          <img src={currentPic.data} alt={currentPic.name || image.description || 'Meeting screenshot'} />
        </div>
      </div>

      {/* Navigation Arrow Right OUTSIDE Lightbox content */}
      {total > 1 && (
        <button 
          type="button"
          className="lightbox-nav-btn next" 
          onClick={(e) => {
            e.stopPropagation();
            handleNext(e);
          }} 
        >
          <ChevronRight size={30} />
        </button>
      )}
    </div>
  );
}
