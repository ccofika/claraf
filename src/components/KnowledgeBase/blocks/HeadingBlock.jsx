import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

const HeadingBlock = ({ block, content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const level = block.type.split('_')[1];
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const richText = useRichTextEditor({ onUpdate, externalEditorRef: editorRef });

  const headingStyles = {
    1: 'text-[48px] font-bold tracking-tight leading-[1.1] mt-12 mb-6',
    2: 'text-[34px] font-semibold tracking-tight leading-[1.15] mt-10 mb-5',
    3: 'text-[24px] font-semibold tracking-[-0.01em] leading-[1.2] mt-8 mb-4'
  };

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

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
            onMouseUp={richText.handleSelectionChange}
            onKeyUp={richText.handleSelectionChange}
            className={`kb-heading-editor w-full bg-transparent border-b-2 border-gray-200 dark:border-neutral-700
              focus:outline-none focus:border-blue-500 ${headingStyles[level]}
              text-gray-900 dark:text-white
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline`}
            data-placeholder={`Heading ${level}`}
            suppressContentEditableWarning
          />
          <RichTextToolbar {...richText} pageTree={pageTree} />
        </div>
        <style>{`
          .kb-heading-editor:empty:before {
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

  const Tag = `h${level}`;
  const hasHtml = /<[^>]+>/.test(content);

  if (hasHtml) {
    return (
      <>
        <Tag
          className={`${headingStyles[level]} text-gray-900 dark:text-white
            [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline`}
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <style>{textColorStyles}</style>
      </>
    );
  }

  return (
    <Tag className={`${headingStyles[level]} text-gray-900 dark:text-white`}>
      {content}
    </Tag>
  );
};

export default HeadingBlock;
