/**
 * Standalone Offline Image Processing for SnapTask Free
 * Images are kept in their original format and quality with zero compression.
 */

/**
 * Upload task image (in Free version: returns the original image Data URL directly)
 */
export async function uploadTaskImage(file, fallbackDataUrl) {
  if (fallbackDataUrl) return fallbackDataUrl;
  if (!file) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Delete task images (no-op in pure offline local storage)
 */
export async function deleteTaskImages(pictures) {
  return Promise.resolve();
}
