/**
 * Normalizes image URLs so uploaded cover images load seamlessly across localhost,
 * mobile network IPs (e.g. 192.168.x.x), and remote ngrok tunnels.
 */
export const formatImageUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  // If already relative /uploads/ path
  if (url.startsWith('/uploads/')) return url;

  // If url contains localhost or IP before /uploads/, strip the domain to make it relative
  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return url.substring(uploadsIndex);
  }

  return url;
};
