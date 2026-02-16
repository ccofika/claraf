import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uploadKnowledgeBaseImage, generateImageId } from '../../../utils/imageUpload';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

// ═══════════════════════════════════════════════════
// Slash command block options
// ═══════════════════════════════════════════════════
const slashCommandOptions = [
  { type: 'heading_1', label: 'Heading 1', keywords: 'h1 heading title large', icon: '𝐇₁' },
  { type: 'heading_2', label: 'Heading 2', keywords: 'h2 heading subtitle', icon: '𝐇₂' },
  { type: 'heading_3', label: 'Heading 3', keywords: 'h3 heading small', icon: '𝐇₃' },
  { type: 'bulleted_list', label: 'Bullet List', keywords: 'bullet list ul unordered', icon: '•' },
  { type: 'numbered_list', label: 'Numbered List', keywords: 'number list ol ordered', icon: '1.' },
  { type: 'toggle', label: 'Toggle', keywords: 'toggle collapse expand', icon: '▸' },
  { type: 'callout', label: 'Callout', keywords: 'callout info warning alert note', icon: '💡' },
  { type: 'quote', label: 'Quote', keywords: 'quote blockquote', icon: '❝' },
  { type: 'code', label: 'Code Block', keywords: 'code snippet programming', icon: '</>' },
  { type: 'divider', label: 'Divider', keywords: 'divider line separator hr', icon: '—' },
  { type: 'image', label: 'Image', keywords: 'image picture photo', icon: '🖼' },
  { type: 'table', label: 'Table', keywords: 'table grid spreadsheet', icon: '⊞' },
  { type: 'video', label: 'Video', keywords: 'video youtube embed', icon: '▶' },
  { type: 'audio', label: 'Audio', keywords: 'audio music sound', icon: '🎵' },
  { type: 'embed', label: 'Embed', keywords: 'embed iframe website', icon: '🔗' },
  { type: 'bookmark', label: 'Bookmark', keywords: 'bookmark link preview', icon: '🔖' },
  { type: 'equation', label: 'Equation', keywords: 'equation math latex formula', icon: '∑' },
  { type: 'button', label: 'Button', keywords: 'button link cta action', icon: '🔘' },
  { type: 'columns', label: 'Columns', keywords: 'columns layout side by side', icon: '⫼' },
  { type: 'collapsible_heading', label: 'Collapsible Section', keywords: 'collapsible fold accordion section', icon: '▼' },
  { type: 'table_of_contents', label: 'Table of Contents', keywords: 'toc contents navigation', icon: '📑' },
  { type: 'file', label: 'File', keywords: 'file attachment upload document', icon: '📎' },
  { type: 'pdf', label: 'PDF', keywords: 'pdf document viewer', icon: '📄' },
];

// Image Lightbox Component
const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 cursor-pointer z-[99999]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg cursor-default"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
        Click outside or press ESC to close
      </div>
    </div>,
    document.body
  );
};

