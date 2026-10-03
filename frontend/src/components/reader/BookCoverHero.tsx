import React from 'react';
import { Story, Chapter } from '../../types';
import { BookOpen, Clock, Play, ChevronRight, ListOrdered, ArrowLeft } from 'lucide-react';
import { getChapterDisplayLabel, getChapterNumberBadge, isChapterPrologue } from '../../utils/chapterUtils';
import { formatImageUrl } from '../../utils/imageUrlUtils';

interface BookCoverHeroProps {
  story: Story;
  chapters: Chapter[];
  savedChapterOrder?: number;
  onStartReading: (chapterOrder: number) => void;
  onBackToLibrary?: () => void;
}

export const BookCoverHero: React.FC<BookCoverHeroProps> = ({
  story,
  chapters,
  savedChapterOrder,
  onStartReading,
  onBackToLibrary,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const targetChapterOrder = savedChapterOrder !== undefined ? savedChapterOrder : (sortedChapters.length > 0 ? sortedChapters[0].order : 1);

  const firstIsPrologue = sortedChapters.length > 0 && isChapterPrologue(sortedChapters[0], 0);
  const formattedCoverUrl = formatImageUrl(story.coverImage);
  const showCoverImage = formattedCoverUrl && !imgError;

  return (
    <div className="min-h-screen bg-paper-bg py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center space-y-6">
      {/* Top Bar: Back to Library Navigation */}
      {onBackToLibrary && (
        <div className="max-w-4xl w-full flex items-center justify-between">
          <button
            onClick={onBackToLibrary}
            className="flex items-center space-x-2 px-4 py-2 bg-stone-900/90 text-amber-100 hover:bg-stone-800 rounded-xl text-xs font-bold transition shadow-md border border-stone-800"
          >
            <ArrowLeft className="w-4 h-4 text-amber-300" />
            <span>Back to Library</span>
          </button>
        </div>
      )}

      {/* Top Main Hero Card: Cover & Synopsis */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center bg-paper-card p-6 sm:p-10 rounded-3xl border border-paper-border/80 shadow-2xl">
        {/* Left Column: Book Cover Spine Effect */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-56 h-84 sm:w-64 sm:h-92 md:w-72 md:h-96 max-w-full rounded-2xl overflow-hidden shadow-2xl border border-stone-800/20 group">
            {showCoverImage ? (
              <img
                src={formattedCoverUrl}
                alt={story.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 p-8 flex flex-col justify-between text-amber-100">
                <BookOpen className="w-12 h-12 text-amber-300/40" />
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-amber-300/70 font-sans">
                    {story.genre || 'Digital Book'}
                  </span>
                  <h1 className="font-playfair text-2xl font-bold italic">“{story.title}”</h1>
                  <p className="text-xs text-amber-200/80">By {story.authorName}</p>
                </div>
              </div>
            )}
            {/* Book Spine Overlay */}
            <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-6 right-6 text-white text-xs font-sans flex items-center justify-between">
              <span className="font-semibold text-amber-200">{sortedChapters.length} Chapters</span>
              <span className="flex items-center space-x-1 opacity-90">
                <Clock className="w-3.5 h-3.5" />
                <span>{story.readingTimeMinutes || 0} min</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Subtitle, Author & Reading Action */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 bg-amber-100 text-amber-900 rounded-full">
                {story.genre || 'Fiction'}
              </span>
              <span className="text-xs text-stone-500 font-sans">
                Published {story.publishedAt ? new Date(story.publishedAt).toLocaleDateString() : 'Draft'}
              </span>
            </div>

            <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
              {story.title}
            </h1>

            {story.subtitle && (
              <p className="font-serif italic text-lg text-amber-900/90 leading-relaxed">
                {story.subtitle}
              </p>
            )}

            <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Written by <span className="text-stone-900 font-bold">{story.authorName}</span>
            </p>
          </div>

          <div className="border-t border-stone-200/80 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Synopsis</h3>
            <p className="text-stone-700 text-sm leading-relaxed font-sans line-clamp-5">
              {story.description}
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={() => onStartReading(targetChapterOrder)}
              className="w-full py-4 px-6 bg-amber-900 hover:bg-amber-950 text-amber-50 rounded-xl font-semibold text-base flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {savedChapterOrder !== undefined
                  ? 'Resume Reading Story'
                  : 'Begin Reading Story'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Full-Width Table of Contents Section */}
      {sortedChapters.length > 0 && (
        <div className="max-w-4xl w-full bg-paper-card p-6 sm:p-10 rounded-3xl border border-paper-border/80 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
                <ListOrdered className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-playfair text-2xl font-bold text-stone-900">
                  Table of Contents
                </h2>
                <p className="text-xs text-stone-500 font-sans">
                  {sortedChapters.length} sections ({firstIsPrologue ? `1 Prologue + ${sortedChapters.length - 1} Chapters` : `${sortedChapters.length} Chapters`})
                </p>
              </div>
            </div>
          </div>

          {/* Full Table of Contents Grid - No tiny scrollboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sortedChapters.map((ch) => {
              const label = getChapterDisplayLabel(ch, sortedChapters);
              const badge = getChapterNumberBadge(ch, sortedChapters);
              const isPrologue = badge === 'P';

              return (
                <button
                  key={ch._id}
                  onClick={() => onStartReading(ch.order)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group ${
                    isPrologue
                      ? 'bg-amber-50/80 border-amber-300/80 hover:bg-amber-100/80 hover:border-amber-400'
                      : 'bg-stone-50/60 border-stone-200/80 hover:bg-stone-100 hover:border-stone-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                    <span
                      className={`w-9 h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 shadow-xs ${
                        isPrologue
                          ? 'bg-amber-800 text-amber-50'
                          : 'bg-stone-200 text-stone-800 group-hover:bg-amber-900 group-hover:text-amber-50'
                      }`}
                    >
                      {badge}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isPrologue ? 'text-amber-900' : 'text-stone-500'}`}>
                          {label}
                        </span>
                      </div>
                      <h4 className="font-playfair text-sm sm:text-base font-bold text-stone-900 group-hover:text-amber-950 truncate">
                        {ch.title}
                      </h4>
                      {ch.wordCount ? (
                        <span className="text-[11px] text-stone-400 font-sans flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{ch.wordCount} words</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-2 text-stone-400 group-hover:text-amber-900 transition-transform group-hover:translate-x-1 flex-shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
