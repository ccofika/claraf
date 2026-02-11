import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

const ListBlock = ({ block, content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const isNumbered = block.type === 'numbered_list';
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const richText = useRichTextEditor({ onUpdate, externalEditorRef: editorRef });

  // Convert legacy array content to HTML string
  const contentToHtml = (c) => {
    if (!c) return '';
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      return c.map(item => typeof item === 'string' ? item : (item.text || '')).join('\n');
    }
    return '';
  };

  const htmlContent = contentToHtml(content);

  useEffect(() => {
    if (editorRef.current && isEditing && editorRef.current.innerHTML !== (htmlContent || '')) {
      editorRef.current.innerHTML = htmlContent || '';
    }
  }, [isEditing]);

  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== (htmlContent || '')) {
      editorRef.current.innerHTML = htmlContent || '';
    }
  }, [htmlContent, isFocused]);

  const handleInput = useCallback((e) => {
    onUpdate?.(e.target.innerHTML);
  }, [onUpdate]);

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
            onMouseUp={richText.handleSelectionChange}
            onKeyUp={richText.handleSelectionChange}
            className="kb-list-editor w-full p-3 text-[17px] leading-[1.7] text-gray-900 dark:text-white bg-transparent
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-24
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
            style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
            data-placeholder="Enter each item on a new line..."
            suppressContentEditableWarning
          />
          <RichTextToolbar {...richText} pageTree={pageTree} />
        </div>
        <style>{`
          .kb-list-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  // Parse content into list items
  const parseItems = (c) => {
    if (!c) return [];
    if (typeof c === 'string') {
      const hasHtml = /<[^>]+>/.test(c);
      if (hasHtml) {
        // Split on <br>, <div>, or newlines
        return c.split(/<br\s*\/?>|<\/div><div>|<\/div>|<div>|\n/)
          .map(item => item.trim())
          .filter(item => item);
      }
      return c.split('\n').filter(item => item.trim());
    }
    if (Array.isArray(c)) {
      return c.map(item => typeof item === 'string' ? item : (item.text || String(item))).filter(Boolean);
    }
    return [];
  };

  const items = parseItems(content);
  if (!items.length) return null;

  const ListTag = isNumbered ? 'ol' : 'ul';
  const hasHtmlItems = items.some(item => /<[^>]+>/.test(item));

  return (
    <>
      <ListTag className={`space-y-2 pl-6 ${isNumbered ? 'list-decimal' : 'list-disc'}`}>
        {items.map((item, index) => (
          hasHtmlItems ? (
            <li
              key={index}
              className="text-[17px] leading-[1.6] text-gray-700 dark:text-neutral-300
                pl-2 marker:text-gray-400 dark:marker:text-neutral-500
                [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ) : (
            <li
              key={index}
              className="text-[17px] leading-[1.6] text-gray-700 dark:text-neutral-300
                pl-2 marker:text-gray-400 dark:marker:text-neutral-500"
            >
              {item}
            </li>
          )
        ))}
      </ListTag>
      {hasHtmlItems && <style>{textColorStyles}</style>}
    </>
  );
};

export default ListBlock;