// Caption Input Modal for images
const CaptionModal = ({ onSave, onCancel, initialCaption = '' }) => {
  const [caption, setCaption] = useState(initialCaption);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(caption);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99998]"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-4 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Add Image Caption (optional)
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700
            border border-gray-200 dark:border-neutral-600 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter caption..."
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400
              hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onSave(caption)}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700
              rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ParagraphBlock = ({ content, isEditing, onUpdate, onConvertBlock, onCreateBlockBelow, onDeleteEmptyBlock }) => {
  const { pageTree } = useKnowledgeBase();
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [slashMenu, setSlashMenu] = useState(null); // { query: string, position: { top, left } }
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const slashMenuRef = useRef(null);

  // Shared rich text editor hook
  const richText = useRichTextEditor({ onUpdate, externalEditorRef: editorRef });

  // Filtered slash command options
  const filteredSlashOptions = useMemo(() => {
    if (!slashMenu) return [];
    const q = (slashMenu.query || '').toLowerCase().trim();
    if (!q) return slashCommandOptions;
    return slashCommandOptions.filter(opt =>
      opt.label.toLowerCase().includes(q) ||
      opt.keywords.toLowerCase().includes(q) ||
      opt.type.includes(q)
    );
  }, [slashMenu]);

  // Reset selected index when query changes
  useEffect(() => {
    setSlashSelectedIndex(0);
  }, [slashMenu?.query]);

  // Scroll selected item into view
  useEffect(() => {
    if (slashMenuRef.current && slashMenu) {
      const selected = slashMenuRef.current.querySelector('[data-slash-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [slashSelectedIndex, slashMenu]);

  // Close slash menu on outside click
  useEffect(() => {
    if (!slashMenu) return;
    const handleOutsideClick = (e) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target) && editorRef.current && !editorRef.current.contains(e.target)) {
        setSlashMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [slashMenu]);

  // Initialize editor with HTML content
  useEffect(() => {
    if (editorRef.current && isEditing && editorRef.current.innerHTML !== (content || '')) {
      editorRef.current.innerHTML = content || '';
    }
  }, [isEditing]);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== (content || '')) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content, isFocused]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return null;
    }

    try {
      const loadingToast = toast.loading('Uploading image...');
      const result = await uploadKnowledgeBaseImage(file);
      toast.dismiss(loadingToast);
      toast.success('Image uploaded!');
      return result;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    }
  }, []);

  // Insert image at cursor position
  const insertImageAtCursor = useCallback((imageData, caption = '') => {
    if (!editorRef.current) return;

    if (!richText.restoreSelection()) {
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        editorRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    const brBefore = document.createElement('br');
    range.insertNode(brBefore);
    range.setStartAfter(brBefore);

    const imgContainer = document.createElement('span');
    imgContainer.className = 'kb-inline-image-container';
    imgContainer.style.cssText = 'display: block; position: relative; margin: 12px 0; text-align: center;';

    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = caption || 'Uploaded image';
    img.className = 'kb-inline-image';
    img.style.cssText = `
      max-width: 100%;
      max-height: 400px;
      width: auto;
      height: auto;
      border-radius: 8px;
      cursor: pointer;
      object-fit: contain;
      border: 1px solid rgba(0,0,0,0.1);
    `;

    const imageId = generateImageId();
    img.setAttribute('data-image-id', imageId);
    img.setAttribute('data-public-id', imageData.publicId || '');
    img.setAttribute('data-full-url', imageData.url);
    img.setAttribute('data-width', imageData.width || '');
    img.setAttribute('data-height', imageData.height || '');

    imgContainer.appendChild(img);

    if (caption) {
      const captionEl = document.createElement('p');
      captionEl.className = 'kb-image-caption';
      captionEl.textContent = caption;
      captionEl.style.cssText = `
        margin: 8px 0 0 0;
        font-size: 13px;
        color: #6b7280;
        font-style: italic;
        text-align: center;
      `;
      imgContainer.appendChild(captionEl);
    }

    range.insertNode(imgContainer);

    const brAfter = document.createElement('br');
    imgContainer.parentNode.insertBefore(brAfter, imgContainer.nextSibling);

    range.setStartAfter(brAfter);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    onUpdate?.(editorRef.current.innerHTML);
  }, [onUpdate, richText.restoreSelection]);

  const handleCaptionSave = useCallback((caption) => {
    if (pendingImage) {
      insertImageAtCursor(pendingImage, caption);
      setPendingImage(null);
    }
  }, [pendingImage, insertImageAtCursor]);

  const handleCaptionCancel = useCallback(() => {
    if (pendingImage) {
      insertImageAtCursor(pendingImage, '');
      setPendingImage(null);
    }
  }, [pendingImage, insertImageAtCursor]);

  const handlePaste = useCallback(async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    let imageFile = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (imageFile) {
      e.preventDefault();
      richText.saveSelection();
      const imageData = await handleImageUpload(imageFile);
      if (imageData) {
        setPendingImage(imageData);
      }
    }
  }, [handleImageUpload, richText.saveSelection]);

  const handleInput = useCallback((e) => {
    const html = e.target.innerHTML;
    onUpdate?.(html);

    // Detect slash command: "/" at the start of an otherwise empty block
    const text = (e.target.textContent || '').trim();
    if (text.startsWith('/') && text.length <= 30 && text.indexOf('\n') === -1) {
      const query = text.slice(1);
      // Get caret position for menu placement
      const sel = window.getSelection();
      if (sel.rangeCount) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.top > 0) {
          setSlashMenu({ query, position: { top: rect.bottom + 4, left: rect.left } });
          return;
        }
      }
    }
    setSlashMenu(null);
  }, [onUpdate]);

  // Handle keyboard events for slash menu and block shortcuts
  const handleKeyDown = useCallback((e) => {
    // Slash menu navigation
    if (slashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex(i => Math.min(i + 1, filteredSlashOptions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredSlashOptions[slashSelectedIndex];
        if (selected && onConvertBlock) {
          onConvertBlock(selected.type);
        }
        setSlashMenu(null);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenu(null);
        return;
      }
      // Tab to select (like autocomplete)
      if (e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredSlashOptions[slashSelectedIndex];
        if (selected && onConvertBlock) {
          onConvertBlock(selected.type);
        }
        setSlashMenu(null);
        return;
      }
    }

    // Enter on empty paragraph → create new paragraph below
    if (e.key === 'Enter' && !e.shiftKey) {
      const text = (editorRef.current?.textContent || '').trim();
      if (!text && onCreateBlockBelow) {
        e.preventDefault();
        onCreateBlockBelow();
        return;
      }
    }

    // Backspace on empty paragraph → delete block
    if (e.key === 'Backspace') {
      const text = (editorRef.current?.textContent || '').trim();
      const html = (editorRef.current?.innerHTML || '').trim();
      // Only delete if truly empty (no text, no images, no content)
      if (!text && (!html || html === '<br>' || html === '') && onDeleteEmptyBlock) {
        e.preventDefault();
        onDeleteEmptyBlock();
        return;
      }
    }
  }, [slashMenu, filteredSlashOptions, slashSelectedIndex, onConvertBlock, onCreateBlockBelow, onDeleteEmptyBlock]);

  const handleClick = useCallback((e) => {
    const target = e.target;
    if (target.tagName === 'IMG' && target.classList.contains('kb-inline-image')) {
      e.preventDefault();
      const fullUrl = target.getAttribute('data-full-url') || target.src;
      setLightboxImage({ src: fullUrl, alt: target.alt });
    }
  }, []);

  if (isEditing) {
    return (
      <>
        <div ref={richText.wrapperRef} style={{ position: 'relative' }}>
          <div
            ref={editorRef}
            contentEditable
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onClick={handleClick}
            onMouseUp={richText.handleSelectionChange}
            onKeyUp={richText.handleSelectionChange}
            className="kb-paragraph-editor w-full p-3 text-[17px] leading-[1.7] text-gray-900 dark:text-white
              bg-transparent border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
            style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
            data-placeholder="Write something... Type / for commands"
            suppressContentEditableWarning
          />

          <RichTextToolbar {...richText} pageTree={pageTree} />
        </div>

        {pendingImage && (
          <CaptionModal
            onSave={handleCaptionSave}
            onCancel={handleCaptionCancel}
          />
        )}

        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}

        {/* Slash Command Menu */}
        {slashMenu && filteredSlashOptions.length > 0 && createPortal(
          <div
            ref={slashMenuRef}
            className="fixed z-[99990] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
              rounded-xl shadow-2xl overflow-hidden"
            style={{ top: slashMenu.position.top, left: slashMenu.position.left, width: 260 }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500
              border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/50">
              Blocks {slashMenu.query && <span className="text-blue-500 normal-case">— "{slashMenu.query}"</span>}
            </div>
            <div className="overflow-y-auto max-h-[320px] py-1">
              {filteredSlashOptions.map((opt, i) => (
                <button
                  key={opt.type}
                  data-slash-selected={i === slashSelectedIndex ? 'true' : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Don't blur the editor
                    if (onConvertBlock) onConvertBlock(opt.type);
                    setSlashMenu(null);
                  }}
                  onMouseEnter={() => setSlashSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-colors ${
                    i === slashSelectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-7 h-7 flex items-center justify-center text-base bg-gray-100 dark:bg-neutral-800 rounded-md shrink-0">
                    {opt.icon}
                  </span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
        {slashMenu && filteredSlashOptions.length === 0 && createPortal(
          <div
            className="fixed z-[99990] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
              rounded-xl shadow-2xl overflow-hidden"
            style={{ top: slashMenu.position.top, left: slashMenu.position.left, width: 260 }}
          >
            <div className="px-3 py-4 text-[13px] text-gray-400 dark:text-neutral-500 text-center">
              No matching blocks
            </div>
          </div>,
          document.body
        )}

        <style>{`
          .kb-paragraph-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  // View mode
  if (!content) return null;

  const hasHtml = /<[^>]+>/.test(content);

  if (hasHtml) {
    return (
      <>
        <div
          className="kb-paragraph-view prose prose-gray dark:prose-invert max-w-none
            text-[16px] leading-[1.75] text-gray-600 dark:text-neutral-400
            [&_p]:mb-3 [&_strong]:text-gray-800 [&_strong]:dark:text-neutral-200 [&_strong]:font-semibold
            [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 [&_a]:hover:decoration-blue-600
            [&_code]:text-[13.5px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
            [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-rose-500 [&_code]:dark:text-rose-400"
          style={{ whiteSpace: 'pre-wrap' }}
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}

        <style>{`
          .kb-paragraph-view .kb-image-caption {
            margin: 8px 0 0 0;
            font-size: 13px;
            color: #6b7280;
            font-style: italic;
            text-align: center;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  const preservedContent = content.replace(/\n/g, '  \n');

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none
      text-[16px] leading-[1.75] text-gray-600 dark:text-neutral-400
      [&_p]:mb-3 [&_strong]:text-gray-800 [&_strong]:dark:text-neutral-200 [&_strong]:font-semibold
      [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 [&_a]:hover:decoration-blue-600
      [&_code]:text-[13.5px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
      [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-rose-500 [&_code]:dark:text-rose-400">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {preservedContent}
      </ReactMarkdown>
    </div>
  );
};

export default ParagraphBlock;
