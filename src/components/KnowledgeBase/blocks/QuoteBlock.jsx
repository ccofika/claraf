import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

const QuoteBlock = ({ content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const richText = useRichTextEditor({ onUpdate, externalEditorRef: editorRef });

  useEffect(() => {
    if (editorRef.current && isEditing && editorRef.current.innerHTML !== (content || '')) {
      editorRef.current.innerHTML = content || '';
    }
  }, [isEditing]);

  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== (content || '')) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content, isFocused]);

  const handleInput = useCallback((e) => {
    onUpdate?.(e.target.innerHTML);
  }, [onUpdate]);

  if (isEditing) {
    return (
      <>
        <div className="border-l-[3px] border-gray-300 dark:border-neutral-600 pl-5 py-1">
          <div ref={richText.wrapperRef} style={{ position: 'relative' }}>
            <div
              ref={editorRef}
              contentEditable
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onInput={handleInput}
              onMouseUp={richText.handleSelectionChange}
              onKeyUp={richText.handleSelectionChange}
              className="kb-quote-editor w-full bg-transparent text-[16px] leading-[1.7] text-gray-500 dark:text-neutral-400 italic
                focus:outline-none min-h-16
                [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:not-italic"
              style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
              data-placeholder="Quote text..."
              suppressContentEditableWarning
            />
            <RichTextToolbar {...richText} pageTree={pageTree} />
          </div>
        </div>
        <style>{`
          .kb-quote-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  if (!content) return null;

  const hasHtml = /<[^>]+>/.test(content);

  if (hasHtml) {
    return (
      <>
        <blockquote className="border-l-[3px] border-gray-300 dark:border-neutral-600 pl-5 py-1">
          <div
            className="text-[16px] leading-[1.7] text-gray-500 dark:text-neutral-400 italic
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:not-italic"
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </blockquote>
        <style>{textColorStyles}</style>
      </>
    );
  }

  return (
    <blockquote className="border-l-[3px] border-gray-300 dark:border-neutral-600 pl-5 py-1">
      <p className="text-[16px] leading-[1.7] text-gray-500 dark:text-neutral-400 italic"
        style={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </p>
    </blockquote>
  );
};

export default QuoteBlock;
