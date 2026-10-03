import React, { useState, useEffect } from 'react';
import { Story, ReadingProgress } from '../types';
import { storyService, progressService } from '../services/api';
import { StoryCard } from '../components/dashboard/StoryCard';
import { LibraryFilter, FilterTab } from '../components/dashboard/LibraryFilter';
import { PasscodeModal } from '../components/common/PasscodeModal';
import { BookOpen, Sparkles, Feather, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [protectedStory, setProtectedStory] = useState<Story | null>(null);

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetchStoriesAndProgress();
  }, [user]);

  const fetchStoriesAndProgress = async () => {
    try {
      setLoading(true);
      setFetchError(false);

      const [storiesResult, progressResult] = await Promise.allSettled([
        storyService.getStories(),
        progressService.getAllProgress(),
      ]);

      const fetchedStories: Story[] = storiesResult.status === 'fulfilled' ? storiesResult.value : [];
      const fetchedProgress: ReadingProgress[] = progressResult.status === 'fulfilled' ? progressResult.value : [];

      if (storiesResult.status === 'rejected' && fetchedStories.length === 0) {
        console.error('Failed to fetch stories:', storiesResult.reason);
        setFetchError(true);
      }

      // Collect all local storage progress
      const localProgressList: ReadingProgress[] = [];
      const knownStoryIds = new Set<string>();

      // Track story IDs from backend progress
      fetchedProgress.forEach((p) => {
        const sId = typeof p.storyId === 'object' ? p.storyId?._id : p.storyId;
        if (sId) knownStoryIds.add(sId.toString());
      });

      // Scan localStorage for progress keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('progress_')) {
          const sId = key.replace('progress_', '');
          if (sId && !knownStoryIds.has(sId)) {
            try {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                localProgressList.push({
                  _id: `local_${sId}`,
                  storyId: sId,
                  chapterId: parsed.chapterId || '',
                  chapterOrder: parsed.chapterOrder || 1,
                  scrollPercentage: parsed.scrollPercentage || 0,
                  isCompleted: !!parsed.isCompleted,
                  lastReadAt: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : new Date().toISOString(),
                } as ReadingProgress);
                knownStoryIds.add(sId);
              }
            } catch {
              // Ignore invalid JSON
            }
          }
        }
      }

      const mergedProgress = [...fetchedProgress, ...localProgressList];

      // Now ensure every story with progress is included in stories array
      const existingStoryIds = new Set(fetchedStories.map((s) => s._id));
      const storiesMap = new Map<string, Story>();
      fetchedStories.forEach((s) => storiesMap.set(s._id, s));

      const missingStoryIds: string[] = [];

      mergedProgress.forEach((p) => {
        if (typeof p.storyId === 'object' && p.storyId?._id) {
          const sObj = p.storyId as Story;
          if (!storiesMap.has(sObj._id)) {
            storiesMap.set(sObj._id, sObj);
          }
        } else if (typeof p.storyId === 'string') {
          if (!existingStoryIds.has(p.storyId) && !storiesMap.has(p.storyId)) {
            missingStoryIds.push(p.storyId);
          }
        }
      });

      // Fetch any missing stories by ID
      if (missingStoryIds.length > 0) {
        const fetchedMissing = await Promise.all(
          missingStoryIds.map(async (id) => {
            try {
              const storedPasscode = sessionStorage.getItem(`passcode_${id}`) || undefined;
              return await storyService.getStoryById(id, storedPasscode);
            } catch {
              return null;
            }
          })
        );
        fetchedMissing.forEach((s) => {
          if (s && !storiesMap.has(s._id)) {
            storiesMap.set(s._id, s);
          }
        });
      }

      setStories(Array.from(storiesMap.values()));
      setProgressList(mergedProgress);
    } catch (err) {
      console.error('Failed to load stories or progress:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasscode = async (passcode: string): Promise<boolean> => {
    if (!protectedStory) return false;
    try {
      const res = await storyService.verifyPasscode(protectedStory._id, passcode);
      if (res.success) {
        sessionStorage.setItem(`passcode_${protectedStory._id}`, passcode);
        setProtectedStory(null);
        navigate(`/read/${protectedStory._id}`);
        return true;
      }
    } catch {
      // Passcode failed
    }
    return false;
  };

  // Map progress items to story IDs
  const progressByStoryId = new Map<string, ReadingProgress>();
  progressList.forEach((p) => {
    const sId = typeof p.storyId === 'object' ? p.storyId?._id : p.storyId;
    if (sId) progressByStoryId.set(sId.toString(), p);
  });

  const continueStoryIds = new Set<string>();
  const completedStoryIds = new Set<string>();

  progressList.forEach((p) => {
    const sId = typeof p.storyId === 'object' ? p.storyId?._id : p.storyId;
    if (sId) {
      const idStr = sId.toString();
      if (p.isCompleted) {
        completedStoryIds.add(idStr);
      } else {
        continueStoryIds.add(idStr);
      }
    }
  });

  // Filter stories based on tab and search query
  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'continue') return continueStoryIds.has(story._id);
    if (activeTab === 'completed') return completedStoryIds.has(story._id);
    if (activeTab === 'published') return story.isPublished;
    if (activeTab === 'drafts') return !story.isPublished;
    if (activeTab === 'private') return story.visibility === 'private' || story.visibility === 'unlisted';

    return true;
  });

  const counts = {
    all: stories.length,
    published: stories.filter((s) => s.isPublished).length,
    drafts: stories.filter((s) => !s.isPublished).length,
    private: stories.filter((s) => s.visibility === 'private' || s.visibility === 'unlisted').length,
    continue: stories.filter((s) => continueStoryIds.has(s._id)).length,
    completed: stories.filter((s) => completedStoryIds.has(s._id)).length,
  };

  return (
    <div className="min-h-screen bg-paper-bg space-y-12 pb-20">
      {/* Hero Header - Solid paper craft aesthetic, no AI purple gradient */}
      <section className="relative pt-14 pb-16 px-6 sm:px-10 bg-paper-card border-b border-paper-border/80 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-5 max-w-2xl text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-900/10 border border-amber-900/20 text-amber-900 text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
              <span>Private Digital Library</span>
            </div>

            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 leading-[1.12]">
              Immersive Stories & <br className="hidden sm:inline" /> Serial Manuscripts
            </h1>

            <p className="font-serif italic text-lg sm:text-xl text-stone-600 leading-relaxed">
              Step into a quiet sanctuary for long-form reading, carefully formatted manuscripts, and digital literature.
            </p>

            <div className="pt-2 flex items-center space-x-4">
              {user ? (
                isOwner && (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-900 hover:bg-amber-950 text-amber-50 rounded-xl font-semibold shadow-md transition transform hover:-translate-y-0.5"
                  >
                    <Feather className="w-4 h-4" />
                    <span>Open Author Studio</span>
                  </Link>
                )
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-900 hover:bg-amber-950 text-amber-50 rounded-xl font-semibold shadow-md transition transform hover:-translate-y-0.5"
                >
                  <Feather className="w-4 h-4" />
                  <span>Sign In to Explore</span>
                </Link>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center p-6 bg-amber-900/5 rounded-2xl border border-amber-900/15 max-w-xs text-stone-700 space-y-3 flex-col">
            <Compass className="w-8 h-8 text-amber-900 mb-1" />
            <p className="font-serif text-xs text-center leading-relaxed italic text-stone-600">
              "A manuscript is not merely text on a screen, but a doorway into another world."
            </p>
          </div>
        </div>
      </section>

      {/* Main Library Showcase */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h2 className="font-playfair text-2xl font-bold text-stone-900 flex items-center space-x-2.5">
              <Compass className="w-5 h-5 text-amber-800" />
              <span>Explore Manuscripts</span>
            </h2>
            <p className="text-xs text-stone-500 font-sans">
              Select a book below to open the reader and continue your journey.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <LibraryFilter
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
          isOwner={isOwner}
          showPublishedTab={false}
          showReadingProgressTabs={true}
        />

        {/* Story Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-stone-200/60 animate-pulse border border-stone-300/40" />
            ))}
          </div>
        ) : fetchError && stories.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-paper-card rounded-2xl border border-paper-border/80 p-8 shadow-xs max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-900/10 text-amber-900 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-playfair text-xl font-bold text-stone-900">Manuscripts Temporarily Unavailable</h3>
              <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                Could not connect to the story service. If the server was sleeping, please click retry below.
              </p>
            </div>
            <button
              onClick={fetchStoriesAndProgress}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <span>Retry Connection</span>
            </button>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="py-20 text-center space-y-5 bg-paper-card rounded-2xl border border-paper-border/80 p-8 shadow-xs max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-900/10 text-amber-900 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-playfair text-xl font-bold text-stone-900">Your Shelf is Quiet</h3>
              <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `No manuscripts matched "${searchQuery}". Try clearing your search query.`
                  : 'No published stories available in the library at this time.'}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition"
              >
                <span>Clear Search Filter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story) => (
              <StoryCard
                key={story._id}
                story={story}
                isOwner={isOwner}
                showStatusBadges={false}
                hasProgress={continueStoryIds.has(story._id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Passcode Unlock Modal */}
      {protectedStory && (
        <PasscodeModal
          storyTitle={protectedStory.title}
          coverImage={protectedStory.coverImage}
          onVerify={handleVerifyPasscode}
          onCancel={() => setProtectedStory(null)}
        />
      )}
    </div>
  );
};
