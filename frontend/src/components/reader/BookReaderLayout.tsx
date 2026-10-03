import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story, Chapter, ReaderSettings } from '../../types';
import { ChevronLeft, ChevronRight, BookOpen, Clock, Layers } from 'lucide-react';
import { RichContentRenderer } from './RichContentRenderer';
import { getChapterDisplayLabel, getChapterHeaderSubtitle } from '../../utils/chapterUtils';
import { usePagination } from '../../pagination';

interface BookReaderLayoutProps {
  story: Story;
  currentChapter: Chapter;
  cleanContent: string;
  partBannerHtml: string | null;
  sortedChapters: Chapter[];
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  onSelectChapter: (order: number) => void;
  onSelectChapterAtEnd: (order: number) => void;
  onBackToCover: () => void;
  settings: ReaderSettings;
  initialProgressPct?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  registerPageNav?: (prev: () => void, next: () => void) => void;
}

export const BookReaderLayout: React.FC<BookReaderLayoutProps> = ({
  story,
  currentChapter,
  cleanContent,
  partBannerHtml,
  sortedChapters,
  prevChapter,
  nextChapter,
  onSelectChapter,
  onSelectChapterAtEnd,
  onBackToCover,
  settings,
  initialProgressPct,
  onPageChange,
  registerPageNav,
}) => {
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isOpeningBook, setIsOpeningBook] = useState(true);

  const pageColumnRef = useRef<HTMLDivElement>(null);

  // Touch Swipe Gesture Sensors
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe gesture detection (> 30px distance)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (diffX < 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Trigger opening book animation on mount
  useEffect(() => {
    setIsOpeningBook(true);
    const timer = setTimeout(() => setIsOpeningBook(false), 900);
    return () => clearTimeout(timer);
  }, [currentChapter._id]);

  const chapterHeaderSubtitle = getChapterHeaderSubtitle(currentChapter, sortedChapters);
  const chapterHeaderHtml = chapterHeaderSubtitle
    ? `<header class="text-center space-y-1 pb-3 border-b border-stone-300/40 mb-3 shrink-0">
        <span class="text-[11px] uppercase font-bold tracking-widest text-amber-800 font-sans">
          ${chapterHeaderSubtitle}
        </span>
        <h1 class="font-playfair text-2xl sm:text-3xl font-bold text-stone-900">
          ${currentChapter.title}
        </h1>
      </header>`
    : null;

  // Real Browser DOM Layout-Driven Pagination Engine
  const { pages, currentPage, totalPages, setPage } = usePagination({
    cleanContent,
    partBannerHtml,
    chapterHeaderHtml,
    currentChapter,
    settings,
    containerRef: pageColumnRef,
    initialProgressPct,
  });

  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage, totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  const isDualPage = settings.pageLayout === 'dual' || (settings.pageLayout === 'auto' && window.innerWidth >= 1024);

  const handleNextPage = React.useCallback(() => {
    const step = isDualPage ? 2 : 1;
    if (currentPage + step <= totalPages) {
      setDirection(1);
      setPage(currentPage + step);
    } else if (nextChapter) {
      onSelectChapter(nextChapter.order);
    }
  }, [currentPage, totalPages, isDualPage, nextChapter, onSelectChapter, setPage]);

  const handlePrevPage = React.useCallback(() => {
    const step = isDualPage ? 2 : 1;
    if (currentPage - step >= 1) {
      setDirection(-1);
      setPage(Math.max(1, currentPage - step));
    } else if (prevChapter) {
      onSelectChapterAtEnd(prevChapter.order);
    }
  }, [currentPage, totalPages, isDualPage, prevChapter, onSelectChapterAtEnd, setPage]);

  useEffect(() => {
    if (registerPageNav) {
      registerPageNav(handlePrevPage, handleNextPage);
    }
  }, [registerPageNav, handlePrevPage, handleNextPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage]);

  // Content for left & right page in dual mode
  const leftPageIndex = isDualPage ? (currentPage % 2 === 0 ? currentPage - 1 : currentPage) : currentPage;
  const rightPageIndex = isDualPage ? leftPageIndex + 1 : null;

  const leftPageObj = pages[leftPageIndex - 1];
  const rightPageObj = rightPageIndex && rightPageIndex <= totalPages ? pages[rightPageIndex - 1] : null;

  const leftPageContent = leftPageObj ? leftPageObj.html : '';
  const rightPageContent = rightPageObj ? rightPageObj.html : null;

  const isLastPage = isDualPage ? leftPageIndex >= totalPages || rightPageIndex! >= totalPages : currentPage >= totalPages;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center py-2 px-2 sm:px-6 md:px-8 relative select-none overflow-hidden">
      {/* Immersive 3D Book Container - Fills screen height and width without artificial downscaling */}
      <div className="relative w-full max-w-6xl xl:max-w-7xl h-full max-h-[calc(100vh-4.2rem)] mx-auto perspective-1200 flex flex-col overflow-hidden origin-center">
        {/* Book Opening Animation Overlay */}
        <AnimatePresence>
          {isOpeningBook && (
            <motion.div
              initial={{ rotateY: 0, opacity: 1 }}
              animate={{ rotateY: -110, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
              style={{ transformOrigin: 'left center' }}
              className="absolute inset-0 z-50 bg-amber-950 text-amber-100 rounded-3xl p-8 flex flex-col justify-between border-4 border-amber-900 shadow-2xl pointer-events-none"
            >
              <div className="flex justify-between items-center text-amber-300/60 text-xs font-sans uppercase tracking-widest">
                <span>Opening Manuscript</span>
                <span>{story.genre || 'Book'}</span>
              </div>
              <div className="text-center space-y-4">
                <BookOpen className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
                <h1 className="font-playfair text-3xl sm:text-4xl font-bold">{story.title}</h1>
                <p className="font-serif italic text-amber-200/80">{currentChapter.title}</p>
              </div>
              <div className="text-center text-xs text-amber-400/80 font-mono">
                By {story.authorName}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Open Hardcover Book Spread */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative bg-paper-card rounded-3xl shadow-2xl border border-stone-800/20 overflow-hidden transition-all duration-300 h-full max-h-full flex flex-col justify-between"
        >
          {/* Top Decorative Book Cover Spine Shadow */}
          <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-20" />
          <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-20" />

          {/* Book Spine Center Crease (in Dual Mode) */}
          {isDualPage && (
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-transparent via-stone-900/15 to-transparent pointer-events-none z-20 border-x border-stone-900/5" />
          )}

          {/* Book Page Content Spread */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-300/40 overflow-hidden">
            {/* Left Page (or Single Page) */}
            <div
              ref={pageColumnRef}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickRatio = (e.clientX - rect.left) / rect.width;
                if (isDualPage || clickRatio < 0.5) {
                  handlePrevPage();
                } else {
                  handleNextPage();
                }
              }}
              className="p-4 sm:p-6 flex flex-col justify-between relative group cursor-pointer min-h-0 overflow-hidden"
            >
              {/* Left Page Header */}
              <div className="flex items-center justify-between text-[11px] font-serif uppercase tracking-widest text-stone-600 border-b border-stone-300/30 pb-2 mb-3 shrink-0">
                <span className="font-bold truncate max-w-[200px] text-amber-900">{story.title}</span>
                <span className="font-mono text-stone-600">Page {leftPageIndex} of {totalPages}</span>
              </div>

              {/* Page Body Text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`left-${leftPageIndex}`}
                  initial={{ opacity: 0, x: direction * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 min-h-0 overflow-hidden prose-reader font-serif leading-snug text-stone-900 text-justify flex flex-col justify-start"
                >
                  <RichContentRenderer content={leftPageContent} isFirstPage={leftPageObj?.isChapterStartPage} />
                </motion.div>
              </AnimatePresence>

              {/* Left Page Turn Click Hint */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity p-2 bg-stone-900/10 rounded-full">
                <ChevronLeft className="w-5 h-5 text-stone-700" />
              </div>
            </div>

            {/* Right Page (Dual Page Mode) */}
            {isDualPage && (
              <div
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
                  handleNextPage();
                }}
                className="p-4 sm:p-6 flex flex-col justify-between relative group cursor-pointer bg-stone-50/20 min-h-0 overflow-hidden"
              >
                {/* Right Page Header */}
                <div className="flex items-center justify-between text-[11px] font-serif uppercase tracking-widest text-stone-600 border-b border-stone-300/30 pb-2 mb-3 shrink-0">
                  <span className="font-mono text-stone-600">Page {rightPageIndex} of {totalPages}</span>
                  <span className="font-bold truncate max-w-[200px] text-amber-900">{currentChapter.title}</span>
                </div>

                {/* Right Page Body Text */}
                {rightPageContent ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`right-${rightPageIndex}`}
                      initial={{ opacity: 0, x: direction * 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -direction * 20 }}
                      transition={{ duration: 0.25 }}
                      className="flex-1 min-h-0 overflow-hidden prose-reader font-serif leading-snug text-stone-900 text-justify flex flex-col justify-start"
                    >
                      <RichContentRenderer content={rightPageContent} isFirstPage={rightPageObj?.isChapterStartPage} />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <span className="font-serif italic text-stone-400 text-sm">
                      End of Chapter {currentChapter.order}
                    </span>
                  </div>
                )}

                {/* Right Page Turn Click Hint */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity p-2 bg-stone-900/10 rounded-full">
                  <ChevronRight className="w-5 h-5 text-stone-700" />
                </div>
              </div>
            )}
          </div>

          {/* End of Book / End of Chapter Action Section on Last Page — absolute so it doesn't shrink page column */}
          {isLastPage && (
            <div className="absolute bottom-10 left-0 right-0 z-30 p-4 sm:p-6 bg-paper-card border-t border-amber-900/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevChapter ? (
                <button
                  onClick={handlePrevPage}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 transition flex items-center justify-center space-x-2 text-xs font-semibold text-stone-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Page</span>
                </button>
              ) : (
                <div />
              )}

              {nextChapter ? (
                <button
                  onClick={() => onSelectChapter(nextChapter.order)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-2 text-sm font-bold"
                >
                  <span>Continue to {getChapterDisplayLabel(nextChapter, sortedChapters)}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-center py-1 space-y-1">
                  <p className="font-serif italic text-sm text-stone-700">
                    You have reached the end of “{story.title}”.
                  </p>
                  <button
                    onClick={onBackToCover}
                    className="px-4 py-1.5 bg-amber-900 text-amber-50 rounded-lg text-xs font-bold shadow-md"
                  >
                    Back to Book Overview
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Book Bottom Footer Bar: Page Navigation Controls */}
          <div className="px-6 py-2.5 bg-stone-900/95 text-stone-200 flex items-center justify-between border-t border-stone-800 text-xs font-sans shrink-0">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 && !prevChapter}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{currentPage <= 1 ? (prevChapter ? 'Prev Chapter' : 'Start') : 'Prev Page'}</span>
            </button>

            {/* Page Slider / Readout */}
            <div className="flex items-center space-x-3">
              <span className="font-mono text-amber-300 font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <div className="w-24 sm:w-36 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleNextPage}
              className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-800 text-white font-semibold transition"
            >
              <span>{currentPage >= totalPages ? (nextChapter ? 'Next Chapter' : 'Finish') : 'Next Page'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
