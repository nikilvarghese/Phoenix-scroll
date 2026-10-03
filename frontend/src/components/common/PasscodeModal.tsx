import React, { useState } from 'react';
import { KeyRound, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { formatImageUrl } from '../../utils/imageUrlUtils';

interface PasscodeModalProps {
  storyTitle: string;
  coverImage?: string;
  onVerify: (passcode: string) => Promise<boolean>;
  onCancel: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  storyTitle,
  coverImage,
  onVerify,
  onCancel,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formattedCoverUrl = formatImageUrl(coverImage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the passcode.');
      return;
    }

    setSubmitting(true);
    setError('');

    const success = await onVerify(passcode);
    setSubmitting(false);

    if (!success) {
      setError('Incorrect passcode. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-paper-bg rounded-2xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[90vh] border border-paper-border">
        {formattedCoverUrl && (
          <div className="h-32 bg-stone-900 relative overflow-hidden">
            <img src={formattedCoverUrl} alt={storyTitle} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-300 bg-stone-900/80 px-2 py-0.5 rounded">
                Passcode Protected Story
              </span>
              <h3 className="text-white font-playfair font-bold truncate text-lg mt-1">{storyTitle}</h3>
            </div>
          </div>
        )}

        <div className="p-6 space-y-5">
          {!coverImage && (
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-stone-900">{storyTitle}</h3>
              <p className="text-xs text-stone-500">This story is private and requires an author passcode to unlock.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Enter Access Passcode
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2.5 rounded-md text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg font-medium text-sm hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-medium text-sm flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 transition"
              >
                <span>{submitting ? 'Verifying...' : 'Unlock Story'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
