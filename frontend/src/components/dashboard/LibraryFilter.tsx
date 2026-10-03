import React from 'react';
import { BookOpen, FileEdit, CheckCircle, Lock, Search, Clock } from 'lucide-react';

export type FilterTab = 'all' | 'published' | 'drafts' | 'private' | 'continue' | 'completed';

interface LibraryFilterProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    published: number;
    drafts: number;
    private: number;
    continue?: number;
    completed?: number;
  };
  isOwner?: boolean;
  showPublishedTab?: boolean;
  showReadingProgressTabs?: boolean;
}

export const LibraryFilter: React.FC<LibraryFilterProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  counts,
  isOwner,
  showPublishedTab = true,
  showReadingProgressTabs = false,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-100/60 p-2 rounded-xl border border-stone-200/60">
      {/* Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
        <button
          onClick={() => onTabChange('all')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-stone-500" />
          <span>All Manuscripts</span>
          <span className="ml-1 px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-full text-[10px]">
            {counts.all}
          </span>
        </button>

        {showReadingProgressTabs && (
          <>
            <button
              onClick={() => onTabChange('continue')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'continue'
                  ? 'bg-white text-amber-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-800" />
              <span>Continue Reading</span>
              {counts.continue !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full text-[10px]">
                  {counts.continue}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('completed')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'completed'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed</span>
              {counts.completed !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-full text-[10px]">
                  {counts.completed}
                </span>
              )}
            </button>
          </>
        )}

        {showPublishedTab && (
          <button
            onClick={() => onTabChange('published')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'published'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Published</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
              {counts.published}
            </span>
          </button>
        )}

        {isOwner && (
          <>
            <button
              onClick={() => onTabChange('drafts')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'drafts'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-amber-600" />
              <span>Drafts</span>
              <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                {counts.drafts}
              </span>
            </button>

            <button
              onClick={() => onTabChange('private')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'private'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Private & Unlisted</span>
              <span className="ml-1 px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-full text-[10px]">
                {counts.private}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Search Input */}
      <div className="relative w-full md:w-auto md:min-w-[200px] md:max-w-[260px]">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full pl-9 pr-3 py-1.5 bg-white text-xs text-stone-800 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-800"
        />
      </div>
    </div>
  );
};
