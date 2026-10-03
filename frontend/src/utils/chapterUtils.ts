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

  if (sorted.length > 0 && sorted[0]._id === ch._id && firstIsPrologue) {
    return 'Prologue';
  }

  const numNumbered = firstIsPrologue ? sorted.length - 1 : sorted.length;
  const badge = getChapterNumberBadge(ch, sorted);
  return `Chapter ${badge} of ${numNumbered}`;
};
