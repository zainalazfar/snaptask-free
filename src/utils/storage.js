const STORAGE_KEY = 'snaptask_free_tasks_v2';

export const INITIAL_TASKS = [];

export function loadTasks() {
  try {
    // Check v2 first
    const dataV2 = localStorage.getItem(STORAGE_KEY);
    if (dataV2 !== null) {
      return JSON.parse(dataV2);
    }

    // If first time running, clean any legacy sample tasks from v1
    const oldData = localStorage.getItem('snaptask_free_tasks_v1');
    if (oldData) {
      const parsed = JSON.parse(oldData);
      // If the old data only contains the sample tasks, discard them
      const nonSampleTasks = parsed.filter(
        (t) => !t.id?.startsWith('task-1726228800000-')
      );
      saveTasks(nonSampleTasks);
      return nonSampleTasks;
    }

    // Default to clean empty list
    return [];
  } catch (err) {
    console.error('Failed to load tasks from localStorage', err);
    return [];
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks || []));
  } catch (err) {
    console.error('Failed to save tasks to localStorage', err);
  }
}
