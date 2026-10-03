import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ReaderSettings,
  ReaderTheme,
  ReaderFont,
  ReaderWidth,
  ReaderLayoutMode,
  ReaderPageLayout,
  ReaderPageAnimation,
} from '../types';

interface ReaderContextType {
  settings: ReaderSettings;
  setTheme: (theme: ReaderTheme) => void;
  setFont: (font: ReaderFont) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setContentWidth: (width: ReaderWidth) => void;
  setLayoutMode: (mode: ReaderLayoutMode) => void;
  setPageLayout: (layout: ReaderPageLayout) => void;
  setPageAnimation: (animation: ReaderPageAnimation) => void;
  resetSettings: () => void;
}

const getDefaultLayoutMode = (): ReaderLayoutMode => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 640 ? 'scroll' : 'book';
  }
  return 'book';
};

const getBaseDefaultSettings = (): ReaderSettings => ({
  theme: 'parchment',
  font: 'garamond',
  fontSize: 18,
  lineHeight: 1.7,
  contentWidth: 'medium',
  layoutMode: getDefaultLayoutMode(),
  pageLayout: 'auto',
  pageAnimation: 'flip',
});

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const defaults = getBaseDefaultSettings();
    const saved = localStorage.getItem('aurabook_reader_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('aurabook_reader_settings', JSON.stringify(settings));
  }, [settings]);

  const setTheme = (theme: ReaderTheme) => setSettings((s) => ({ ...s, theme }));
  const setFont = (font: ReaderFont) => setSettings((s) => ({ ...s, font }));
  const setFontSize = (fontSize: number) => setSettings((s) => ({ ...s, fontSize }));
  const setLineHeight = (lineHeight: number) => setSettings((s) => ({ ...s, lineHeight }));
  const setContentWidth = (contentWidth: ReaderWidth) => setSettings((s) => ({ ...s, contentWidth }));
  const setLayoutMode = (layoutMode: ReaderLayoutMode) => setSettings((s) => ({ ...s, layoutMode }));
  const setPageLayout = (pageLayout: ReaderPageLayout) => setSettings((s) => ({ ...s, pageLayout }));
  const setPageAnimation = (pageAnimation: ReaderPageAnimation) => setSettings((s) => ({ ...s, pageAnimation }));
  const resetSettings = () => setSettings(getBaseDefaultSettings());

  return (
    <ReaderContext.Provider
      value={{
        settings,
        setTheme,
        setFont,
        setFontSize,
        setLineHeight,
        setContentWidth,
        setLayoutMode,
        setPageLayout,
        setPageAnimation,
        resetSettings,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
};

export const useReader = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
};
