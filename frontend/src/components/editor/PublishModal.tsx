import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, Eye, Share2, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Story } from '../../types';

interface PublishModalProps {
  story: Story;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ story, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    // Trigger confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  }, []);

  const storyUrl = `${window.location.origin}/read/${story._id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-paper-bg rounded-2xl p-5 sm:p-8 max-w-lg w-full border border-paper-border shadow-2xl space-y-6 text-center overflow-y-auto max-h-[90vh]">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            Story Published!
          </span>
          <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-stone-900 pt-2">
            “{story.title}”
          </h3>
          <p className="text-sm text-stone-600 font-sans">
            Your story is now published and ready for readers to experience.
          </p>
        </div>

        {/* Shareable Link Box */}
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-left">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Shareable Reader Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={storyUrl}
              className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-mono text-stone-800 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100 transition"
          >
            Back to Studio
          </button>
          <Link
            to={`/read/${story._id}`}
            className="flex-1 py-2.5 px-4 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm transition"
          >
            <Eye className="w-4 h-4" />
            <span>Read Story Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
