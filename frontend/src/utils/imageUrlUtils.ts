/**
 * Normalizes image URLs so uploaded cover images load seamlessly across localhost,
 * mobile network IPs, and remote backend production hosts (e.g. Render / Vercel).
 */
export const getApiBaseHost = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL as string;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return '';
};

export const formatImageUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Return data URLs or blob URLs unchanged
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const baseHost = getApiBaseHost();

  // Case 1: Contains "uploads/" anywhere in string (e.g. "uploads/img.png", "/uploads/img.png", "http://localhost:5000/uploads/img.png")
  const uploadsPos = trimmed.indexOf('uploads/');
  if (uploadsPos !== -1) {
    const relativePath = '/' + trimmed.substring(uploadsPos);
    return baseHost ? `${baseHost}${relativePath}` : relativePath;
  }

  // Case 2: Relative path starting with slash (e.g. "/cover.jpg")
  if (trimmed.startsWith('/')) {
    return baseHost ? `${baseHost}${trimmed}` : trimmed;
  }

  // Case 3: Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If localhost or 127.0.0.1 url in production, replace origin with baseHost
    if (baseHost && (trimmed.includes('localhost') || trimmed.includes('127.0.0.1'))) {
      try {
        const parsed = new URL(trimmed);
        return `${baseHost}${parsed.pathname}`;
      } catch {
        // Fall through on invalid URL string
      }
    }
    return trimmed;
  }

  // Fallback: prepend baseHost if relative path without leading slash
  return baseHost ? `${baseHost}/${trimmed}` : `/${trimmed}`;
};

/**
 * Compresses an image file client-side using an HTML5 Canvas into a high-quality,
 * lightweight JPEG Data URL. This guarantees that uploaded book covers are stored directly
 * in MongoDB Atlas and will NEVER disappear when ephemeral server containers (e.g. Render) restart.
 */
export const compressImageFile = (
  file: File,
  maxWidth = 1000,
  maxHeight = 1400,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(img.src);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression.'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
  });
};
