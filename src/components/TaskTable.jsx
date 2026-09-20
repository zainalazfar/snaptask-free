import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Plus,
  Image as ImageIcon, 
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function CustomStatusSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const options = [
    { value: 'Not Started', label: 'Not Started', dotClass: 'dot-not-started', badgeClass: 'not-started' },
    { value: 'In Progress', label: 'In Progress', dotClass: 'dot-in-progress', badgeClass: 'in-progress' },
    { value: 'Done', label: 'Done', dotClass: 'dot-done', badgeClass: 'done' }
  ];

  const currentOption = options.find((o) => o.value === value) || options[0];

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 140;

      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        // Open UPWARDS above button
        setMenuStyle({
          position: 'fixed',
          top: `${rect.top - menuHeight - 6}px`,
          left: `${rect.left}px`,
          width: `${Math.max(rect.width, 160)}px`,
          zIndex: 9999
        });
      } else {
        // Open DOWNWARDS below button
        setMenuStyle({
          position: 'fixed',
          top: `${rect.bottom + 6}px`,
          left: `${rect.left}px`,
          width: `${Math.max(rect.width, 160)}px`,
          zIndex: 9999
        });
      }
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="custom-status-dropdown-container">
      <button
        ref={triggerRef}
        type="button"
        className={`custom-status-trigger ${currentOption.badgeClass}`}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
      >
        <span className="status-trigger-left">
          <span className={`dot ${currentOption.dotClass}`} />
          <span className="status-trigger-text">{currentOption.label}</span>
        </span>
        <ChevronDown size={14} className={`dropdown-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="custom-status-menu fixed-portal"
          style={menuStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`custom-status-option ${opt.badgeClass} ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span className="status-option-left">
                <span className={`dot ${opt.dotClass}`} />
                <span>{opt.label}</span>
              </span>
              {opt.value === value && <Check size={14} className="option-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskImageCell({ 
  pictures, 
  pictureDesc, 
  onOpenImage, 
  isEditing, 
  editPictures, 
  setEditPictures, 
  editPicDesc, 
  setEditPicDesc 
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  const processFileToEditPictures = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditPictures((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          name: file.name || `Image_${prev.length + 1}.png`,
          data: e.target.result
        }
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFileToEditPictures);
    }
  };

  const removeEditPicture = (id) => {
    setEditPictures((prev) => prev.filter((p) => p.id !== id));
  };

  if (isEditing) {
    return (
      <div className="picture-cell-edit-mode">
        <div className="edit-gallery-thumbs">
          {editPictures && editPictures.map((pic, pIdx) => (
            <div key={pic.id || pIdx} className="edit-thumb-card">
              <img src={pic.data} alt={pic.name || `Image ${pIdx + 1}`} />
              <button 
                type="button" 
                className="remove-edit-thumb-btn" 
                onClick={() => removeEditPicture(pic.id)}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          <label className="add-edit-thumb-btn">
            <Plus size={16} />
            <span>Add</span>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleAddImageSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    );
  }

  // Normal View Mode
  const total = pictures ? pictures.length : 0;
  if (total === 0) {
    return <span className="no-pic-placeholder">N/A</span>;
  }

  const currentPic = pictures[activeIdx] || pictures[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  return (
    <div className="picture-cell-content">
      {/* Main Carousel Preview Card with Arrows Outside */}
      <div className="carousel-preview-wrapper">
        {total > 1 && (
          <button type="button" className="carousel-arrow-btn prev" onClick={handlePrev}>
            <ChevronLeft size={24} />
          </button>
        )}

        <div 
          className="pic-preview-card carousel-card"
          onClick={() => onOpenImage({ pictures, currentIndex: activeIdx, data: currentPic.data, name: currentPic.name, description: pictureDesc })}
        >
          <img src={currentPic.data} alt={currentPic.name || `Screenshot ${activeIdx + 1}`} />
          <div className="pic-overlay">
            <ExternalLink size={16} />
          </div>

          {total > 1 && (
            <span className="carousel-badge">{activeIdx + 1}/{total}</span>
          )}
        </div>

        {total > 1 && (
          <button type="button" className="carousel-arrow-btn next" onClick={handleNext}>
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Selector Mini Thumbnails Bar */}
      {total > 1 && (
        <div className="carousel-thumbnails-bar">
          {pictures.map((pic, idx) => (
            <button
              key={pic.id || idx}
              type="button"
              className={`carousel-thumb-dot ${idx === activeIdx ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx(idx);
              }}
            >
              <img src={pic.data} alt={`Thumbnail ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskTable({ 
  tasks, 
  onUpdateStatus, 
  onDeleteTask, 
  onUpdateTask, 
  onOpenImage 
}) {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editPicDesc, setEditPicDesc] = useState('');
  const [editPictures, setEditPictures] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditDesc(task.description);
    setEditPicDesc(task.pictureDesc || '');
    const pics = (task.pictures && task.pictures.length > 0)
      ? task.pictures
      : (task.pictureData ? [{ id: 'legacy-pic', data: task.pictureData, name: task.pictureName }] : []);
    setEditPictures(pics);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditDesc('');
    setEditPicDesc('');
    setEditPictures([]);
  };

  const saveEditing = (taskId) => {
    onUpdateTask(taskId, {
      description: editDesc,
      pictureDesc: editPicDesc,
      pictures: editPictures,
      pictureData: editPictures.length > 0 ? editPictures[0].data : null,
      pictureName: editPictures.length > 0 ? editPictures[0].name : ''
    });
    setEditingTaskId(null);
    setEditPictures([]);
  };

  const copyToClipboard = (text, taskId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(taskId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Done':
        return {
          label: 'Done',
          className: 'status-badge status-done',
          icon: <CheckCircle2 size={14} />
        };
      case 'In Progress':
        return {
          label: 'In Progress',
          className: 'status-badge status-in-progress',
          icon: <Clock size={14} />
        };
      case 'Not Started':
      default:
        return {
          label: 'Not Started',
          className: 'status-badge status-not-started',
          icon: <AlertCircle size={14} />
        };
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-tasks-container">
        <div className="empty-icon-wrap">
          <ImageIcon size={32} />
        </div>
        <h3>No meeting tasks stored yet</h3>
      </div>
    );
  }

  return (
    <div className="task-table-wrapper">
      <table className="task-table">
        <thead>
          <tr>
            <th className="col-desc">TASK</th>
            <th className="col-pic">IMAGE</th>
            <th className="col-progress">Progress</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => {
            const isEditing = editingTaskId === task.id;
            const statusInfo = getStatusBadge(task.status);
            
            // Normalize pictures list for backwards compatibility
            const taskPictures = (task.pictures && task.pictures.length > 0)
              ? task.pictures
              : (task.pictureData ? [{ id: 'legacy-pic', data: task.pictureData, name: task.pictureName }] : []);

            return (
              <tr key={task.id} className={`task-row status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {/* Column 1: Task Description */}
                <td className="col-desc">
                  {isEditing ? (
                    <div className="edit-cell">
                      <textarea
                        className="edit-textarea"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div className="desc-cell-content">
                      <div className="task-text-body">{task.description}</div>
                    </div>
                  )}
                </td>

                {/* Column 2: Image Carousel & Edit Manager */}
                <td className="col-pic">
                  <TaskImageCell 
                    pictures={taskPictures}
                    pictureDesc={task.pictureDesc}
                    onOpenImage={onOpenImage}
                    isEditing={isEditing}
                    editPictures={editPictures}
                    setEditPictures={setEditPictures}
                    editPicDesc={editPicDesc}
                    setEditPicDesc={setEditPicDesc}
                  />
                </td>

                {/* Column 3: Custom Viewport Portal Status Dropdown */}
                <td className="col-progress">
                  <CustomStatusSelect
                    value={task.status}
                    onChange={(newStatus) => onUpdateStatus(task.id, newStatus)}
                  />
                </td>

                {/* Actions Column */}
                <td className="col-actions">
                  <div className="action-buttons-group">
                    {isEditing ? (
                      <>
                        <button className="action-btn btn-save" onClick={() => saveEditing(task.id)}>
                          <Check size={18} />
                        </button>
                        <button className="action-btn btn-cancel" onClick={cancelEditing}>
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="action-btn btn-copy" 
                          onClick={() => copyToClipboard(task.description, task.id)}
                        >
                          {copiedId === task.id ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                        </button>
                        <button 
                          className="action-btn btn-edit" 
                          onClick={() => startEditing(task)}
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          className="action-btn btn-delete" 
                          onClick={() => onDeleteTask(task.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
