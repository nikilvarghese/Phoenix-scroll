import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Story, Chapter } from '../types';
import { storyService, chapterService, progressService } from '../services/api';
import { BookCoverHero } from '../components/reader/BookCoverHero';
import { BookHeader } from '../components/reader/BookHeader';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { ReadingSettingsModal } from '../components/reader/ReadingSettingsModal';
import { TableOfContentsDrawer } from '../components/reader/TableOfContentsDrawer';
import { RichContentRenderer } from '../components/reader/RichContentRenderer';
import { PasscodeModal } from '../components/common/PasscodeModal';
import { AnimatedBookmark } from '../components/reader/AnimatedBookmark';
import { BookReaderLayout } from '../components/reader/BookReaderLayout';
import { useReader } from '../context/ReaderContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, ChevronRight, Lock, BookOpen } from 'lucide-react';
import { getChapterDisplayLabel, getChapterHeaderSubtitle } from '../utils/chapterUtils';

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useReader();
  const { user, loading: authLoading } = useAuth();
  const { showSuccess } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterOrder, setCurrentChapterOrder] = useState<number | null>(null);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresPasscode, setRequiresPasscode] = useState(false);

  // Modals & Drawers
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedChapterOrder, setSavedChapterOrder] = useState<number | undefined>(undefined);
  const [savedScrollPct, setSavedScrollPct] = useState<number | undefined>(undefined);
  const [hasRestoredPosition, setHasRestoredPosition] = useState<boolean>(false);
  const [openAtEndChapterOrder, setOpenAtEndChapterOrder] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    if (id && user) {
      loadBookData(id);
    }
  }, [id, user, authLoading, navigate, location]);

  const loadBookData = async (storyId: string, passcode?: string) => {
    try {
      setLoading(true);
      setError('');
      setRequiresPasscode(false);

      const storedPasscode = passcode || sessionStorage.getItem(`passcode_${storyId}`) || undefined;
      const fetchedStory = await storyService.getStoryById(storyId, storedPasscode);
      const fetchedChapters = await chapterService.getChapters(storyId);

      setStory(fetchedStory);
      setChapters(fetchedChapters);

      // Check saved reading progress from API or local backup
      let progress = await progressService.getProgress(storyId);
      if (!progress) {
        const rawLocal = localStorage.getItem(`progress_${storyId}`);
        if (rawLocal) {
          try {
            progress = JSON.parse(rawLocal);
          } catch {
            // Ignore
          }
        }
      }

      if (progress && progress.chapterOrder !== undefined) {
        setSavedChapterOrder(progress.chapterOrder);
        if (progress.scrollPercentage !== undefined) {
          setSavedScrollPct(progress.scrollPercentage);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        if (err.response?.data?.requiresPasscode) {
          setRequiresPasscode(true);
          setStory({
            _id: storyId,
            title: err.response.data.title || 'Protected Story',
            authorName: err.response.data.authorName || 'Author',
            coverImage: err.response.data.coverImage,
          } as Story);
        } else {
          navigate('/login', { state: { from: `/read/${storyId}` }, replace: true });
        }
      } else {
        setError(err.response?.data?.message || 'Failed to load story.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasscode = async (passcode: string): Promise<boolean> => {
    if (!id) return false;
    try {
      const res = await storyService.verifyPasscode(id, passcode);
      if (res.success) {
        sessionStorage.setItem(`passcode_${id}`, passcode);
        setRequiresPasscode(false);
        loadBookData(id, passcode);
        return true;
      }
    } catch {
      // Passcode failed
    }
    return false;
  };

  // Scroll Progress Listener & Position Memory Saver
  useEffect(() => {
    if (currentChapterOrder === null || !id) return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollPercentage(100);
        return;
      }
      const currentScroll = window.scrollY;
      const pct = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
      setScrollPercentage(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapterOrder, id]);

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const currentIndex = currentChapterOrder !== null ? sortedChapters.findIndex((c) => c.order === currentChapterOrder) : -1;
  const currentChapter = currentIndex !== -1 ? sortedChapters[currentIndex] : null;
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex !== -1 && currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  // Restore saved bookmark scroll position on chapter open
  useEffect(() => {
    if (
      currentChapterOrder !== null &&
      currentChapterOrder === savedChapterOrder &&
      savedScrollPct &&
      savedScrollPct > 0 &&
      !hasRestoredPosition
    ) {
      const timer = setTimeout(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const targetY = (savedScrollPct / 100) * totalHeight;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          setHasRestoredPosition(true);
          showSuccess(`Resumed reading from your saved bookmark at ${savedScrollPct}%`);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [currentChapterOrder, savedChapterOrder, savedScrollPct, hasRestoredPosition, showSuccess]);

  // Debounced Progress Saver
  useEffect(() => {
    if (currentChapterOrder === null || !id || chapters.length === 0 || !currentChapter) return;

    const timer = setTimeout(() => {
      const pct = Math.round(scrollPercentage);
      progressService.saveProgress(id, {
        chapterId: currentChapter._id,
        chapterOrder: currentChapterOrder,
        scrollPercentage: pct,
      });
      localStorage.setItem(`progress_${id}`, JSON.stringify({
        chapterId: currentChapter._id,
        chapterOrder: currentChapterOrder,
        scrollPercentage: pct,
        timestamp: Date.now(),
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentChapterOrder, scrollPercentage, id, chapters, currentChapter]);

  // 10-Minute Interval Background Auto-Save
  useEffect(() => {
    if (currentChapterOrder === null || !id || chapters.length === 0 || !currentChapter) return;

    const interval = setInterval(() => {
      const pct = Math.round(scrollPercentage);
      progressService.saveProgress(id, {
        chapterId: currentChapter._id,
        chapterOrder: currentChapterOrder,
        scrollPercentage: pct,
      });
      localStorage.setItem(`progress_${id}`, JSON.stringify({
        chapterId: currentChapter._id,
        chapterOrder: currentChapterOrder,
        scrollPercentage: pct,
        timestamp: Date.now(),
      }));
      showSuccess(`Auto-saved reading progress (${pct}%)`);
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, [currentChapterOrder, id, chapters, currentChapter, scrollPercentage, showSuccess]);

  // Tab / Window Close Unload Saver
  useEffect(() => {
    if (currentChapterOrder === null || !id || chapters.length === 0 || !currentChapter) return;

    const handleBeforeUnload = () => {
      const pct = Math.round(scrollPercentage);
      localStorage.setItem(`progress_${id}`, JSON.stringify({
        chapterId: currentChapter._id,
        chapterOrder: currentChapterOrder,
        scrollPercentage: pct,
        timestamp: Date.now(),
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentChapterOrder, id, chapters, currentChapter, scrollPercentage]);

  const handleBackToCover = async () => {
    if (id && currentChapter && currentChapterOrder !== null) {
      const pct = Math.round(scrollPercentage);
      try {
        await progressService.saveProgress(id, {
          chapterId: currentChapter._id,
          chapterOrder: currentChapterOrder,
          scrollPercentage: pct,
        });
      } catch {
        // Fallback local save
      }
      localStorage.setItem(`progress_${id}`, JSON.stringify({
        chapterId: currentChapter._id,
        chapterOrder: currentChapterOrder,
        scrollPercentage: pct,
        timestamp: Date.now(),
      }));
      setSavedChapterOrder(currentChapterOrder);
      setSavedScrollPct(pct);
      showSuccess(`Saved progress at ${pct}%. Returning to cover.`);
    }
    setCurrentChapterOrder(null);
    window.scrollTo(0, 0);
  };

  const handleManualSave = async () => {
    if (id && currentChapter && currentChapterOrder !== null) {
      const pct = Math.round(scrollPercentage);
      try {
        await progressService.saveProgress(id, {
          chapterId: currentChapter._id,
          chapterOrder: currentChapterOrder,
          scrollPercentage: pct,
        });
      } catch {
        // Local fallback
      }
      localStorage.setItem(`progress_${id}`, JSON.stringify({
        chapterId: currentChapter._id,
        chapterOrder: currentChapterOrder,
        scrollPercentage: pct,
        timestamp: Date.now(),
      }));
      setSavedChapterOrder(currentChapterOrder);
      setSavedScrollPct(pct);
      showSuccess(`Reading progress saved (${pct}%)`);
    }
  };

  const pageNavRef = React.useRef<{ prevPage: () => void; nextPage: () => void } | null>(null);

  // Keyboard navigation (only for scroll mode, book mode handles its own page keys)
  useEffect(() => {
    if (settings.layoutMode === 'book') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTOCOpen || isSettingsOpen || currentChapterOrder === null) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'ArrowRight' || e.key === 'j') && nextChapter) {
        handleSelectChapter(nextChapter.order);
      } else if ((e.key === 'ArrowLeft' || e.key === 'k') && prevChapter) {
        handleSelectChapterAtEnd(prevChapter.order);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterOrder, nextChapter, prevChapter, isTOCOpen, isSettingsOpen, settings.layoutMode]);

  const handleSelectChapter = (order: number) => {
    setOpenAtEndChapterOrder(null);
    setCurrentChapterOrder(order);
    window.scrollTo(0, 0);
    if (order !== savedChapterOrder) {
      setHasRestoredPosition(true);
    }
  };

  const handleSelectChapterAtEnd = (order: number) => {
    setOpenAtEndChapterOrder(order);
    setCurrentChapterOrder(order);
    window.scrollTo(0, 0);
    setHasRestoredPosition(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-bg flex flex-col items-center justify-center p-4 space-y-4">
        <BookOpen className="w-10 h-10 text-amber-800 animate-pulse" />
        <p className="font-serif italic text-lg text-stone-600">Opening manuscript...</p>
      </div>
    );
  }

  if (requiresPasscode && story) {
    return (
      <div className="min-h-screen bg-paper-bg">
        <PasscodeModal
          storyTitle={story.title}
          coverImage={story.coverImage}
          onVerify={handleVerifyPasscode}
          onCancel={() => navigate('/')}
        />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-paper-bg flex flex-col items-center justify-center p-4 space-y-4 text-center">
        <Lock className="w-12 h-12 text-stone-400" />
        <h2 className="font-playfair text-2xl font-bold text-stone-800">Story Unavailable</h2>
        <p className="text-sm text-stone-500 max-w-sm">{error || 'This story is private or does not exist.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-amber-900 text-white font-semibold text-xs rounded-xl shadow-xs"
        >
          Return to Library
        </button>
      </div>
    );
  }

  // Cover Hero Screen
  if (currentChapterOrder === null) {
    return (
      <BookCoverHero
        story={story}
        chapters={sortedChapters}
        savedChapterOrder={savedChapterOrder}
        onStartReading={handleSelectChapter}
        onBackToLibrary={() => navigate('/')}
      />
    );
  }

  return (
    <div className={`${settings.layoutMode === 'book' ? 'h-screen max-h-screen overflow-hidden pt-14 pb-0 px-1 sm:px-4' : 'min-h-screen pt-20 pb-28 px-4'} reader-theme-${settings.theme} transition-colors duration-300 relative flex flex-col justify-between`}>
      {/* Fixed Top Reader Header */}
      <BookHeader
        story={story}
        currentChapter={currentChapter || undefined}
        scrollPercentage={scrollPercentage}
        onBackToCover={handleBackToCover}
        onManualSave={handleManualSave}
        onToggleTOC={() => setIsTOCOpen(true)}
        onToggleSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Chapter Content Container */}
      {currentChapter ? (
        (() => {
          const html = currentChapter.content || '';
          const match = html.match(/<div class="part-banner[\s\S]*?<\/div>/i);
          const partBannerHtml = match ? match[0] : null;
          const cleanContent = match ? html.replace(match[0], '').trim() : html;

          if (settings.layoutMode === 'book') {
            return (
              <BookReaderLayout
                story={story}
                currentChapter={currentChapter}
                cleanContent={cleanContent}
                partBannerHtml={partBannerHtml}
                sortedChapters={sortedChapters}
                prevChapter={prevChapter}
                nextChapter={nextChapter}
                onSelectChapter={handleSelectChapter}
                onSelectChapterAtEnd={handleSelectChapterAtEnd}
                onBackToCover={handleBackToCover}
                settings={settings}
                initialProgressPct={
                  openAtEndChapterOrder === currentChapter.order
                    ? 100
                    : savedChapterOrder === currentChapter.order
                    ? savedScrollPct
                    : 0
                }
                registerPageNav={(prev, next) => {
                  pageNavRef.current = { prevPage: prev, nextPage: next };
                }}
                onPageChange={(page, total) => {
                  const pct = Math.round((page / total) * 100);
                  setScrollPercentage(pct);
                }}
              />
            );
          }

          return (
            <>
              {/* Animated Floating Left Bookmark (in scroll mode) */}
              <AnimatedBookmark
                scrollPercentage={scrollPercentage}
                onBookmarkClick={() => {
                  if (!id || !currentChapter) return;
                  progressService.saveProgress(id, {
                    chapterId: currentChapter._id,
                    chapterOrder: currentChapter.order,
                    scrollPercentage: Math.round(scrollPercentage),
                  });
                  showSuccess(`Bookmark saved at ${Math.round(scrollPercentage)}%`);
                }}
              />

              <main className="max-w-4xl mx-auto py-8">
                <article className="space-y-8">
                  {/* Part & Arc Banner Positioned ABOVE Chapter Number and Title */}
                  {partBannerHtml && (
                    <div
                      className="prose-reader text-center"
                      dangerouslySetInnerHTML={{ __html: partBannerHtml }}
                    />
                  )}

                  <header className="text-center space-y-3 pb-8 border-b border-stone-300/40">
                    <span className="text-xs uppercase font-bold tracking-widest text-amber-800 font-sans">
                      {getChapterHeaderSubtitle(currentChapter, sortedChapters)}
                    </span>
                    <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-current">
                      {currentChapter.title}
                    </h1>
                  </header>

                  <RichContentRenderer content={cleanContent} isFirstPage={true} />

                  {/* End of Chapter Navigation Pills */}
                  <div className="pt-16 pb-8 border-t border-stone-300/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {prevChapter ? (
                      <button
                        onClick={() => handleSelectChapter(prevChapter.order)}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-current/20 hover:bg-black/5 transition flex items-center justify-center space-x-2 text-sm font-semibold"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{getChapterDisplayLabel(prevChapter, sortedChapters)}</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {nextChapter ? (
                      <button
                        onClick={() => handleSelectChapter(nextChapter.order)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-white shadow-md transition flex items-center justify-center space-x-2 text-sm font-semibold"
                      >
                        <span>Continue to {getChapterDisplayLabel(nextChapter, sortedChapters)}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-center py-4 space-y-2">
                        <p className="font-serif italic text-base text-current/80">
                          You have reached the end of “{story.title}”.
                        </p>
                        <button
                          onClick={() => setCurrentChapterOrder(null)}
                          className="px-4 py-2 bg-amber-900 text-white rounded-lg text-xs font-semibold"
                        >
                          Back to Book Cover
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              </main>
            </>
          );
        })()
      ) : (
        <div className="text-center py-12 text-stone-500 font-serif italic">
          Chapter content unavailable.
        </div>
      )}

      {/* Floating Bottom Toolbar (Only in continuous scroll mode) */}
      {settings.layoutMode === 'scroll' && (
        <ReaderToolbar
          hasPrevChapter={Boolean(prevChapter)}
          hasNextChapter={Boolean(nextChapter)}
          onPrevChapter={() => {
            if (prevChapter) {
              handleSelectChapter(prevChapter.order);
            }
          }}
          onNextChapter={() => {
            if (nextChapter) {
              handleSelectChapter(nextChapter.order);
            }
          }}
          onToggleTOC={() => setIsTOCOpen(true)}
          onToggleSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Table of Contents Drawer */}
      <TableOfContentsDrawer
        isOpen={isTOCOpen}
        story={story}
        chapters={sortedChapters}
        currentChapterId={currentChapter?._id}
        onSelectChapter={handleSelectChapter}
        onClose={() => setIsTOCOpen(false)}
      />

      {/* Reading Customization Settings Modal */}
      <ReadingSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
