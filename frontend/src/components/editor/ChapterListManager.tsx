import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Chapter } from '../../types';
import {
  Plus,
  MoveUp,
  MoveDown,
  Trash2,
  Edit3,
  BookOpen,
  Clock,
  CheckSquare,
  Square,
  GripVertical,
  FileUp,
  Layers,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  getChapterNumberBadge,
  isChapterPrologue,
  getChapterDisplayLabel,
  getUniqueArcs,
  getArcChapterRange,
  getArcRangeDetails,
  getChapterNumber,
} from '../../utils/chapterUtils';

interface ChapterListManagerProps {
  chapters: Chapter[];
  activeChapterId?: string;
  onSelectChapter: (chapter: Chapter) => void;
  onAddChapter: () => void;
  onReorder: (chapterId: string, direction: 'up' | 'down') => void;
  onDragReorder?: (draggedId: string, targetId: string) => void;
  onDeleteChapter: (chapter: Chapter) => void;
  onTogglePrologue?: (chapter: Chapter) => void;
  onImportDocument?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importingDocument?: boolean;
  onSaveArc?: (arcData: {
    name: string;
    fromChapter: number;
    toChapter: number;
    includePrologue?: boolean;
    originalName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onDeleteArc?: (arcName: string) => void;
}

export const ChapterListManager: React.FC<ChapterListManagerProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onReorder,
  onDragReorder,
  onDeleteChapter,
  onTogglePrologue,
  onImportDocument,
  importingDocument = false,
  onSaveArc,
  onDeleteArc,
}) => {
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null);
  const [selectedArcFilter, setSelectedArcFilter] = useState<string>('all');

  // Arc Range Modal State (Add or Edit)
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [editingArcOriginalName, setEditingArcOriginalName] = useState<string | null>(null);
  const [arcModalName, setArcModalName] = useState('');
  const [arcModalFrom, setArcModalFrom] = useState<number>(1);
  const [arcModalTo, setArcModalTo] = useState<number>(1);
  const [arcModalIncludePrologue, setArcModalIncludePrologue] = useState(false);
  const [arcModalError, setArcModalError] = useState<string | null>(null);
  const [arcModalSubmitting, setArcModalSubmitting] = useState(false);

  // Delete Arc Confirmation State
  const [arcToDelete, setArcToDelete] = useState<string | null>(null);

  const uniqueArcs = getUniqueArcs(chapters);
  const hasPrologue = chapters.length > 0 && isChapterPrologue(chapters[0], 0);
  const totalNumberedChapters = hasPrologue ? Math.max(0, chapters.length - 1) : chapters.length;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedChapterId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedChapterId !== id) {
      setDragOverChapterId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverChapterId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverChapterId(null);
    const draggedId = e.dataTransfer.getData('text/plain') || draggedChapterId;
    if (draggedId && draggedId !== targetId && onDragReorder) {
      onDragReorder(draggedId, targetId);
    }
    setDraggedChapterId(null);
  };

  // Open modal to add a brand new Arc
  const openAddArcModal = () => {
    const nextArcNum = uniqueArcs.length + 1;
    setEditingArcOriginalName(null);
    setArcModalName(`Arc ${nextArcNum}`);

    // Find the first unassigned chapter number
    let suggestedFrom = 1;
    const sorted = [...chapters].sort((a, b) => a.order - b.order);
    for (const ch of sorted) {
      const num = getChapterNumber(ch, sorted);
      if (typeof num === 'number' && (!ch.arc || !ch.arc.trim())) {
        suggestedFrom = num;
        break;
      }
    }

    setArcModalFrom(suggestedFrom);
    setArcModalTo(Math.max(suggestedFrom, totalNumberedChapters || 1));
    setArcModalIncludePrologue(hasPrologue && suggestedFrom === 1 && (!sorted[0]?.arc || !sorted[0].arc.trim()));
    setArcModalError(null);
    setIsArcModalOpen(true);
  };

  // Open modal to edit an existing Arc
  const openEditArcModal = (arcName: string) => {
    const details = getArcRangeDetails(arcName, chapters);
    setEditingArcOriginalName(arcName);
    setArcModalName(arcName);
    setArcModalFrom(details.fromChapter);
    setArcModalTo(details.toChapter);
    setArcModalIncludePrologue(details.hasPrologue);
    setArcModalError(null);
    setIsArcModalOpen(true);
  };

  // Submit the Arc Modal
  const handleSaveArcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveArc) return;

    const trimmedName = arcModalName.trim();
    if (!trimmedName) {
      setArcModalError('Please enter an Arc title (e.g. Arc 1 or Arc 2: The Rising Embers).');
      return;
    }

    const fromNum = Math.min(arcModalFrom, arcModalTo);
    const toNum = Math.max(arcModalFrom, arcModalTo);

    try {
      setArcModalSubmitting(true);
      setArcModalError(null);

      const res = await onSaveArc({
        name: trimmedName,
        fromChapter: fromNum,
        toChapter: toNum,
        includePrologue: arcModalIncludePrologue,
        originalName: editingArcOriginalName || undefined,
      });

      if (!res.success) {
        setArcModalError(res.error || 'Failed to save Arc.');
      } else {
        setIsArcModalOpen(false);
        setEditingArcOriginalName(null);
        setSelectedArcFilter('all');
      }
    } catch (err: any) {
      setArcModalError(err.message || 'An unexpected error occurred while saving the Arc.');
    } finally {
      setArcModalSubmitting(false);
    }
  };

  const displayedChapters = selectedArcFilter === 'all'
    ? chapters
    : chapters.filter((c) => c.arc && c.arc.trim().toLowerCase() === selectedArcFilter.trim().toLowerCase());

  return (
    <div className="bg-paper-card p-6 rounded-2xl border border-paper-border/80 shadow-book space-y-4 max-h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-stone-200 shrink-0">
        <div>
          <h3 className="font-playfair text-xl font-bold text-stone-900">Chapters & Outline</h3>
          <p className="text-xs text-stone-500">{chapters.length} chapters in manuscript</p>
        </div>
        <div className="flex items-center space-x-2">
          {onImportDocument && (
            <label
              title="Import PDF, Word (.docx) or Text file"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold shadow-xs cursor-pointer border border-stone-300 transition"
            >
              <FileUp className="w-3.5 h-3.5 text-amber-900" />
              <span>{importingDocument ? 'Importing...' : 'Import File'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={onImportDocument}
                disabled={importingDocument}
                className="hidden"
              />
            </label>
          )}

          <button
            onClick={onAddChapter}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* ARCS Section: Directly below the Chapters & Outline header */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-stone-100 shrink-0">
        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
          <Layers className="w-3 h-3 text-amber-800" />
          <span>Arcs:</span>
        </div>

        {/* Filter: All Chapters */}
        <button
          type="button"
          onClick={() => setSelectedArcFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
            selectedArcFilter === 'all'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All ({chapters.length})
        </button>

        {/* Existing Arc Filter & Edit/Delete Pills */}
        {uniqueArcs.map((arc) => {
          const isSelected = selectedArcFilter.trim().toLowerCase() === arc.trim().toLowerCase();
          const rangeStr = getArcChapterRange(arc, chapters);

          return (
            <div
              key={arc}
              className={`inline-flex items-center rounded-lg text-xs font-semibold transition border ${
                isSelected
                  ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                  : 'bg-amber-50/90 text-amber-950 border-amber-200 hover:bg-amber-100/90'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedArcFilter(isSelected ? 'all' : arc)}
                className="px-2.5 py-1 flex items-center space-x-1"
                title={`Filter by ${arc} (${rangeStr})`}
              >
                <span>{arc}</span>
                {rangeStr && (
                  <span
                    className={`text-[10px] font-medium ${
                      isSelected ? 'text-amber-200' : 'text-amber-800/80'
                    }`}
                  >
                    ({rangeStr})
                  </span>
                )}
              </button>

              {/* Edit Arc Range Button */}
              {onSaveArc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditArcModal(arc);
                  }}
                  className={`p-1 hover:bg-black/10 rounded transition ${
                    isSelected ? 'text-amber-200 hover:text-white' : 'text-amber-700 hover:text-amber-950'
                  }`}
                  title={`Edit ${arc} range`}
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}

              {/* Delete Arc Button */}
              {onDeleteArc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArcToDelete(arc);
                  }}
                  className={`p-1 hover:bg-black/10 rounded transition ${
                    isSelected ? 'text-amber-200 hover:text-white' : 'text-amber-700 hover:text-red-600'
                  }`}
                  title={`Remove ${arc}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Arc (+) Button */}
        {onSaveArc && (
          <button
            type="button"
            onClick={openAddArcModal}
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-100/80 hover:bg-amber-200 text-amber-950 rounded-lg text-xs font-bold border border-dashed border-amber-300 transition shadow-xs"
            title="Add new Arc with chapter range"
          >
            <Plus className="w-3.5 h-3.5 text-amber-900" />
            <span>Add Arc</span>
          </button>
        )}
      </div>

      {chapters.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="font-serif text-sm italic text-stone-600">No chapters added yet.</p>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={onAddChapter}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg"
            >
              Create Chapter 1
            </button>
            {onImportDocument && (
              <label className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white text-xs font-medium rounded-lg cursor-pointer">
                Upload PDF / Word
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={onImportDocument}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto pr-1 max-h-[calc(100vh-230px)]">
          {displayedChapters.map((chapter, index) => {
            const isActive = chapter._id === activeChapterId;
            const badge = getChapterNumberBadge(chapter, chapters);
            const prologue = index === 0 && isChapterPrologue(chapter, index);
            const isDragging = draggedChapterId === chapter._id;
            const isDragOver = dragOverChapterId === chapter._id;

            // Show Arc Header Banner when arc changes (in 'all' view)
            const showArcBanner =
              selectedArcFilter === 'all' &&
              chapter.arc &&
              chapter.arc.trim() &&
              (index === 0 || chapters[index - 1]?.arc !== chapter.arc);

            return (
              <React.Fragment key={chapter._id}>
                {showArcBanner && (
                  <div className="flex items-center justify-between py-1.5 px-3 bg-amber-50/90 rounded-lg border border-amber-200/80 text-amber-900 mt-3 mb-1">
                    <div className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-800" />
                      <span className="font-bold text-xs">{chapter.arc}</span>
                    </div>
                    <span className="text-[10px] text-amber-800/80 font-medium">
                      {getArcChapterRange(chapter.arc || '', chapters)}
                    </span>
                  </div>
                )}

                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, chapter._id)}
                  onDragOver={(e) => handleDragOver(e, chapter._id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, chapter._id)}
                  className={`p-3 rounded-xl border transition flex items-center justify-between group cursor-grab active:cursor-grabbing ${
                    isDragging ? 'opacity-40 border-dashed border-amber-800' : ''
                  } ${
                    isDragOver ? 'border-2 border-amber-600 bg-amber-100/50 scale-[1.01]' : ''
                  } ${
                    isActive && !isDragOver
                      ? 'border-amber-800 bg-amber-50/70 shadow-xs'
                      : !isDragOver
                      ? 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                      : ''
                  }`}
                >
                  {/* Drag handle & Chapter Title */}
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <div
                      title="Drag to reorder chapter"
                      className="p-1 text-stone-400 group-hover:text-stone-600 cursor-grab"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div
                      onClick={() => onSelectChapter(chapter)}
                      className="flex-1 flex items-center space-x-3 cursor-pointer min-w-0"
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 ${
                          prologue ? 'bg-amber-800 text-amber-50' : 'bg-stone-200/80 text-stone-700'
                        }`}
                      >
                        {badge}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-amber-950 font-bold' : 'text-stone-900'}`}>
                            {chapter.title || getChapterDisplayLabel(chapter, chapters)}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-stone-500 mt-0.5">
                          {chapter.arc && (
                            <span
                              className="text-[10px] font-semibold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300/80 truncate max-w-[120px]"
                              title={`Belongs to ${chapter.arc}`}
                            >
                              {chapter.arc}
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{chapter.wordCount || 0} words</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Prologue Checkbox ONLY on Chapter 1 (index 0) */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {index === 0 && onTogglePrologue && (
                      <button
                        onClick={() => onTogglePrologue(chapter)}
                        title={prologue ? 'Unmark Prologue (returns to Chapter 1)' : 'Mark as Prologue (shifts Chapters down)'}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition shadow-xs ${
                          prologue
                            ? 'bg-amber-800 text-amber-50 hover:bg-amber-900'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
                        }`}
                      >
                        {prologue ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>Prologue</span>
                      </button>
                    )}

                    <button
                      onClick={() => onReorder(chapter._id, 'up')}
                      disabled={index === 0}
                      title="Move Up"
                      className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 transition"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onReorder(chapter._id, 'down')}
                      disabled={index === chapters.length - 1}
                      title="Move Down"
                      className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 transition"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectChapter(chapter)}
                      title="Edit Chapter"
                      className="p-1.5 text-stone-600 hover:text-amber-900 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteChapter(chapter)}
                      title="Delete Chapter"
                      className="p-1.5 text-stone-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Arc Range Selection & Configuration Modal (Portaled to body to prevent stacking context clipping) */}
      {isArcModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-paper-card max-w-md w-full p-6 rounded-2xl border border-paper-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2 text-amber-900">
                <Layers className="w-5 h-5 text-amber-800" />
                <h3 className="font-playfair text-xl font-bold text-stone-900">
                  {editingArcOriginalName ? `Edit "${editingArcOriginalName}"` : 'Add Story Arc'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsArcModalOpen(false);
                  setEditingArcOriginalName(null);
                  setArcModalError(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-600 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {arcModalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{arcModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveArcSubmit} className="space-y-4">
              {/* Arc Title Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Arc Title
                </label>
                <input
                  type="text"
                  value={arcModalName}
                  onChange={(e) => setArcModalName(e.target.value)}
                  placeholder="e.g. Arc 1 or Arc 2: The Rising Embers"
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-sm text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                />
              </div>

              {/* Range Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    From Chapter
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={totalNumberedChapters || 1}
                    value={arcModalFrom}
                    onChange={(e) => setArcModalFrom(parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full px-3 py-2 text-sm text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    To Chapter
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={totalNumberedChapters || 1}
                    value={arcModalTo}
                    onChange={(e) => setArcModalTo(parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full px-3 py-2 text-sm text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                  />
                </div>
              </div>

              {/* Prologue Checkbox (if story has a prologue) */}
              {hasPrologue && (
                <label className="flex items-center space-x-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={arcModalIncludePrologue}
                    onChange={(e) => setArcModalIncludePrologue(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-900 focus:ring-amber-800 border-stone-300"
                  />
                  <span className="text-xs font-medium text-stone-800">
                    Include Prologue in this Arc
                  </span>
                </label>
              )}

              {/* Summary / Range Preview */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-800" />
                  <span>Arc Chapter Range:</span>
                </div>
                <p className="text-stone-700">
                  {arcModalIncludePrologue ? 'Prologue + ' : ''}
                  {Math.min(arcModalFrom, arcModalTo) === Math.max(arcModalFrom, arcModalTo)
                    ? `Chapter ${Math.min(arcModalFrom, arcModalTo)} (1 chapter)`
                    : `Chapters ${Math.min(arcModalFrom, arcModalTo)} to ${Math.max(arcModalFrom, arcModalTo)} (${Math.max(arcModalFrom, arcModalTo) - Math.min(arcModalFrom, arcModalTo) + 1} chapters)`}
                </p>
                <p className="text-[11px] text-stone-500 italic">
                  Chapter numbers continue uninterrupted across the entire story. If a selected chapter already belongs to another Arc, saving will be blocked.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsArcModalOpen(false);
                    setEditingArcOriginalName(null);
                    setArcModalError(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={arcModalSubmitting || !arcModalName.trim()}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 shadow-xs transition disabled:opacity-50"
                >
                  {arcModalSubmitting ? 'Saving Arc...' : editingArcOriginalName ? 'Update Arc' : 'Create Arc'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Arc Confirmation Modal (Portaled to body to prevent stacking context clipping) */}
      {arcToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-paper-card max-w-sm w-full p-5 rounded-2xl border border-paper-border shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-800" />
              <h3 className="font-playfair text-lg font-bold text-stone-900">Remove Arc?</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove <strong>"{arcToDelete}"</strong>?
              The chapters will remain in your manuscript, but they will no longer belong to this arc.
            </p>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setArcToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteArc && arcToDelete) {
                    onDeleteArc(arcToDelete);
                    setArcToDelete(null);
                    if (selectedArcFilter === arcToDelete) {
                      setSelectedArcFilter('all');
                    }
                  }
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 shadow-xs"
              >
                Remove Arc
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
