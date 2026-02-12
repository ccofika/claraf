import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uploadKnowledgeBaseImage, generateImageId } from '../../../utils/imageUpload';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

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

const ParagraphBlock = ({ content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);

  // Shared rich text editor hook
  const richText = useRichTextEditor({ onUpdate, externalEditorRef: editorRef });

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
    onUpdate?.(e.target.innerHTML);
  }, [onUpdate]);

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
            onPaste={handlePaste}
            onClick={handleClick}
            onMouseUp={richText.handleSelectionChange}
            onKeyUp={richText.handleSelectionChange}
            className="kb-paragraph-editor w-full p-3 text-[17px] leading-[1.7] text-gray-900 dark:text-white
              bg-transparent border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
            style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
            data-placeholder="Write something... (Paste images with Ctrl+V)"
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
