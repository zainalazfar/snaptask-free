import { loadTasks, saveTasks } from '../utils/storage.js';

/**
 * Pure local offline task service for SnapTask Free
 */

export async function fetchAllTasks() {
  return loadTasks();
}

export async function insertTask(task) {
  // Saved automatically via App.jsx useEffect(saveTasks)
  return Promise.resolve();
}

export async function updateTaskInDb(taskId, updates) {
  // Handled in state & localStorage
  return Promise.resolve();
}

export async function deleteTaskFromDb(taskId) {
  // Handled in state & localStorage
  return Promise.resolve();
}

export async function clearAllTasksInDb() {
  // Handled in state & localStorage
  return Promise.resolve();
}
