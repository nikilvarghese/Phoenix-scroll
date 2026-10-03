import sanitizeHtml from 'sanitize-html';

export const sanitizeChapterContent = (dirtyHtml: string): string => {
  if (!dirtyHtml) return '';
  const sanitized = sanitizeHtml(dirtyHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'blockquote', 'pre', 'code',
      'b', 'i', 'strong', 'em', 'strike', 'u', 'sub', 'sup',
      'ul', 'ol', 'li', 'hr', 'br',
      'img', 'a', 'div', 'figure', 'figcaption'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      'div': ['class', 'style'],
      'p': ['class', 'style'],
      'span': ['class', 'style'],
      'h2': ['class', 'id'],
      'h3': ['class', 'id'],
      'blockquote': ['class']
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'font-style': [/^italic$/, /^normal$/],
        'font-weight': [/^\d+$/, /^bold$/, /^normal$/]
      }
    }
  });

  return formatPartHeaders(sanitized);
};

export const formatPartHeaders = (htmlContent: string): string => {
  if (!htmlContent) return '';
  let content = htmlContent;

  // 1. Matches pattern like <p>PART I</p><p>The Lie Called Despair</p><p>ARC 1 — The Broken Boy</p>
  const regexHtml = /<p>\s*(PART\s+[I|V|X|\d]+.*?)\s*<\/p>\s*<p>\s*(.*?)\s*<\/p>\s*<p>\s*(ARC\s+\d+.*?)\s*<\/p>/gi;
  content = content.replace(regexHtml, (_match, p1, p2, p3) => {
    return `<div class="part-banner no-dropcap my-8 py-6 border-y border-amber-900/20 text-center">
  <span class="part-label text-xs uppercase font-bold tracking-widest text-amber-900 block font-sans">${p1}</span>
  <h2 class="part-title font-playfair text-2xl font-bold text-stone-900 my-1">${p2}</h2>
  <span class="arc-label text-sm font-serif italic text-amber-950 block">${p3}</span>
</div>`;
  });

  return content;
};

export const calculateWordCount = (textOrHtml: string): number => {
  if (!textOrHtml) return 0;
  const cleanText = textOrHtml.replace(/<[^>]*>/g, ' ');
  const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
};

export const calculateReadingTime = (wordCount: number): number => {
  // Average reading speed: ~200 words per minute
  return Math.max(1, Math.ceil(wordCount / 200));
};
