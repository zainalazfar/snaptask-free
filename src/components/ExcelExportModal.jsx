import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Sliders, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Check, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { 
  PRESET_OPTIONS, 
  DEFAULT_EXCEL_SETTINGS, 
  getSavedExcelSettings, 
  saveExcelSettings 
} from '../utils/excelExport.js';

export default function ExcelExportModal({ isOpen, onClose, onConfirmExport, tasksCount = 0 }) {
  const [selectedPreset, setSelectedPreset] = useState('aesthetic');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [rowHeightText, setRowHeightText] = useState(46);
  const [rowHeightImage, setRowHeightImage] = useState(96);
  const [taskColWidth, setTaskColWidth] = useState(55);
  const [zebraStriping, setZebraStriping] = useState(true);
  const [headerTheme, setHeaderTheme] = useState('slate');
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Load saved preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedExcelSettings();
      setSelectedPreset(saved.preset || 'aesthetic');
      setIsCustomMode(saved.preset === 'custom');
      setRowHeightText(saved.rowHeightText || 46);
      setRowHeightImage(saved.rowHeightImage || 96);
      setTaskColWidth(saved.taskColWidth || 55);
      setZebraStriping(saved.zebraStriping !== false);
      setHeaderTheme(saved.theme || 'slate');
    }
  }, [isOpen]);

  // Handle preset selection
  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setIsCustomMode(false);
    setRowHeightText(preset.rowHeightText);
    setRowHeightImage(preset.rowHeightImage);
    setTaskColWidth(preset.taskColWidth);
  };

  const handleExport = () => {
    const options = {
      preset: isCustomMode ? 'custom' : selectedPreset,
      rowHeightText: Number(rowHeightText),
      rowHeightImage: Number(rowHeightImage),
      taskColWidth: Number(taskColWidth),
      zebraStriping,
      theme: headerTheme
    };

    if (saveAsDefault) {
      saveExcelSettings(options);
    }

    onConfirmExport(options);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="export-modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="export-modal-header">
          <div className="export-modal-icon-badge">
            <FileSpreadsheet size={24} />
          </div>
          <div className="export-modal-header-text">
            <h3>Export to Excel</h3>
            <p>Customize row height & column width for an aesthetically pleasing spreadsheet</p>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="export-section-label">
          <span>Choose Row & Column Preset</span>
        </div>

        <div className="export-presets-grid">
          {PRESET_OPTIONS.map((p) => {
            const isSelected = !isCustomMode && selectedPreset === p.id;
            return (
              <div
                key={p.id}
                className={`export-preset-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectPreset(p)}
              >
                <div className="preset-card-top">
                  <span className="preset-name">{p.name}</span>
                  {p.badge && (
                    <span className={`preset-badge ${p.id === 'aesthetic' ? 'badge-recommended' : ''}`}>
                      {p.badge}
                    </span>
                  )}
                </div>

                <p className="preset-desc">{p.description}</p>

                <div className="preset-specs-row">
                  <span className="spec-tag">Text: {p.rowHeightText}pt</span>
                  <span className="spec-tag">Image: {p.rowHeightImage}pt</span>
                  <span className="spec-tag">Col: {p.taskColWidth}</span>
                </div>

                {isSelected && (
                  <div className="preset-active-check">
                    <Check size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Dimensions Toggle */}
        <div className="export-custom-toggle-wrap">
          <button
            type="button"
            className={`export-custom-toggle-btn ${isCustomMode ? 'active' : ''}`}
            onClick={() => setIsCustomMode(!isCustomMode)}
          >
            <Sliders size={15} />
            <span>{isCustomMode ? 'Using Custom Dimensions' : 'Fine-Tune Custom Dimensions...'}</span>
          </button>
        </div>

        {/* Custom Controls Sliders Panel */}
        {isCustomMode && (
          <div className="export-custom-panel fade-in">
            <div className="custom-control-item">
              <div className="control-label-row">
                <label>Text Row Height</label>
                <span className="control-value-badge">{rowHeightText} pt</span>
              </div>
              <input 
                type="range" 
                min="28" 
                max="80" 
                step="2" 
                value={rowHeightText} 
                onChange={(e) => setRowHeightText(Number(e.target.value))}
                className="custom-range-slider"
              />
              <span className="control-hint">Height for rows with text description only (Default: 46pt)</span>
            </div>

            <div className="custom-control-item">
              <div className="control-label-row">
                <label>Image Row Height</label>
                <span className="control-value-badge">{rowHeightImage} pt</span>
              </div>
              <input 
                type="range" 
                min="60" 
                max="160" 
                step="4" 
                value={rowHeightImage} 
                onChange={(e) => setRowHeightImage(Number(e.target.value))}
                className="custom-range-slider"
              />
              <span className="control-hint">Height for rows with screenshots (Default: 96pt)</span>
            </div>

            <div className="custom-control-item">
              <div className="control-label-row">
                <label>Task Column Width</label>
                <span className="control-value-badge">{taskColWidth}</span>
              </div>
              <input 
                type="range" 
                min="35" 
                max="90" 
                step="5" 
                value={taskColWidth} 
                onChange={(e) => setTaskColWidth(Number(e.target.value))}
                className="custom-range-slider"
              />
              <span className="control-hint">Width of the main Task Description column (Default: 55)</span>
            </div>
          </div>
        )}

        {/* Styling Options Row */}
        <div className="export-options-row">
          <label className="export-checkbox-label" onClick={() => setZebraStriping(!zebraStriping)}>
            {zebraStriping ? <CheckSquare size={16} className="checkbox-icon checked" /> : <Square size={16} className="checkbox-icon" />}
            <span>Soft alternating row colors (Zebra)</span>
          </label>

          <label className="export-checkbox-label" onClick={() => setSaveAsDefault(!saveAsDefault)}>
            {saveAsDefault ? <CheckSquare size={16} className="checkbox-icon checked" /> : <Square size={16} className="checkbox-icon" />}
            <span>Remember as default</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="export-modal-footer">
          <button type="button" className="export-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="export-btn-confirm" onClick={handleExport}>
            <FileSpreadsheet size={17} />
            <span>Download Excel ({tasksCount} {tasksCount === 1 ? 'task' : 'tasks'})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
