import React, { useState } from 'react';
import { Chapter } from '../../types';
import { Plus, MoveUp, MoveDown, Trash2, Edit3, BookOpen, Clock, CheckSquare, Square, GripVertical, FileUp } from 'lucide-react';
import { getChapterNumberBadge, isChapterPrologue, getChapterDisplayLabel } from '../../utils/chapterUtils';

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
}) => {
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null);

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

  return (
    <div className="bg-paper-card p-6 rounded-2xl border border-paper-border/80 shadow-book space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-stone-200">
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
        <div className="space-y-2">
          {chapters.map((chapter, index) => {
            const isActive = chapter._id === activeChapterId;
            const badge = getChapterNumberBadge(chapter, chapters);
            const prologue = index === 0 && isChapterPrologue(chapter, index);
            const isDragging = draggedChapterId === chapter._id;
            const isDragOver = dragOverChapterId === chapter._id;

            return (
              <div
                key={chapter._id}
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
                      <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-amber-950 font-bold' : 'text-stone-900'}`}>
                        {chapter.title || getChapterDisplayLabel(chapter, chapters)}
                      </h4>
                      <div className="flex items-center space-x-3 text-[11px] text-stone-500 mt-0.5">
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
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteChapter(chapter)}
                    title="Delete Chapter"
                    className="p-1.5 text-stone-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
