import React from 'react';
import { BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-stone-200/60 bg-stone-50/50 py-12 text-stone-500 text-sm">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 text-stone-400">
          <BookOpen className="w-5 h-5 text-amber-900" />
          <span className="font-playfair text-stone-900 font-semibold tracking-wide">Phoenix-Scroll</span>
        </div>
        <p className="font-garamond italic text-base text-stone-600 max-w-lg mx-auto">
          “A book is a version of the world. If you do not like it, ignore it; or offer your own version in return.”
        </p>
        <div className="pt-4 border-t border-stone-200/40 text-xs text-stone-400 flex flex-col sm:flex-row justify-between items-center max-w-2xl mx-auto gap-2">
          <span>&copy; {new Date().getFullYear()} Phoenix-Scroll Publishing Platform. Private & Protected.</span>
          <span className="flex items-center gap-1">
            Crafted for immersive reading & writing
          </span>
        </div>
      </div>
    </footer>
  );
};
