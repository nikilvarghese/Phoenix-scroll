import React, { useState } from 'react';
import { Story } from '../../types';
import { storyService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Upload, Lock, EyeOff, Globe, Image as ImageIcon, Save, KeyRound } from 'lucide-react';
import { formatImageUrl } from '../../utils/imageUrlUtils';

interface StorySettingsFormProps {
  story: Partial<Story>;
  onChange: (updated: Partial<Story>) => void;
  onSave: () => Promise<void>;
  saving?: boolean;
}

export const StorySettingsForm: React.FC<StorySettingsFormProps> = ({
  story,
  onChange,
  onSave,
  saving,
}) => {
  const { showError } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = await storyService.uploadImage(file);
      onChange({ coverImage: data.url });
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to upload image. Make sure it is under 10MB JPG, PNG, WEBP, or GIF.');
    } finally {
      setUploading(false);
    }
  };

  const formattedCoverUrl = formatImageUrl(story.coverImage);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="bg-paper-card p-6 sm:p-8 rounded-2xl border border-paper-border/80 shadow-book space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-stone-900">Story Metadata & Settings</h2>
          <p className="text-xs text-stone-500">Configure title, cover art, and access privacy.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-sm font-semibold shadow-xs transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Cover Image Upload */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
            Book Cover Image
          </label>

          <div className="relative aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-4 text-center hover:border-amber-800 transition">
            {formattedCoverUrl ? (
              <>
                <img src={formattedCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                  Change Cover
                </div>
              </>
            ) : (
              <div className="space-y-2 text-stone-500">
                <ImageIcon className="w-8 h-8 mx-auto text-stone-400" />
                <p className="text-xs font-medium">Click to upload cover image</p>
                <p className="text-[10px] text-stone-400">JPG, PNG, WEBP (Max 10MB)</p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {uploading && <p className="text-xs text-amber-800 text-center font-medium animate-pulse">Uploading cover image...</p>}

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">Or Direct Image URL</label>
            <input
              type="url"
              value={story.coverImage || ''}
              onChange={(e) => onChange({ coverImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-800"
            />
          </div>
        </div>

        {/* Right Columns: Main Story Details */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Story Title *
            </label>
            <input
              type="text"
              required
              value={story.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="The Starlight Chronicles"
              className="w-full px-4 py-2.5 text-lg font-playfair font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Subtitle / Tagline
            </label>
            <input
              type="text"
              value={story.subtitle || ''}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="A tale of forgotten constellations..."
              className="w-full px-3 py-2 text-sm font-serif italic text-stone-700 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={story.authorName || ''}
                onChange={(e) => onChange({ authorName: e.target.value })}
                placeholder="Eleanor Vance"
                className="w-full px-3 py-2 text-sm text-stone-800 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Genre / Category
              </label>
              <input
                type="text"
                value={story.genre || 'Fiction'}
                onChange={(e) => onChange({ genre: e.target.value })}
                placeholder="Fantasy, Speculative, Mystery"
                className="w-full px-3 py-2 text-sm text-stone-800 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Synopsis / Description *
            </label>
            <textarea
              rows={4}
              required
              value={story.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Provide a compelling overview of your book..."
              className="w-full px-3 py-2.5 text-sm text-stone-800 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 leading-relaxed font-sans"
            />
          </div>

          {/* Visibility Controls */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Access & Visibility Mode
            </label>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onChange({ visibility: 'private' })}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 transition ${
                  story.visibility === 'private'
                    ? 'border-amber-800 bg-amber-50/70 text-amber-950 font-semibold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-bold">Private</span>
                </div>
                <span className="text-[10px] text-stone-500 font-normal">Only visible to author</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ visibility: 'unlisted' })}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 transition ${
                  story.visibility === 'unlisted'
                    ? 'border-amber-800 bg-amber-50/70 text-amber-950 font-semibold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <EyeOff className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold">Unlisted</span>
                </div>
                <span className="text-[10px] text-stone-500 font-normal">Accessible via direct link</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ visibility: 'public' })}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 transition ${
                  story.visibility === 'public'
                    ? 'border-amber-800 bg-amber-50/70 text-amber-950 font-semibold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold">Public</span>
                </div>
                <span className="text-[10px] text-stone-500 font-normal">Visible in library list</span>
              </button>
            </div>

            {story.visibility !== 'public' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-800" />
                  <span>Optional Access Passcode</span>
                </label>
                <input
                  type="text"
                  value={story.accessPasscode || ''}
                  onChange={(e) => onChange({ accessPasscode: e.target.value })}
                  placeholder="e.g. 1234 (Leave empty for no passcode restriction)"
                  className="w-full px-3 py-2 text-xs font-mono text-stone-800 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
