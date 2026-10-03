import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper-bg flex flex-col items-center justify-center p-4 text-center space-y-4">
      <BookOpen className="w-12 h-12 text-stone-400" />
      <h1 className="font-playfair text-4xl font-bold text-stone-900">Page Not Found</h1>
      <p className="font-serif italic text-base text-stone-600 max-w-sm">
        The chapter or manuscript you are looking for appears to be missing from the sanctuary.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-amber-950 transition"
      >
        Return to Library
      </Link>
    </div>
  );
};
