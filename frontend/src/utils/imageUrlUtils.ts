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

  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = url.substring(uploadsIndex);
    const baseHost = getApiBaseHost();
    return baseHost ? `${baseHost}${relativePath}` : relativePath;
  }

  return url;
};
