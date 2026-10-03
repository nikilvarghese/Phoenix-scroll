import React from 'react';
import { List, Sliders, ArrowLeft, BookmarkCheck } from 'lucide-react';
import { Story, Chapter } from '../../types';

interface BookHeaderProps {
  story: Story;
  currentChapter?: Chapter;
  scrollPercentage: number;
  onBackToCover: () => void;
  onManualSave?: () => void;
  onToggleTOC: () => void;
  onToggleSettings: () => void;
}

export const BookHeader: React.FC<BookHeaderProps> = ({
  story,
  currentChapter,
  scrollPercentage,
  onBackToCover,
  onManualSave,
  onToggleTOC,
  onToggleSettings,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 translate-y-0">
      <div className="bg-stone-900/95 text-stone-100 backdrop-blur-md border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Back Arrow & Table of Contents Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={onBackToCover}
              title="Save progress & return to cover overview"
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-stone-100 hover:text-white bg-amber-900/60 hover:bg-amber-900 border border-amber-700/60 rounded-xl transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Cover</span>
            </button>

            <button
              onClick={onToggleTOC}
              title="Table of Contents"
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-stone-200 hover:text-white bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 rounded-xl transition cursor-pointer"
            >
              <List className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Contents</span>
            </button>
          </div>

          {/* Center Story & Chapter Title */}
          <div className="text-center truncate px-1 min-w-0 flex-1 max-w-[150px] sm:max-w-md lg:max-w-lg">
            <h2 className="font-playfair text-xs sm:text-sm md:text-base font-bold truncate text-amber-100">
              {story.title}
            </h2>
            {currentChapter && (
              <p className="text-[10px] sm:text-xs text-stone-400 font-serif italic truncate">
                {currentChapter.title}
              </p>
            )}
          </div>

          {/* Settings, Manual Save & Progress */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {onManualSave && (
              <button
                onClick={onManualSave}
                title="Save Reading Progress"
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-emerald-300 hover:text-emerald-100 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 rounded-xl transition shadow-xs cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Save Progress</span>
                <span className="inline sm:hidden">Save</span>
              </button>
            )}

            <div className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 bg-stone-800/90 rounded-lg border border-stone-700/50">
              <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-300">
                {Math.round(scrollPercentage)}%
              </span>
            </div>

            <button
              onClick={onToggleSettings}
              title="Reader Typography & Theme Settings"
              className="flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-stone-200 hover:text-white bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 rounded-xl transition cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-stone-300 shrink-0" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Top Reading Progress Bar */}
        <div className="h-0.5 bg-stone-800 w-full">
          <div
            className="h-full bg-amber-400 transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, scrollPercentage))}%` }}
          />
        </div>
      </div>
    </header>
  );
};
