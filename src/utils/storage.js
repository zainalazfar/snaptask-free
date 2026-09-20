const STORAGE_KEY = 'snaptask_free_tasks_v1';

export const INITIAL_TASKS = [
  {
    id: 'task-1726228800000-1',
    description: 'Review Q3 API Specs with Frontend & Backend teams. Verify authentication token expiration logic.',
    pictureData: null,
    pictureName: '',
    pictureDesc: 'Architecture diagram shared during Zoom presentation',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    tags: ['Meeting', 'API']
  },
  {
    id: 'task-1726228800000-2',
    description: 'Fix layout responsiveness on dashboard header and add status filter dropdown for Excel export.',
    pictureData: null,
    pictureName: '',
    pictureDesc: 'Screenshot of UI bug on mobile view',
    status: 'Not Started',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    tags: ['Frontend', 'UI']
  },
  {
    id: 'task-1726228800000-3',
    description: 'Update project timeline in Jira and email action items to product manager.',
    pictureData: null,
    pictureName: '',
    pictureDesc: '',
    status: 'Done',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    tags: ['Admin']
  }
];

export function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load tasks from localStorage', err);
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage', err);
  }
}
