import { useState, useEffect, useRef, useCallback } from 'react';
import { PageContent, ContainerDimensions } from './PaginationTypes';
import { PaginationEngine } from './PaginationEngine';
import { ReaderSettings, Chapter } from '../types';

interface UsePaginationProps {
  cleanContent: string;
  partBannerHtml: string | null;
  chapterHeaderHtml: string | null;
  currentChapter: Chapter;
  settings: ReaderSettings;
  containerRef: React.RefObject<HTMLDivElement>;
  initialProgressPct?: number;
}

export function usePagination({
  cleanContent,
  partBannerHtml,
  chapterHeaderHtml,
  currentChapter,
  settings,
  containerRef,
  initialProgressPct,
}: UsePaginationProps) {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPaginating, setIsPaginating] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<ContainerDimensions>({ width: 0, height: 0 });

  const engineRef = useRef<PaginationEngine>(new PaginationEngine());
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pagesLengthRef = useRef<number>(pages.length);
  pagesLengthRef.current = pages.length;

  const readingRatioRef = useRef<number>(
    initialProgressPct !== undefined && initialProgressPct > 0 ? initialProgressPct / 100 : 0
  );
  const prevChapterIdRef = useRef<string>(currentChapter._id);

  // Preserve reading progress ratio before repagination
  const updateReadingRatio = useCallback((page: number, total: number) => {
    if (total > 1) {
      readingRatioRef.current = (page - 1) / (total - 1);
    } else {
      readingRatioRef.current = 0;
    }
  }, []);

  // Chapter change detection is handled inside runPagination to avoid race conditions
  // with the reading ratio reset.

  // Main Repagination Function
  const runPagination = useCallback(
    (width: number, height: number) => {
      if (!width || !height || width <= 0 || height <= 0) return;

      setIsPaginating(true);

      // If the chapter changed, reset reading ratio immediately before pagination
      const chapterChanged = prevChapterIdRef.current !== currentChapter._id;
      if (chapterChanged) {
        prevChapterIdRef.current = currentChapter._id;
        readingRatioRef.current = initialProgressPct !== undefined && initialProgressPct > 0 ? initialProgressPct / 100 : 0;
      }

      // Perform real browser DOM measurement pagination
      const generatedPages = engineRef.current.paginate(cleanContent, {
        containerWidth: width,
        containerHeight: height,
        settings,
        partBannerHtml,
        chapterHeaderHtml,
        currentChapterId: currentChapter._id,
        currentChapterOrder: currentChapter.order,
      });

      setPages(generatedPages);

      // Restore reading position anchor smoothly after repagination
      const newTotalPages = generatedPages.length;
      if (newTotalPages > 0) {
        const targetPage = chapterChanged
          ? (initialProgressPct !== undefined && initialProgressPct > 0
              ? Math.min(newTotalPages, Math.max(1, Math.round((initialProgressPct / 100) * (newTotalPages - 1)) + 1))
              : 1)
          : Math.min(
              newTotalPages,
              Math.max(1, Math.round(readingRatioRef.current * (newTotalPages - 1)) + 1)
            );
        setCurrentPage(targetPage);
      } else {
        setCurrentPage(1);
      }

      setIsPaginating(false);
    },
    [cleanContent, partBannerHtml, chapterHeaderHtml, currentChapter, settings]
  );

  // ResizeObserver listener to detect actual browser layout dimension changes
  const prevDimsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const DIMENSION_THRESHOLD = 3; // Ignore layout shifts smaller than 3px

    const handleDimensionChange = (width: number, height: number) => {
      const dw = Math.abs(width - prevDimsRef.current.width);
      const dh = Math.abs(height - prevDimsRef.current.height);
      if (dw < DIMENSION_THRESHOLD && dh < DIMENSION_THRESHOLD && prevDimsRef.current.width > 0) {
        return; // Skip — dimensions haven't meaningfully changed
      }
      prevDimsRef.current = { width, height };
      setDimensions({ width, height });
      runPagination(width, height);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          // Debounce resize events by 180ms to prevent thrashing
          if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
          resizeTimerRef.current = setTimeout(() => {
            handleDimensionChange(width, height);
          }, 180);
        }
      }
    });

    observer.observe(el);

    // Initial measurement
    const initialWidth = el.clientWidth;
    const initialHeight = el.clientHeight;
    if (initialWidth > 0 && initialHeight > 0) {
      handleDimensionChange(initialWidth, initialHeight);
    }

    return () => {
      observer.disconnect();
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [containerRef, runPagination]);

  // Re-run pagination when chapter or settings change
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      runPagination(dimensions.width, dimensions.height);
    }
  }, [currentChapter._id, settings.fontSize, settings.font, settings.lineHeight, settings.contentWidth, runPagination, dimensions]);

  // Handle page change navigation with stable reference identity
  const setPage = useCallback(
    (page: number) => {
      const total = pagesLengthRef.current;
      if (total <= 0) return;
      const validPage = Math.min(total, Math.max(1, page));
      setCurrentPage(validPage);
      updateReadingRatio(validPage, total);
    },
    [updateReadingRatio]
  );

  return {
    pages,
    currentPage,
    totalPages: pages.length,
    isPaginating,
    setPage,
  };
}
