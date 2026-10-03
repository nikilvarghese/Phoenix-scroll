import React, { useState, useEffect } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnimatedBookmarkProps {
  scrollPercentage: number;
  onBookmarkClick?: () => void;
}

export const AnimatedBookmark: React.FC<AnimatedBookmarkProps> = ({
  scrollPercentage,
  onBookmarkClick,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);
      setJustSaved(false);

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setIsScrolling(false);
        setJustSaved(true);

        // Hide "Saved" indicator after 1.5s
        setTimeout(() => setJustSaved(false), 1500);
      }, 180);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  const roundedPct = Math.round(scrollPercentage);

  // Dynamic vertical placement along left viewport edge (between top 85px and bottom 85px)
  const topPercent = 10 + (scrollPercentage * 0.75); // 10% to 85% of screen height

  return (
    <div
      className="fixed left-2 sm:left-6 z-30 pointer-events-auto transition-all duration-300 ease-out select-none"
      style={{ top: `${topPercent}%` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.button
        onClick={onBookmarkClick}
        aria-label={`Bookmark at ${roundedPct}%`}
        animate={{
          y: isScrolling ? -12 : 0,
          rotate: isScrolling ? -10 : 0,
          scale: isScrolling ? 1.08 : 1,
          boxShadow: isScrolling
            ? '0 20px 25px -5px rgba(120, 53, 15, 0.4), 0 8px 10px -6px rgba(120, 53, 15, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: isScrolling ? 15 : 20,
        }}
        className="group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-r-xl bg-gradient-to-r from-amber-950 via-amber-900 to-amber-800 text-amber-100 border-y border-r border-amber-600/40 shadow-xl cursor-pointer hover:border-amber-400/80 transition-colors"
      >
        {/* Decorative Left Ribbon Notch Line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-r-full shadow-xs" />

        {/* Animated Bookmark Icon */}
        <div className="relative flex items-center justify-center">
          {justSaved ? (
            <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
          ) : (
            <Bookmark
              className={`w-4 h-4 transition-transform duration-200 ${
                isScrolling ? 'text-amber-300 fill-amber-300/30' : 'text-amber-400 fill-amber-400'
              }`}
            />
          )}
        </div>

        {/* Percentage Label */}
        <span className="text-xs font-mono font-bold tracking-tight text-amber-200">
          {roundedPct}%
        </span>

        {/* Ribbon Tail Effect */}
        <div className="absolute -bottom-2 left-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-950/80 pointer-events-none" />

        {/* Tooltip on Hover */}
        {(showTooltip || isScrolling) && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-stone-900/95 text-amber-100 text-[11px] font-sans whitespace-nowrap border border-stone-700 shadow-xl pointer-events-none flex items-center gap-1.5"
          >
            <span>{isScrolling ? 'Lifting bookmark...' : `Bookmark set at ${roundedPct}%`}</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};
