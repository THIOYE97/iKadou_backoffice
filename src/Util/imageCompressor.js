/**
 * Client-side image compression before upload.
 * Reduces file size significantly before it even hits the server.
 * The server will compress again to WebP — double compression for best results.
 *
 * @param {File} file         - Original File object from input
 * @param {number} maxWidth   - Max width in px (default 1600)
 * @param {number} quality    - JPEG quality 0–1 (default 0.82)
 * @returns {Promise<File>}   - Compressed File object
 */
export const compressImageClient = (file, maxWidth = 1600, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions preserving aspect ratio
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression échouée'));
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Impossible de lire l'image: ${file.name}`));
    };

    img.src = url;
  });
};

/**
 * Generate a local preview URL for a File object.
 */
export const getPreviewUrl = (file) => URL.createObjectURL(file);

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
