import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

const ToggleBlock = ({ content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const [isExpanded, setIsExpanded] = useState(false);
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const toggleData = typeof content === 'object' && content !== null
    ? content
    : { title: content || 'Toggle', body: '' };

  const bodyContent = toggleData.body || '';

  const handleBodyUpdate = useCallback((html) => {
    onUpdate?.({ ...toggleData, body: html });
  }, [onUpdate, toggleData]);

  const richText = useRichTextEditor({ onUpdate: handleBodyUpdate, externalEditorRef: editorRef });

  useEffect(() => {
    if (editorRef.current && isEditing && editorRef.current.innerHTML !== bodyContent) {
      editorRef.current.innerHTML = bodyContent;
    }
  }, [isEditing]);

  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== bodyContent) {
      editorRef.current.innerHTML = bodyContent;
    }
  }, [bodyContent, isFocused]);

  const handleInput = useCallback((e) => {
    handleBodyUpdate(e.target.innerHTML);
  }, [handleBodyUpdate]);

  if (isEditing) {
    return (
      <>
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
          <input
            type="text"
            value={toggleData.title || ''}
            onChange={(e) => onUpdate?.({ ...toggleData, title: e.target.value })}
            className="w-full px-3 py-2 text-[17px] font-medium text-gray-900 dark:text-white bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Toggle title..."
          />
          <div ref={richText.wrapperRef} style={{ position: 'relative' }}>
            <div
              ref={editorRef}
              contentEditable
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onInput={handleInput}
              onMouseUp={richText.handleSelectionChange}
              onKeyUp={richText.handleSelectionChange}
              className="kb-toggle-editor w-full p-3 text-[15px] leading-[1.6] text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24
                [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
              style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
              data-placeholder="Toggle content..."
              suppressContentEditableWarning
            />
            <RichTextToolbar {...richText} pageTree={pageTree} />
          </div>
        </div>
        <style>{`
          .kb-toggle-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  const hasHtmlBody = bodyContent && /<[^>]+>/.test(bodyContent);

  return (
    <>
      <div className="rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-1 py-1.5
            hover:bg-gray-50 dark:hover:bg-neutral-900/50 rounded-md transition-colors text-left"
        >
          <ChevronRight
            size={18}
            className={`flex-shrink-0 text-gray-400 dark:text-neutral-500 transition-transform duration-200
              ${isExpanded ? 'rotate-90' : ''}`}
          />
          <span className="text-[16px] font-medium text-gray-800 dark:text-neutral-200">
            {toggleData.title || 'Toggle'}
          </span>
        </button>

        {isExpanded && bodyContent && (
          <div className="pl-7 pt-1 pb-1">
            {hasHtmlBody ? (
              <div
                className="prose prose-gray dark:prose-invert max-w-none
                  text-[15px] leading-[1.7] text-gray-600 dark:text-neutral-400
                  [&_p]:mb-2 [&_p:last-child]:mb-0
                  [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
                  [&_code]:text-[13px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
                  [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
                style={{ whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: bodyContent }}
              />
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none
                text-[15px] leading-[1.7] text-gray-600 dark:text-neutral-400
                [&_p]:mb-2 [&_p:last-child]:mb-0
                [&_code]:text-[13px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
                [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {bodyContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
      {hasHtmlBody && <style>{textColorStyles}</style>}
    </>
  );
};

export default ToggleBlock;
