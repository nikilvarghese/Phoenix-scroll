import React, { useState, useEffect, useRef } from 'react';
import { Chapter } from '../../types';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  SeparatorHorizontal,
  Image as ImageIcon,
  Save,
  Check,
  Eye,
  Edit,
  Clock,
  Code,
  Layers,
  Sparkles,
  X,
  Trash2,
  CaseSensitive,
} from 'lucide-react';
import { storyService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface RichChapterEditorProps {
  chapter: Chapter;
  onSaveChapter: (updated: Partial<Chapter>) => Promise<void>;
  saving?: boolean;
}

export const RichChapterEditor: React.FC<RichChapterEditorProps> = ({
  chapter,
  onSaveChapter,
  saving,
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [activeMode, setActiveMode] = useState<'visual' | 'code' | 'preview'>('visual');
  const [uploading, setUploading] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Part & Arc Modal State
  const [showPartModal, setShowPartModal] = useState(false);
  const [partLabel, setPartLabel] = useState('PART I');
  const [partTitle, setPartTitle] = useState('The Lie Called Despair');
  const [arcLabel, setArcLabel] = useState('ARC 1 — The Broken Boy');

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(chapter.title);
    setContent(chapter.content);
    if (editorRef.current && activeMode === 'visual') {
      editorRef.current.innerHTML = chapter.content || '';
    }
  }, [chapter._id]);

  const calculateWords = (htmlText: string) => {
    const clean = htmlText.replace(/<[^>]*>/g, ' ');
    return clean.trim().split(/\s+/).filter((w) => w.length > 0).length;
  };

  const wordCount = calculateWords(content);
  const estReadingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleExecCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInsertBlockquote = () => {
    document.execCommand('formatBlock', false, 'blockquote');
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInsertHr = () => {
    document.execCommand('insertHorizontalRule', false);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Toggle big drop cap initial letter on current or first paragraph
  const handleToggleDropCap = () => {
    if (activeMode === 'visual' && editorRef.current) {
      const selection = window.getSelection();
      let node = selection?.anchorNode;

      let pNode: HTMLElement | null = null;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'P') {
          pNode = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }

      if (!pNode) {
        pNode = editorRef.current.querySelector('p');
      }

      if (pNode) {
        if (pNode.classList.contains('dropcap')) {
          pNode.classList.remove('dropcap');
          pNode.classList.add('no-dropcap');
        } else if (pNode.classList.contains('no-dropcap')) {
          pNode.classList.remove('no-dropcap');
          pNode.classList.add('dropcap');
        } else {
          pNode.classList.add('dropcap');
        }
        setContent(editorRef.current.innerHTML);
      }
    } else {
      if (content.includes('class="dropcap"')) {
        setContent((prev) => prev.replace(/class="dropcap"/gi, 'class="no-dropcap"'));
      } else {
        setContent((prev) => prev.replace(/<p>/i, '<p class="dropcap">'));
      }
    }
  };

  const handleInsertPartBanner = () => {
    const bannerHtml = `
<div class="part-banner no-dropcap my-8 py-6 border-y border-amber-900/20 text-center">
  <span class="part-label text-xs uppercase font-bold tracking-widest text-amber-900 block font-sans">${partLabel || 'PART I'}</span>
  <h2 class="part-title font-playfair text-2xl font-bold text-stone-900 my-1">${partTitle || ''}</h2>
  <span class="arc-label text-sm font-serif italic text-amber-950 block">${arcLabel || ''}</span>
</div>
<p></p>
`;

    if (activeMode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, bannerHtml);
      setContent(editorRef.current.innerHTML);
    } else {
      setContent((prev) => bannerHtml + '\n' + prev);
    }

    setShowPartModal(false);
  };

  // Remove Part & Arc Banner cleanly if added accidentally
  const handleRemovePartBanner = () => {
    if (activeMode === 'visual' && editorRef.current) {
      const banners = editorRef.current.querySelectorAll('.part-banner');
      if (banners.length > 0) {
        banners.forEach((b) => b.remove());
        setContent(editorRef.current.innerHTML);
        showSuccess('Part & Arc Banner removed cleanly.');
      } else {
        showInfo('No Part & Arc Banner found in current chapter.');
      }
    } else {
      const cleaned = content.replace(/<div class="part-banner[\s\S]*?<\/div>/gi, '');
      setContent(cleaned);
      showSuccess('Part & Arc Banner removed.');
    }
    setShowPartModal(false);
  };

  // Automatically detect and convert plain PART / ARC text paragraphs into styled banners
  const handleFixRawPartText = () => {
    let newContent = content;

    // Matches pattern like <p>PART I</p><p>Title</p><p>ARC 1 ...</p>
    const regex = /<p>\s*(PART\s+[I|V|X|\d]+.*?)\s*<\/p>\s*<p>\s*(.*?)\s*<\/p>\s*<p>\s*(ARC\s+\d+.*?)\s*<\/p>/gi;

    newContent = newContent.replace(regex, (_match, p1, p2, p3) => {
      return `
<div class="part-banner no-dropcap my-8 py-6 border-y border-amber-900/20 text-center">
  <span class="part-label text-xs uppercase font-bold tracking-widest text-amber-900 block font-sans">${p1}</span>
  <h2 class="part-title font-playfair text-2xl font-bold text-stone-900 my-1">${p2}</h2>
  <span class="arc-label text-sm font-serif italic text-amber-950 block">${p3}</span>
</div>
`;
    });

    setContent(newContent);
    if (editorRef.current && activeMode === 'visual') {
      editorRef.current.innerHTML = newContent;
    }
    showSuccess('Part & Arc heading structure formatted successfully!');
  };

  const handleImageEmbed = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = await storyService.uploadImage(file);
      if (activeMode === 'visual' && editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertImage', false, data.url);
        setContent(editorRef.current.innerHTML);
      } else {
        const imgHtml = `\n<div style="text-align: center;" class="my-6">\n  <img src="${data.url}" alt="Illustration" class="rounded-lg shadow-md my-4 max-w-full inline-block" />\n</div>\n`;
        setContent((prev) => prev + imgHtml);
      }
    } catch {
      showError('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleVisualInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleManualSave = async () => {
    const finalContent = activeMode === 'visual' && editorRef.current ? editorRef.current.innerHTML : content;
    await onSaveChapter({ title, content: finalContent });
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  return (
    <div className="bg-paper-card rounded-2xl border border-paper-border/80 shadow-book overflow-hidden flex flex-col relative">
      {/* Editor Header */}
      <div className="p-4 sm:p-6 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chapter Title..."
            className="w-full font-playfair text-2xl font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-800 focus:outline-none py-1"
          />
          <div className="flex items-center space-x-3 text-xs text-stone-500 font-sans">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{wordCount} words (~{estReadingTime} min read)</span>
            </span>
            {lastSaved && (
              <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Saved at {lastSaved}</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab & Save Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-stone-200/70 p-1 rounded-lg flex items-center space-x-1">
            <button
              onClick={() => {
                setActiveMode('visual');
                setTimeout(() => {
                  if (editorRef.current) editorRef.current.innerHTML = content;
                }, 50);
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeMode === 'visual' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Visual Editor</span>
            </button>

            <button
              onClick={() => {
                if (activeMode === 'visual' && editorRef.current) {
                  setContent(editorRef.current.innerHTML);
                }
                setActiveMode('code');
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeMode === 'code' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="View Raw HTML Code"
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML Code</span>
            </button>

            <button
              onClick={() => {
                if (activeMode === 'visual' && editorRef.current) {
                  setContent(editorRef.current.innerHTML);
                }
                setActiveMode('preview');
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeMode === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reader Preview</span>
            </button>
          </div>

          <button
            onClick={handleManualSave}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Chapter'}</span>
          </button>
        </div>
      </div>

      {/* Visual Editor View (No Raw HTML Tags) */}
      {activeMode === 'visual' && (
        <div className="flex-1 flex flex-col min-h-[500px]">
          {/* Visual Rich Formatting Toolbar */}
          <div className="bg-stone-100/90 p-2 border-b border-stone-200 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleExecCommand('formatBlock', '<p>')}
              title="Normal Paragraph"
              className="px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 rounded transition"
            >
              Paragraph
            </button>

            <button
              type="button"
              onClick={() => handleExecCommand('formatBlock', '<h2>')}
              title="Heading 2"
              className="p-1.5 text-stone-700 hover:bg-stone-200 rounded transition"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleExecCommand('formatBlock', '<h3>')}
              title="Heading 3"
              className="p-1.5 text-stone-700 hover:bg-stone-200 rounded transition"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-stone-300 mx-1" />

            {/* Part & Arc Header Buttons */}
            <div className="flex items-center space-x-0.5 bg-amber-100/70 p-0.5 rounded-lg border border-amber-300/80">
              <button
                type="button"
                onClick={() => setShowPartModal(true)}
                title="Insert Part / Arc Banner Heading"
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-amber-950 hover:bg-amber-200/80 rounded transition"
              >
                <Layers className="w-3.5 h-3.5 text-amber-900" />
                <span>Part & Arc Banner</span>
              </button>
              <button
                type="button"
                onClick={handleRemovePartBanner}
                title="Remove Part & Arc Banner from chapter"
                className="p-1 text-red-700 hover:text-red-900 hover:bg-red-100 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleFixRawPartText}
              title="Auto-format typed PART / ARC lines into clean banner"
              className="p-1.5 text-amber-900 hover:bg-amber-200 rounded transition"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-stone-300 mx-1" />

            {/* Big Initial Letter Drop Cap Button */}
            <button
              type="button"
              onClick={handleToggleDropCap}
              title="Toggle Big Initial Letter (Drop Cap) on paragraph"
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-stone-800 bg-stone-200/60 hover:bg-stone-200 rounded transition border border-stone-300"
            >
              <CaseSensitive className="w-4 h-4 text-stone-900" />
              <span>Big First Letter</span>
            </button>

            <div className="h-4 w-px bg-stone-300 mx-1" />

            <button
              type="button"
              onClick={() => handleExecCommand('bold')}
              title="Bold Text"
              className="p-1.5 text-stone-700 hover:bg-stone-200 rounded transition font-bold"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleExecCommand('italic')}
              title="Italic Text"
              className="p-1.5 text-stone-700 hover:bg-stone-200 rounded transition italic"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleInsertBlockquote}
              title="Blockquote Quote"
              className="p-1.5 text-stone-700 hover:bg-stone-200 rounded transition"
            >
              <Quote className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleInsertHr}
              title="Scene Divider"
              className="p-1.5 text-stone-700 hover:bg-stone-200 rounded transition"
            >
              <SeparatorHorizontal className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-stone-300 mx-1" />

            <label
              title="Embed Illustration"
              className="p-1.5 text-stone-700 hover:bg-stone-200 rounded cursor-pointer relative transition"
            >
              <ImageIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageEmbed}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>

            {uploading && <span className="text-xs text-amber-800 animate-pulse ml-2 font-medium">Uploading image...</span>}
          </div>

          {/* Visual WYSIWYG Editable Area */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleVisualInput}
            onBlur={handleVisualInput}
            suppressContentEditableWarning
            className="w-full flex-1 p-6 sm:p-10 font-serif text-lg leading-relaxed text-stone-900 bg-paper-bg focus:outline-none min-h-[450px] prose-reader focus:ring-0 select-text"
          />
        </div>
      )}

      {/* Raw HTML Code View (Optional for advanced users) */}
      {activeMode === 'code' && (
        <div className="flex-1 flex flex-col min-h-[500px]">
          <div className="bg-stone-800 text-stone-300 p-2 text-xs font-mono flex items-center justify-between">
            <span>Raw HTML Editor</span>
            <button
              onClick={handleFixRawPartText}
              className="px-2 py-0.5 bg-amber-800 hover:bg-amber-900 text-white rounded text-[11px]"
            >
              Auto-Format Part/Arc Lines
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write HTML content..."
            className="w-full flex-1 p-6 font-mono text-sm leading-relaxed text-emerald-300 bg-stone-950 focus:outline-none resize-none border-none min-h-[450px]"
          />
        </div>
      )}

      {/* Reader Preview View */}
      {activeMode === 'preview' && (
        <div className="p-6 sm:p-12 bg-paper-warm min-h-[500px]">
          {(() => {
            const html = content || '';
            const match = html.match(/<div class="part-banner[\s\S]*?<\/div>/i);
            const partBannerHtml = match ? match[0] : null;
            const cleanContent = match ? html.replace(match[0], '').trim() : html;

            return (
              <div className="max-w-2xl mx-auto space-y-6">
                {partBannerHtml && (
                  <div
                    className="prose-reader text-center"
                    dangerouslySetInnerHTML={{ __html: partBannerHtml }}
                  />
                )}
                <div className="text-center space-y-2 pb-6 border-b border-stone-300/40">
                  <span className="text-xs uppercase font-bold tracking-widest text-amber-900 font-sans">
                    CHAPTER PREVIEW
                  </span>
                  <h2 className="font-playfair text-3xl font-bold text-stone-900">
                    {title || 'Untitled Chapter'}
                  </h2>
                </div>
                <div
                  className="prose-reader font-garamond text-xl leading-relaxed text-stone-800 space-y-4"
                  dangerouslySetInnerHTML={{ __html: cleanContent || '<p class="italic text-stone-400 text-center">Chapter is empty.</p>' }}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Insert Part & Arc Modal */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-900" />
                <h3 className="font-playfair text-lg font-bold text-stone-900">Insert Part & Arc Banner</h3>
              </div>
              <button
                onClick={() => setShowPartModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Part Label / Number</label>
                <input
                  type="text"
                  value={partLabel}
                  onChange={(e) => setPartLabel(e.target.value)}
                  placeholder="e.g. PART I"
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:border-amber-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Part Title</label>
                <input
                  type="text"
                  value={partTitle}
                  onChange={(e) => setPartTitle(e.target.value)}
                  placeholder="e.g. The Lie Called Despair"
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:border-amber-800 focus:outline-none font-serif text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Arc Label / Title</label>
                <input
                  type="text"
                  value={arcLabel}
                  onChange={(e) => setArcLabel(e.target.value)}
                  placeholder="e.g. ARC 1 — The Broken Boy"
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:border-amber-800 focus:outline-none italic font-serif"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-stone-200">
              <button
                type="button"
                onClick={handleRemovePartBanner}
                className="flex items-center space-x-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-xs border border-red-200 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Banner</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertPartBanner}
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white font-semibold rounded-lg text-xs shadow-xs"
                >
                  Insert Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
