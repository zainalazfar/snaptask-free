/**
 * Standalone Offline Image Processing for SnapTask Free
 * All processing is done client-side with zero external cloud or server dependencies.
 */

/**
 * Compresses and resizes an image file to modern WebP format directly in the browser.
 * Capped at 1200px width/height, 75% quality.
 * Shrinks file size from ~2-4 MB down to ~20-50 kB.
 */
export async function compressImageToWebP(file, maxDimension = 1200, quality = 0.75) {
  if (!file) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP Data URL for instant local storage
        try {
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(webpDataUrl);
        } catch (canvasErr) {
          console.warn('Canvas toDataURL failed, using fallback:', canvasErr);
          resolve(e.target.result);
        }
      };

      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload task image (in Free version: compresses locally to lightweight WebP data URL)
 */
export async function uploadTaskImage(file, fallbackDataUrl) {
  if (!file) return fallbackDataUrl;

  try {
    const compressedDataUrl = await compressImageToWebP(file);
    return compressedDataUrl || fallbackDataUrl;
  } catch (err) {
    console.warn('Image compression fallback:', err);
    return fallbackDataUrl;
  }
}

/**
 * Delete task images (no-op in pure offline local storage)
 */
export async function deleteTaskImages(pictures) {
  // Offline version stores images in localStorage with the task,
  // so removing the task automatically frees storage.
  return Promise.resolve();
}
