import React, { useState } from 'react';
import { Chapter } from '../../types';
import { Plus, MoveUp, MoveDown, Trash2, Edit3, BookOpen, Clock, CheckSquare, Square, GripVertical, FileUp, Layers, Split } from 'lucide-react';
import { getChapterNumberBadge, isChapterPrologue, getChapterDisplayLabel, getUniqueArcs, getArcChapterRange } from '../../utils/chapterUtils';

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
  onUpdateChapterArc?: (chapterId: string, arc: string) => void;
  onSplitArc?: (fromIndex: number, newArcName: string) => void;
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
  onUpdateChapterArc,
  onSplitArc,
}) => {
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null);
  const [selectedArcFilter, setSelectedArcFilter] = useState<string>('all');

  // Modals for Arc splitting and editing
  const [splitModalIndex, setSplitModalIndex] = useState<number | null>(null);
  const [splitArcName, setSplitArcName] = useState<string>('');
  const [quickArcChapter, setQuickArcChapter] = useState<Chapter | null>(null);
  const [quickArcInput, setQuickArcInput] = useState<string>('');

  const uniqueArcs = getUniqueArcs(chapters);

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

  const displayedChapters = selectedArcFilter === 'all'
    ? chapters
    : chapters.filter((c) => c.arc && c.arc.trim() === selectedArcFilter.trim());

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

      {/* Arc Filter Tabs (if arcs exist) */}
      {uniqueArcs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-stone-100 shrink-0">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
            <Layers className="w-3 h-3 text-amber-800" />
            <span>Arcs:</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedArcFilter('all')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition ${
              selectedArcFilter === 'all'
                ? 'bg-amber-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All ({chapters.length})
          </button>
          {uniqueArcs.map((arc) => (
            <button
              key={arc}
              type="button"
              onClick={() => setSelectedArcFilter(arc)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                selectedArcFilter === arc
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {arc}
            </button>
          ))}
        </div>
      )}

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
                          {chapter.arc ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickArcChapter(chapter);
                                setQuickArcInput(chapter.arc || '');
                              }}
                              className="text-[10px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.2 rounded border border-amber-300/80 truncate max-w-[120px]"
                              title="Click to edit Arc for this chapter"
                            >
                              {chapter.arc}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSplitModalIndex(index);
                                setSplitArcName(`Arc ${uniqueArcs.length + 1}`);
                              }}
                              className="text-[10px] text-stone-400 hover:text-amber-800 hover:bg-amber-50 px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition"
                              title="Assign Arc"
                            >
                              + Arc
                            </button>
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

                    {onSplitArc && (
                      <button
                        type="button"
                        onClick={() => {
                          setSplitModalIndex(index);
                          setSplitArcName(`Arc ${uniqueArcs.length + 1}`);
                        }}
                        title="Split Arc from this chapter onwards"
                        className="p-1.5 text-stone-400 hover:text-amber-800 hover:bg-amber-50 rounded transition"
                      >
                        <Split className="w-3.5 h-3.5" />
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

      {/* Split Arc Modal */}
      {splitModalIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-paper-card max-w-sm w-full p-5 rounded-2xl border border-paper-border shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-900">
              <Layers className="w-5 h-5 text-amber-800" />
              <h3 className="font-playfair text-lg font-bold text-stone-900">Split Story Arc</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Start a new Arc from <strong>{chapters[splitModalIndex]?.title}</strong> onwards. Subsequent chapters will belong to this Arc, and chapter numbers continue sequentially.
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Arc Title
              </label>
              <input
                type="text"
                value={splitArcName}
                onChange={(e) => setSplitArcName(e.target.value)}
                placeholder="e.g. Arc 2: The Rising Embers"
                autoFocus
                className="w-full px-3 py-2 text-sm text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSplitModalIndex(null);
                  setSplitArcName('');
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!splitArcName.trim()}
                onClick={() => {
                  if (onSplitArc && splitModalIndex !== null) {
                    onSplitArc(splitModalIndex, splitArcName);
                    setSplitModalIndex(null);
                    setSplitArcName('');
                  }
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 shadow-xs disabled:opacity-50"
              >
                Apply Arc Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Single Chapter Arc Modal */}
      {quickArcChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-paper-card max-w-sm w-full p-5 rounded-2xl border border-paper-border shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-900">
              <Layers className="w-5 h-5 text-amber-800" />
              <h3 className="font-playfair text-lg font-bold text-stone-900">Chapter Arc</h3>
            </div>
            <p className="text-xs text-stone-600 font-sans">
              Set the Arc for <strong>"{quickArcChapter.title}"</strong>:
            </p>
            <div>
              <input
                type="text"
                value={quickArcInput}
                onChange={(e) => setQuickArcInput(e.target.value)}
                placeholder="e.g. Arc 1 or Arc 2: The Rising Embers"
                autoFocus
                className="w-full px-3 py-2 text-sm text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
              />
            </div>
            {uniqueArcs.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-500">Or pick existing arc:</span>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueArcs.map((arc) => (
                    <button
                      key={arc}
                      type="button"
                      onClick={() => setQuickArcInput(arc)}
                      className="text-xs px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300"
                    >
                      {arc}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuickArcInput('')}
                    className="text-xs px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                  >
                    Clear Arc
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickArcChapter(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateChapterArc && quickArcChapter) {
                    onUpdateChapterArc(quickArcChapter._id, quickArcInput.trim());
                    setQuickArcChapter(null);
                  }
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 shadow-xs"
              >
                Save Arc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
