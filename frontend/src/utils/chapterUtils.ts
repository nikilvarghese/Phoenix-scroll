import { Chapter } from '../types';

export const isChapterPrologue = (ch: Chapter, index?: number): boolean => {
  if (index !== undefined && index !== 0) {
    return false; // Only chapter at index 0 can be prologue
  }
  return Boolean(
    ch.isPrologue ||
    ch.order === 0 ||
    ch.title.trim().toUpperCase().startsWith('PROLOGUE')
  );
};

export const isDefaultChapterTitle = (title: string): boolean => {
  const t = title.trim();
  if (!t || t.toLowerCase() === 'untitled chapter' || t.toLowerCase() === 'prologue') {
    return true;
  }
  // Matches "Chapter 1", "Chapter 12", etc.
  return /^Chapter\s+\d+$/i.test(t);
};

export const getChapterNumberBadge = (ch: Chapter, allChapters: Chapter[]): string => {
  const sorted = [...allChapters].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((c) => c._id === ch._id);
  const firstIsPrologue = sorted.length > 0 && isChapterPrologue(sorted[0], 0);

  if (index === 0 && firstIsPrologue) {
    return 'P';
  }

  if (firstIsPrologue && index > 0) {
    return `${index}`;
  }

  return `${index + 1}`;
};

export const getChapterDisplayLabel = (ch: Chapter, allChapters: Chapter[]): string => {
  const badge = getChapterNumberBadge(ch, allChapters);
  return badge === 'P' ? 'Prologue' : `Chapter ${badge}`;
};

export const getChapterHeaderSubtitle = (ch: Chapter, allChapters: Chapter[]): string => {
  const sorted = [...allChapters].sort((a, b) => a.order - b.order);
  const firstIsPrologue = sorted.length > 0 && isChapterPrologue(sorted[0], 0);

  const arcPrefix = ch.arc && ch.arc.trim() ? `${ch.arc.trim()} • ` : '';

  if (sorted.length > 0 && sorted[0]._id === ch._id && firstIsPrologue) {
    return `${arcPrefix}Prologue`;
  }

  const numNumbered = firstIsPrologue ? sorted.length - 1 : sorted.length;
  const badge = getChapterNumberBadge(ch, sorted);
  return `${arcPrefix}Chapter ${badge} of ${numNumbered}`;
};

export const getUniqueArcs = (chapters: Chapter[]): string[] => {
  const arcs: string[] = [];
  const seen = new Set<string>();

  chapters.forEach((ch) => {
    if (ch.arc && ch.arc.trim()) {
      const trimmed = ch.arc.trim();
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        arcs.push(trimmed);
      }
    }
  });

  return arcs;
};

export const getArcChapterRange = (arcName: string, allChapters: Chapter[]): string => {
  const arcChapters = allChapters.filter((c) => c.arc && c.arc.trim() === arcName.trim());
  if (arcChapters.length === 0) return '';

  const labels = arcChapters.map((c) => getChapterNumberBadge(c, allChapters));
  const hasP = labels.includes('P');
  const numericLabels = labels.filter((l) => l !== 'P').map((l) => parseInt(l, 10)).filter((n) => !isNaN(n));

  if (numericLabels.length === 0) {
    return hasP ? 'Prologue' : '';
  }

  const min = Math.min(...numericLabels);
  const max = Math.max(...numericLabels);

  if (hasP) {
    return min === max ? `Prologue + Ch ${min}` : `Prologue + Ch ${min}–${max}`;
  }

  return min === max ? `Ch ${min}` : `Ch ${min}–${max}`;
};

export const getChapterNumber = (ch: Chapter, allChapters: Chapter[]): number | 'P' => {
  const badge = getChapterNumberBadge(ch, allChapters);
  return badge === 'P' ? 'P' : parseInt(badge, 10);
};

export const getArcRangeDetails = (arcName: string, allChapters: Chapter[]) => {
  const sorted = [...allChapters].sort((a, b) => a.order - b.order);
  const arcChapters = sorted.filter((c) => c.arc && c.arc.trim().toLowerCase() === arcName.trim().toLowerCase());
  const hasPrologue = arcChapters.some((c) => isChapterPrologue(c, 0));
  const numericNumbers = arcChapters
    .map((c) => getChapterNumber(c, allChapters))
    .filter((n): n is number => typeof n === 'number' && !isNaN(n));

  const min = numericNumbers.length > 0 ? Math.min(...numericNumbers) : 1;
  const max = numericNumbers.length > 0 ? Math.max(...numericNumbers) : 1;

  return {
    hasPrologue,
    fromChapter: min,
    toChapter: max,
    count: arcChapters.length,
  };
};


