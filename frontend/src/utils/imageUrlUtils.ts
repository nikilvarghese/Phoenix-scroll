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
