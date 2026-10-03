import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Lock, Globe, EyeOff, Edit3, Trash2, CheckCircle, Eye } from 'lucide-react';
import { Story } from '../../types';
import { formatImageUrl } from '../../utils/imageUrlUtils';

interface StoryCardProps {
  story: Story;
  isOwner?: boolean;
  onDelete?: (story: Story) => void;
  onTogglePublish?: (story: Story) => void;
  showStatusBadges?: boolean;
  hasProgress?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  isOwner,
  onDelete,
  onTogglePublish,
  showStatusBadges = true,
  hasProgress = false,
}) => {
  const getVisibilityIcon = () => {
    switch (story.visibility) {
      case 'public':
        return <Globe className="w-3.5 h-3.5 text-emerald-600" />;
      case 'unlisted':
        return <EyeOff className="w-3.5 h-3.5 text-amber-600" />;
      case 'private':
        return <Lock className="w-3.5 h-3.5 text-stone-500" />;
    }
  };

  const formattedCoverUrl = formatImageUrl(story.coverImage);

  return (
    <div className="group bg-paper-card rounded-2xl overflow-hidden border border-paper-border/80 shadow-book hover:shadow-book-hover transition-all duration-300 flex flex-col h-full">
      {/* Cover Image Header */}
      <div className="relative h-56 bg-stone-900 overflow-hidden">
        {formattedCoverUrl ? (
          <img
            src={formattedCoverUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-800 via-amber-950 to-stone-900 flex items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <BookOpen className="w-10 h-10 text-amber-200/40 mx-auto" />
              <p className="font-playfair text-amber-100/70 text-lg font-serif italic line-clamp-2">
                "{story.title}"
              </p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20" />

        {/* Status Pill Badges */}
        {showStatusBadges && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs ${
                story.isPublished
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
              }`}
            >
              {story.isPublished ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span>Published</span>
                </>
              ) : (
                <span>Draft</span>
              )}
            </span>

            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-950/70 text-stone-300 border border-stone-700/50 backdrop-blur-md">
              {getVisibilityIcon()}
              <span className="capitalize">{story.visibility}</span>
            </span>
          </div>
        )}

        {story.genre && (
          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-black/40 text-amber-200 backdrop-blur-md border border-white/10">
            {story.genre}
          </span>
        )}

        {/* Reading Time Badge */}
        <div className="absolute bottom-3 left-3 text-white text-xs font-sans flex items-center space-x-1.5 opacity-90">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>{story.readingTimeMinutes || 1} min read</span>
          <span className="text-stone-400">•</span>
          <span>{story.chapterCount || 0} chapters</span>
        </div>
      </div>

      {/* Story Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-amber-900 tracking-wide">
            By {story.authorName}
          </div>
          <h3 className="font-playfair text-xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2">
            {story.title}
          </h3>
          {story.subtitle && (
            <p className="font-serif italic text-sm text-stone-600 line-clamp-1">
              {story.subtitle}
            </p>
          )}
          <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed font-sans pt-1">
            {story.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
          <Link
            to={`/read/${story._id}`}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-amber-900 hover:bg-amber-950 text-amber-50 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{hasProgress ? 'Continue Reading' : 'Begin Reading'}</span>
          </Link>

          {isOwner && (
            <div className="flex items-center space-x-1">
              <Link
                to={`/editor/${story._id}`}
                title="Edit Story"
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </Link>

              {onTogglePublish && (
                <button
                  onClick={() => onTogglePublish(story)}
                  title={story.isPublished ? 'Unpublish Story' : 'Publish Story'}
                  className={`p-2 rounded-lg transition-colors ${
                    story.isPublished ? 'text-emerald-700 hover:bg-emerald-50' : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(story)}
                  title="Delete Story"
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
