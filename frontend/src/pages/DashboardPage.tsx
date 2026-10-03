import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Story } from '../types';
import { storyService } from '../services/api';
import { StoryCard } from '../components/dashboard/StoryCard';
import { LibraryFilter, FilterTab } from '../components/dashboard/LibraryFilter';
import { DeleteConfirmModal } from '../components/dashboard/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PlusCircle, BookOpen, Clock, FileText, Sparkles, Layout } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isOwner, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isOwner) {
      navigate('/login');
      return;
    }
    fetchStories();
  }, [isOwner, authLoading]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const data = await storyService.getStories();
      setStories(data);
    } catch (err) {
      console.error('Failed to load author library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (story: Story) => {
    try {
      const updated = await storyService.togglePublish(story._id);
      setStories((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      showSuccess(`Story ${updated.isPublished ? 'published' : 'unpublished'} successfully.`);
    } catch (err) {
      showError('Failed to update publication state.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!storyToDelete) return;
    try {
      setDeleting(true);
      await storyService.deleteStory(storyToDelete._id);
      setStories((prev) => prev.filter((s) => s._id !== storyToDelete._id));
      setStoryToDelete(null);
      showSuccess('Story deleted successfully.');
    } catch (err) {
      showError('Failed to delete story.');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalPublished = stories.filter((s) => s.isPublished).length;
  const totalDrafts = stories.filter((s) => !s.isPublished).length;
  const totalReadingTime = stories.reduce((acc, s) => acc + (s.readingTimeMinutes || 0), 0);

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'published') return story.isPublished;
    if (activeTab === 'drafts') return !story.isPublished;
    if (activeTab === 'private') return story.visibility === 'private' || story.visibility === 'unlisted';

    return true;
  });

  const counts = {
    all: stories.length,
    published: totalPublished,
    drafts: totalDrafts,
    private: stories.filter((s) => s.visibility === 'private' || s.visibility === 'unlisted').length,
  };

  return (
    <div className="min-h-screen bg-paper-bg py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Author Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-paper-border/80">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-900 bg-amber-100/70 px-3 py-1 rounded-full">
            Author Studio
          </span>
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-stone-900 mt-2">
            Welcome, {user?.name || 'Author'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-sans">
            Manage your digital library, draft new chapters, and publish manuscripts.
          </p>
        </div>

        <Link
          to="/editor/new"
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-amber-900 hover:bg-amber-950 text-white rounded-xl font-semibold shadow-md transition"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Create New Story</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-paper-card p-4 rounded-2xl border border-paper-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Library</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-stone-900">{stories.length}</span>
            <BookOpen className="w-5 h-5 text-amber-800" />
          </div>
        </div>

        <div className="bg-paper-card p-4 rounded-2xl border border-paper-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Published</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-700">{totalPublished}</span>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-paper-card p-4 rounded-2xl border border-paper-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Drafts</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-amber-800">{totalDrafts}</span>
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-paper-card p-4 rounded-2xl border border-paper-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Est. Reading Time</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-stone-900">{totalReadingTime}m</span>
            <Clock className="w-5 h-5 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Library Filter and Story List */}
      <div className="space-y-6">
        <LibraryFilter
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
          isOwner={true}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-stone-200/60 animate-pulse" />
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-paper-card rounded-2xl border border-paper-border/80 p-8">
            <Layout className="w-12 h-12 text-stone-400 mx-auto" />
            <h3 className="font-playfair text-xl font-bold text-stone-800">No Stories Found</h3>
            <p className="text-sm text-stone-500 max-w-xs mx-auto">
              Get started by creating your first story or manuscript.
            </p>
            <Link
              to="/editor/new"
              className="inline-block px-5 py-2.5 bg-amber-900 text-white font-semibold text-xs rounded-lg shadow-xs"
            >
              Start Writing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story) => (
              <StoryCard
                key={story._id}
                story={story}
                isOwner={true}
                onDelete={setStoryToDelete}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {storyToDelete && (
        <DeleteConfirmModal
          title={`Delete "${storyToDelete.title}"?`}
          message="Are you sure you want to delete this story? All associated chapters and content will be permanently deleted. This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setStoryToDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};
