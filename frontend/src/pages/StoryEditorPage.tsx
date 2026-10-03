import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Story, Chapter } from '../types';
import { storyService, chapterService } from '../services/api';
import { StorySettingsForm } from '../components/editor/StorySettingsForm';
import { ChapterListManager } from '../components/editor/ChapterListManager';
import { RichChapterEditor } from '../components/editor/RichChapterEditor';
import { PublishModal } from '../components/editor/PublishModal';
import { DeleteConfirmModal } from '../components/dashboard/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Settings, BookOpen, Eye, CheckCircle2 } from 'lucide-react';
import { isChapterPrologue, isDefaultChapterTitle, getChapterNumberBadge } from '../utils/chapterUtils';

export const StoryEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOwner, loading: authLoading } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const [story, setStory] = useState<Partial<Story>>({
    title: '',
    subtitle: '',
    description: '',
    authorName: '',
    visibility: 'private',
    accessPasscode: '',
    genre: 'Fiction',
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeTab, setActiveTab] = useState<'metadata' | 'writing'>('metadata');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importingDocument, setImportingDocument] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState(false);
  const [publishedModalStory, setPublishedModalStory] = useState<Story | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isOwner) {
      navigate('/login');
      return;
    }

    if (id && id !== 'new') {
      fetchStoryData(id);
    } else {
      setLoading(false);
    }
  }, [id, isOwner, authLoading]);

  const fetchStoryData = async (storyId: string) => {
    try {
      setLoading(true);
      const fetchedStory = await storyService.getStoryById(storyId);
      const fetchedChapters = await chapterService.getChapters(storyId);

      setStory(fetchedStory);
      setChapters(fetchedChapters);

      if (fetchedChapters.length > 0) {
        setActiveChapter(fetchedChapters[0]);
      }
    } catch (err) {
      console.error('Error loading story for editing:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Story Metadata
  const handleSaveMetadata = async () => {
    try {
      setSaving(true);
      if (id === 'new' || !story._id) {
        const created = await storyService.createStory(story);
        setStory(created);
        showSuccess('Story created successfully!');
        navigate(`/editor/${created._id}`, { replace: true });
      } else {
        const updated = await storyService.updateStory(story._id, story);
        setStory(updated);
        showSuccess('Story settings saved.');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to save story settings.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Publication
  const handleTogglePublish = async () => {
    if (!story._id) return;
    try {
      setSaving(true);
      const updated = await storyService.togglePublish(story._id);
      setStory(updated);
      if (updated.isPublished) {
        setPublishedModalStory(updated as Story);
      } else {
        showSuccess('Story unpublished.');
      }
    } catch (err) {
      showError('Failed to update publication status.');
    } finally {
      setSaving(false);
    }
  };

  // Add Chapter
  const handleAddChapter = async () => {
    if (!story._id) {
      showWarning('Please save the story title and settings first before adding chapters.');
      return;
    }

    try {
      const nextOrder = chapters.length + 1;
      const created = await chapterService.createChapter(story._id, {
        title: `Chapter ${nextOrder}`,
        content: '<p>Write your chapter text here...</p>',
      });

      setChapters((prev) => [...prev, created]);
      setActiveChapter(created);
      setActiveTab('writing');
      showSuccess('New chapter added.');
    } catch (err) {
      showError('Failed to add chapter.');
    }
  };

  // Document File Import (.pdf, .docx, .txt)
  const handleImportDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !story._id) return;

    try {
      setImportingDocument(true);
      const res = await chapterService.importDocument(story._id, file);
      setChapters(res.chapters);
      if (res.chapters.length > 0) {
        setActiveChapter(res.chapters[0]);
      }
      showSuccess(res.message);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to import document.');
    } finally {
      setImportingDocument(false);
      e.target.value = '';
    }
  };

  // Save Chapter Content
  const handleSaveChapter = async (updatedFields: Partial<Chapter>) => {
    if (!activeChapter) return;
    try {
      setSaving(true);
      const updated = await chapterService.updateChapter(activeChapter._id, updatedFields);
      setActiveChapter(updated);
      setChapters((prev) => prev.map((ch) => (ch._id === updated._id ? updated : ch)));
      showSuccess('Chapter saved.');
    } catch (err) {
      showError('Failed to save chapter.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to re-calc titles on array reordering
  const applySmartTitles = (chapterList: Chapter[]): Chapter[] => {
    const hasPrologue = chapterList.length > 0 && isChapterPrologue(chapterList[0], 0);

    return chapterList.map((ch, index) => {
      let newTitle = ch.title;
      let newIsPrologue = index === 0 ? isChapterPrologue(ch, 0) : false;

      // Smart title renaming: only change title if it is default
      if (isDefaultChapterTitle(ch.title)) {
        if (index === 0 && hasPrologue) {
          newTitle = 'Prologue';
        } else {
          const numBadge = getChapterNumberBadge(ch, chapterList);
          newTitle = `Chapter ${numBadge}`;
        }
      }

      return {
        ...ch,
        title: newTitle,
        order: index + 1,
        isPrologue: newIsPrologue,
      };
    });
  };

  // Save reordered array to server
  const saveReorderedChapters = async (newList: Chapter[]) => {
    if (!story._id) return;
    const processed = applySmartTitles(newList);
    setChapters(processed);

    const chapterOrders = processed.map((ch, idx) => ({
      chapterId: ch._id,
      order: idx + 1,
      title: ch.title,
      isPrologue: ch.isPrologue,
    }));

    try {
      const updated = await chapterService.reorderChapters(story._id, chapterOrders);
      setChapters(updated);
      if (activeChapter) {
        const found = updated.find((c) => c._id === activeChapter._id);
        if (found) setActiveChapter(found);
      }
    } catch (err) {
      console.error('Failed to save reorder:', err);
    }
  };

  // Toggle Prologue Status (Only for index 0)
  const handleTogglePrologue = async (chapter: Chapter) => {
    const index = chapters.findIndex((c) => c._id === chapter._id);
    if (index !== 0) return; // Restrict prologue to Chapter 1 ONLY

    const updatedChapters = [...chapters];
    const target = updatedChapters[0];
    const newPrologueState = !isChapterPrologue(target, 0);

    target.isPrologue = newPrologueState;
    if (isDefaultChapterTitle(target.title)) {
      target.title = newPrologueState ? 'Prologue' : 'Chapter 1';
    }

    await saveReorderedChapters(updatedChapters);
  };

  // Reorder Up / Down
  const handleReorder = async (chapterId: string, direction: 'up' | 'down') => {
    const index = chapters.findIndex((c) => c._id === chapterId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const newChapters = [...chapters];
    const temp = newChapters[index];
    newChapters[index] = newChapters[targetIndex];
    newChapters[targetIndex] = temp;

    await saveReorderedChapters(newChapters);
  };

  // Drag & Drop Reorder
  const handleDragReorder = async (draggedId: string, targetId: string) => {
    const draggedIdx = chapters.findIndex((c) => c._id === draggedId);
    const targetIdx = chapters.findIndex((c) => c._id === targetId);

    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;

    const newChapters = [...chapters];
    const [movedItem] = newChapters.splice(draggedIdx, 1);
    newChapters.splice(targetIdx, 0, movedItem);

    await saveReorderedChapters(newChapters);
  };

  // Delete Chapter
  const handleDeleteChapterConfirm = async () => {
    if (!chapterToDelete) return;
    try {
      setDeletingChapter(true);
      await chapterService.deleteChapter(chapterToDelete._id);
      const updatedList = chapters.filter((c) => c._id !== chapterToDelete._id);
      const processed = applySmartTitles(updatedList);
      setChapters(processed);

      if (activeChapter?._id === chapterToDelete._id) {
        setActiveChapter(processed[0] || null);
      }
      setChapterToDelete(null);
      showSuccess('Chapter deleted successfully.');
    } catch (err) {
      showError('Failed to delete chapter.');
    } finally {
      setDeletingChapter(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-bg flex items-center justify-center p-4">
        <div className="animate-pulse text-stone-500 font-serif italic text-lg">
          Loading manuscript studio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-bg py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Studio Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border/80">
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              {id === 'new' ? 'New Story Workspace' : 'Editing Story'}
            </span>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">
              {story.title || 'Untitled Story'}
            </h1>
          </div>
        </div>

        {/* Tab Switcher & Publish Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-stone-200/70 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('metadata')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'metadata'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Book Settings</span>
            </button>

            <button
              onClick={() => {
                if (!story._id) {
                  showWarning('Save story settings first!');
                  return;
                }
                setActiveTab('writing');
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'writing'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Write & Chapters ({chapters.length})</span>
            </button>
          </div>

          {story._id && (
            <>
              <Link
                to={`/read/${story._id}`}
                className="p-2.5 text-stone-700 hover:bg-stone-100 rounded-lg transition"
                title="Preview Story as Reader"
              >
                <Eye className="w-4 h-4" />
              </Link>

              <button
                onClick={handleTogglePublish}
                disabled={saving}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                  story.isPublished
                    ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                    : 'bg-amber-900 hover:bg-amber-950 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{story.isPublished ? 'Published' : 'Publish Story'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Tabs */}
      {activeTab === 'metadata' ? (
        <StorySettingsForm
          story={story}
          onChange={(updated) => setStory((prev) => ({ ...prev, ...updated }))}
          onSave={handleSaveMetadata}
          saving={saving}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Chapter List & Reordering */}
          <div className="lg:col-span-4">
            <ChapterListManager
              chapters={chapters}
              activeChapterId={activeChapter?._id}
              onSelectChapter={setActiveChapter}
              onAddChapter={handleAddChapter}
              onReorder={handleReorder}
              onDragReorder={handleDragReorder}
              onDeleteChapter={setChapterToDelete}
              onTogglePrologue={handleTogglePrologue}
              onImportDocument={handleImportDocument}
              importingDocument={importingDocument}
            />
          </div>

          {/* Right Column: Writing Editor Workspace */}
          <div className="lg:col-span-8">
            {activeChapter ? (
              <RichChapterEditor
                chapter={activeChapter}
                onSaveChapter={handleSaveChapter}
                saving={saving}
              />
            ) : (
              <div className="bg-paper-card p-12 rounded-2xl border border-paper-border/80 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
                <h3 className="font-playfair text-lg font-bold text-stone-800">No Chapter Selected</h3>
                <p className="text-xs text-stone-500">Select a chapter from the left outline or add a new chapter to begin writing.</p>
                <button
                  onClick={handleAddChapter}
                  className="px-4 py-2 bg-amber-900 text-white font-semibold text-xs rounded-lg shadow-xs"
                >
                  Create Chapter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Chapter Modal */}
      {chapterToDelete && (
        <DeleteConfirmModal
          title={`Delete "${chapterToDelete.title}"?`}
          message="Are you sure you want to delete this chapter? Its content will be permanently removed."
          onConfirm={handleDeleteChapterConfirm}
          onCancel={() => setChapterToDelete(null)}
          loading={deletingChapter}
        />
      )}

      {/* Celebration Publish Modal */}
      {publishedModalStory && (
        <PublishModal
          story={publishedModalStory}
          onClose={() => setPublishedModalStory(null)}
        />
      )}
    </div>
  );
};
