import React from 'react';
import { useReader } from '../../context/ReaderContext';
import { X, Type, Layout, Sun, Moon, Sparkles, RefreshCw, BookOpen, Layers } from 'lucide-react';
import { ReaderTheme, ReaderFont, ReaderWidth, ReaderLayoutMode, ReaderPageLayout, ReaderPageAnimation } from '../../types';

interface ReadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
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
  } = useReader();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 sm:p-8 max-w-lg w-full border border-stone-800 shadow-2xl my-auto max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-playfair text-lg sm:text-xl font-bold">Book Reader Customization</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">

        {/* 1. Layout Mode Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
            Reading Experience Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLayoutMode('book')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                settings.layoutMode === 'book'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-800/60 border-stone-700 text-stone-300'
              }`}
            >
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="text-xs">Interactive Book Pages</span>
            </button>

            <button
              onClick={() => setLayoutMode('scroll')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                settings.layoutMode === 'scroll'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-800/60 border-stone-700 text-stone-300'
              }`}
            >
              <Layers className="w-5 h-5 text-amber-400" />
              <span className="text-xs">Continuous Scroll</span>
            </button>
          </div>
        </div>

        {/* 2. Book Spread Layout (if in book mode) */}
        {settings.layoutMode === 'book' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
                Book Spread Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'dual', 'single'] as ReaderPageLayout[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setPageLayout(l)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition ${
                      settings.pageLayout === l
                        ? 'bg-amber-900 border-amber-500 text-amber-100'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    {l === 'auto' ? 'Auto (Responsive)' : l === 'dual' ? '2-Page Open Spread' : 'Single Page'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
                Page Flip Animation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['flip', 'slide', 'fade'] as ReaderPageAnimation[]).map((anim) => (
                  <button
                    key={anim}
                    onClick={() => setPageAnimation(anim)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition ${
                      settings.pageAnimation === anim
                        ? 'bg-amber-900 border-amber-500 text-amber-100'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    {anim === 'flip' ? '3D Book Flip' : anim === 'slide' ? 'Slide Page' : 'Fade Transition'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Theme Engine */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
            Paper & Ambient Theme
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setTheme('parchment')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                settings.theme === 'parchment' ? 'ring-2 ring-amber-400 border-transparent' : 'border-stone-800'
              } bg-[#FBF7EE] text-[#2C2523]`}
            >
              <Sun className="w-4 h-4 text-amber-700" />
              <span className="text-[10px] font-bold">Parchment</span>
            </button>

            <button
              onClick={() => setTheme('night')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                settings.theme === 'night' ? 'ring-2 ring-amber-400 border-transparent' : 'border-stone-800'
              } bg-[#121316] text-[#E2E8F0]`}
            >
              <Moon className="w-4 h-4 text-slate-300" />
              <span className="text-[10px] font-bold">Night</span>
            </button>

            <button
              onClick={() => setTheme('sepia')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                settings.theme === 'sepia' ? 'ring-2 ring-amber-400 border-transparent' : 'border-stone-800'
              } bg-[#F4ECD8] text-[#3D3126]`}
            >
              <Sparkles className="w-4 h-4 text-amber-800" />
              <span className="text-[10px] font-bold">Sepia</span>
            </button>

            <button
              onClick={() => setTheme('paper')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                settings.theme === 'paper' ? 'ring-2 ring-amber-400 border-transparent' : 'border-stone-800'
              } bg-[#F9FAFB] text-[#1E293B]`}
            >
              <Layout className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] font-bold">Paper</span>
            </button>
          </div>
        </div>

        {/* 4. Typeface Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
            Book Typeface
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFont('garamond')}
              className={`p-2.5 rounded-xl border text-center transition font-garamond text-base ${
                settings.font === 'garamond'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-800/60 border-stone-700 text-stone-300'
              }`}
            >
              EB Garamond
            </button>

            <button
              onClick={() => setFont('lora')}
              className={`p-2.5 rounded-xl border text-center transition font-lora text-base ${
                settings.font === 'lora'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-800/60 border-stone-700 text-stone-300'
              }`}
            >
              Lora
            </button>

            <button
              onClick={() => setFont('playfair')}
              className={`p-2.5 rounded-xl border text-center transition font-playfair text-base ${
                settings.font === 'playfair'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-800/60 border-stone-700 text-stone-300'
              }`}
            >
              Playfair
            </button>

            <button
              onClick={() => setFont('sans')}
              className={`p-2.5 rounded-xl border text-center transition font-sans text-sm ${
                settings.font === 'sans'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-800/60 border-stone-700 text-stone-300'
              }`}
            >
              Inter Sans
            </button>
          </div>
        </div>

        {/* 5. Font Size & Line Height Sliders */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-stone-300 font-medium">
              <span>Text Size</span>
              <span className="font-mono text-amber-400">{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="26"
              step="1"
              value={settings.fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-stone-300 font-medium">
              <span>Line Spacing</span>
              <span className="font-mono text-amber-400">{settings.lineHeight}</span>
            </div>
            <input
              type="range"
              min="1.4"
              max="2.2"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 6. Column Width */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
            Reading Width
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['narrow', 'medium', 'wide'] as ReaderWidth[]).map((w) => (
              <button
                key={w}
                onClick={() => setContentWidth(w)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition ${
                  settings.contentWidth === w
                    ? 'bg-amber-900 border-amber-500 text-amber-100'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        </div>

        {/* Fixed Footer Reset */}
        <div className="pt-3 border-t border-stone-800 flex justify-between items-center text-xs shrink-0">
          <button
            onClick={resetSettings}
            className="text-stone-400 hover:text-white flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
