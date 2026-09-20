import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Moon, 
  Sun, 
  ListTodo, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';
import ChatInput from './components/ChatInput.jsx';
import TaskTable from './components/TaskTable.jsx';
import ImageLightbox from './components/ImageLightbox.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import LogoIcon from './components/LogoIcon.jsx';
import { loadTasks, saveTasks } from './utils/storage.js';
import { exportTasksToExcel } from './utils/excelExport.js';

function GradientPlusIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="plusIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path 
        d="M12 5V19M5 12H19" 
        stroke="url(#plusIconGradient)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'list'
  const [filter, setFilter] = useState('all'); // 'all', 'Not Started', 'In Progress', 'Done'
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: null
  });

  // Sync tasks to local storage
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Apply dark/light theme
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add new task handler (unlimited offline tasks)
  const handleAddTask = (newTaskData) => {
    const newTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: newTaskData.description || '(Pasted Screenshot Note)',
      pictures: newTaskData.pictures || [],
      pictureData: newTaskData.pictureData,
      pictureName: newTaskData.pictureName,
      pictureDesc: newTaskData.pictureDesc,
      status: newTaskData.status || 'Not Started',
      createdAt: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);
    showToast('Task added successfully!');
  };

  // Update task status dropdown
  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // Update task editable fields
  const handleUpdateTask = (taskId, updatedFields) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updatedFields } : t))
    );
  };

  // Delete task modal trigger
  const handleDeleteTask = (taskId) => {
    setConfirmModalConfig({
      isOpen: true,
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmText: 'Delete Task',
      onConfirm: () => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('Task deleted successfully!');
      }
    });
  };

  // Reset / Clear tasks modal trigger
  const handleClearAll = () => {
    setConfirmModalConfig({
      isOpen: true,
      message: 'Are you sure you want to wipe the entire task list? (Make sure to export to Excel first if you need a backup).',
      confirmText: 'Reset All',
      onConfirm: () => {
        setTasks([]);
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('All tasks cleared!');
      }
    });
  };

  // Direct Export to Excel with Aesthetic Default Layout
  const handleExportExcel = async () => {
    if (filteredTasks.length === 0) {
      showToast('No tasks to export! Add a task first.');
      return;
    }
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    showToast('Exporting Excel spreadsheet with screenshots...');
    try {
      await exportTasksToExcel(filteredTasks, `Meeting_Tasks_${timestamp}.xlsx`);
      showToast('Excel file exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed. Please check console.');
    }
  };

  // Filter tasks based on search and tab filter
  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.pictureDesc && t.pictureDesc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const notStartedCount = tasks.filter((t) => t.status === 'Not Started').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <LogoIcon className="logo-icon" size={56} />
            <div className="logo-text">
              <h1>SnapTask</h1>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {activeTab === 'list' && (
            <button 
              className="btn-export-excel" 
              onClick={handleExportExcel}
              title="Export all tasks to formatted Excel spreadsheet"
            >
              <FileSpreadsheet size={18} />
              <span>Export to Excel</span>
            </button>
          )}

          <button 
            className="theme-toggle-btn" 
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Icon-Only Equal Width Slidable Top Pill Menu */}
      <div className="pill-menu-container">
        <div className="pill-menu-track">
          <div 
            className="pill-slider-highlight"
            style={{
              transform: activeTab === 'add' ? 'translateX(0px)' : 'translateX(64px)'
            }}
          />
          <button
            className={`pill-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
            title="Add Task"
          >
            <PlusCircle size={19} />
          </button>

          <button
            className={`pill-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
            title="Task List"
          >
            <ListTodo size={19} />
          </button>

          {tasks.length > 0 && (
            <span className="pill-floating-badge">
              {tasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="app-main">
        {activeTab === 'add' ? (
          /* TAB 1: ADD View - Vertically & Horizontally Centered on Screen */
          <div className="tab-pane tab-pane-centered fade-in">
            <div className="capture-hero-card">
              <h2 className="chatbox-hero-title">What are we getting done today?</h2>
              <ChatInput onAddTask={handleAddTask} />
            </div>
          </div>
        ) : (
          /* TAB 2: Task List View */
          <div className="tab-pane fade-in">
            {/* Top Control Bar: Status Filter Tabs on Left, Search & Actions on Right */}
            <div className="control-bar">
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({tasks.length})
                </button>
                <button
                  className={`filter-tab ${filter === 'Not Started' ? 'active' : ''}`}
                  onClick={() => setFilter('Not Started')}
                >
                  <span className="dot dot-not-started"></span>
                  Not Started ({notStartedCount})
                </button>
                <button
                  className={`filter-tab ${filter === 'In Progress' ? 'active' : ''}`}
                  onClick={() => setFilter('In Progress')}
                >
                  <span className="dot dot-in-progress"></span>
                  In Progress ({inProgressCount})
                </button>
                <button
                  className={`filter-tab ${filter === 'Done' ? 'active' : ''}`}
                  onClick={() => setFilter('Done')}
                >
                  <span className="dot dot-done"></span>
                  Done ({doneCount})
                </button>
              </div>

              <div className="action-buttons-row">
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search task"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button 
                  className="add-new-btn" 
                  onClick={() => setActiveTab('add')}
                  title="Add New Task"
                >
                  <GradientPlusIcon size={22} />
                </button>

                {tasks.length > 0 && (
                  <button 
                    className="clear-all-btn" 
                    onClick={handleClearAll}
                    title="Clear All Tasks"
                  >
                    <Trash2 size={22} />
                  </button>
                )}
              </div>
            </div>

            {/* Task Table */}
            <section className="table-section">
              <TaskTable
                tasks={filteredTasks}
                onUpdateStatus={handleUpdateStatus}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                onOpenImage={(img) => setSelectedImage(img)}
              />
            </section>
          </div>
        )}
      </main>

      {/* Full-Screen Screenshot Lightbox Modal */}
      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
