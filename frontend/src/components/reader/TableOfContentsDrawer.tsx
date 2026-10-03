import React from 'react';
import { X, BookOpen, Clock, Check } from 'lucide-react';
import { Story, Chapter } from '../../types';
import { getChapterNumberBadge } from '../../utils/chapterUtils';

interface TableOfContentsDrawerProps {
  isOpen: boolean;
  story: Story;
  chapters: Chapter[];
  currentChapterId?: string;
  onSelectChapter: (order: number) => void;
  onClose: () => void;
}

export const TableOfContentsDrawer: React.FC<TableOfContentsDrawerProps> = ({
  isOpen,
  story,
  chapters,
  currentChapterId,
  onSelectChapter,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm bg-stone-900 text-stone-100 h-full shadow-2xl flex flex-col z-10 border-r border-stone-800">
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-playfair text-lg font-bold text-amber-100 truncate">
              Table of Contents
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Summary */}
        <div className="p-5 bg-stone-950/60 border-b border-stone-800 space-y-1">
          <h4 className="font-playfair font-bold text-sm text-stone-200">{story.title}</h4>
          <p className="text-xs text-amber-400/90 font-serif italic">By {story.authorName}</p>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chapters.map((ch) => {
            const isCurrent = ch._id === currentChapterId;
            const badge = getChapterNumberBadge(ch, chapters);

            return (
              <button
                key={ch._id}
                onClick={() => {
                  onSelectChapter(ch.order);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between group ${
                  isCurrent
                    ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-xs'
                    : 'bg-stone-800/40 border-stone-800/80 hover:bg-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 ${
                      isCurrent ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {badge}
                  </span>
                  <div className="truncate">
                    <h5 className={`text-xs font-semibold font-serif truncate ${isCurrent ? 'text-white' : ''}`}>
                      {ch.title}
                    </h5>
                    <span className="text-[10px] text-stone-400 font-sans flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-stone-500" />
                      <span>{ch.wordCount || 0} words</span>
                    </span>
                  </div>
                </div>

                {isCurrent && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
