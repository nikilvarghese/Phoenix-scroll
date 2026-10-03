import { ReaderSettings } from '../types';

export interface PageContent {
  id: string;
  pageIndex: number; // 0-based
  displayPageNumber: number; // 1-based
  html: string;
  isPartBannerPage?: boolean;
  isChapterStartPage?: boolean;
  chapterId?: string;
  chapterOrder?: number;
}

export interface ContainerDimensions {
  width: number;
  height: number;
}

export interface ReadingPositionAnchor {
  chapterId?: string;
  chapterOrder?: number;
  progressPercentage: number; // 0 - 100%
  pageIndex: number;
}

export interface PaginationOptions {
  containerWidth: number;
  containerHeight: number;
  settings: ReaderSettings;
  partBannerHtml?: string | null;
  chapterHeaderHtml?: string | null;
  currentChapterId?: string;
  currentChapterOrder?: number;
}
