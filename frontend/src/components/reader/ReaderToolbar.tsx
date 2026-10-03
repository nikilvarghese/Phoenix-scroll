import React from 'react';
import { ChevronLeft, ChevronRight, List, Sliders } from 'lucide-react';

interface ReaderToolbarProps {
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onToggleTOC: () => void;
  onToggleSettings: () => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  hasPrevChapter,
  hasNextChapter,
  onPrevChapter,
  onNextChapter,
  onToggleTOC,
  onToggleSettings,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-stone-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full border border-stone-800 shadow-2xl flex items-center space-x-3">
        <button
          onClick={onPrevChapter}
          disabled={!hasPrevChapter}
          className="p-2 hover:bg-stone-800 rounded-full disabled:opacity-30 transition"
          title="Previous Page / Chapter"
        >
          <ChevronLeft className="w-5 h-5 text-amber-200" />
        </button>

        <div className="h-4 w-px bg-stone-700" />

        <button
          onClick={onToggleTOC}
          className="p-2 hover:bg-stone-800 rounded-full transition"
          title="Contents"
        >
          <List className="w-4 h-4 text-stone-300" />
        </button>

        <button
          onClick={onToggleSettings}
          className="p-2 hover:bg-stone-800 rounded-full transition"
          title="Typography & Appearance"
        >
          <Sliders className="w-4 h-4 text-stone-300" />
        </button>

        <div className="h-4 w-px bg-stone-700" />

        <button
          onClick={onNextChapter}
          disabled={!hasNextChapter}
          className="p-2 hover:bg-stone-800 rounded-full disabled:opacity-30 transition"
          title="Next Page / Chapter"
        >
          <ChevronRight className="w-5 h-5 text-amber-200" />
        </button>
      </div>
    </div>
  );
};
