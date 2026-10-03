import React from 'react';
import { useReader } from '../../context/ReaderContext';
import { ReaderFont, ReaderWidth } from '../../types';

interface RichContentRendererProps {
  content: string;
  isFirstPage?: boolean;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, isFirstPage = false }) => {
  const { settings } = useReader();

  const getFontFamilyClass = (font: ReaderFont) => {
    switch (font) {
      case 'garamond':
        return 'font-garamond';
      case 'lora':
        return 'font-lora';
      case 'playfair':
        return 'font-playfair';
      case 'sans':
        return 'font-sans';
      default:
        return 'font-garamond';
    }
  };

  const getMaxWidthClass = (width: ReaderWidth) => {
    switch (width) {
      case 'narrow':
        return 'max-w-xl';
      case 'medium':
        return 'max-w-2xl';
      case 'wide':
        return 'max-w-4xl';
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <div className={`mx-auto ${getMaxWidthClass(settings.contentWidth)} transition-all duration-300`}>
      <div
        className={`prose-reader ${isFirstPage ? 'chapter-first-page' : ''} ${getFontFamilyClass(settings.font)} leading-relaxed text-current`}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};
