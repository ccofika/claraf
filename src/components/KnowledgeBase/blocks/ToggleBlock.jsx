import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

const headerColorOptions = [
  { key: '', label: 'Default', swatch: 'bg-gray-200 dark:bg-neutral-600' },
  { key: 'blue', label: 'Blue', swatch: 'bg-blue-200 dark:bg-blue-800' },
  { key: 'green', label: 'Green', swatch: 'bg-emerald-200 dark:bg-emerald-800' },
  { key: 'amber', label: 'Amber', swatch: 'bg-amber-200 dark:bg-amber-800' },
  { key: 'red', label: 'Red', swatch: 'bg-red-200 dark:bg-red-800' },
  { key: 'purple', label: 'Purple', swatch: 'bg-purple-200 dark:bg-purple-800' },
  { key: 'cyan', label: 'Cyan', swatch: 'bg-cyan-200 dark:bg-cyan-800' },
];

const headerBgClasses = {
  '': 'hover:bg-gray-50 dark:hover:bg-neutral-900/50',
  'blue': 'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30',
  'green': 'bg-emerald-50/60 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
  'amber': 'bg-amber-50/60 dark:bg-amber-900/20 hover:bg-amber-50 dark:hover:bg-amber-900/30',
  'red': 'bg-red-50/60 dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/30',
  'purple': 'bg-purple-50/60 dark:bg-purple-900/20 hover:bg-purple-50 dark:hover:bg-purple-900/30',
  'cyan': 'bg-cyan-50/60 dark:bg-cyan-900/20 hover:bg-cyan-50 dark:hover:bg-cyan-900/30',
};

const ToggleBlock = ({ block, content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const defaultOpen = block.properties?.defaultOpen || false;
  const customIcon = block.properties?.customIcon || '';
  const headerColor = block.properties?.headerColor || '';
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
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

  const updateProperty = useCallback((key, value) => {
    const event = new CustomEvent('kb-block-property-update', {
      detail: { blockId: block.id, properties: { ...block.properties, [key]: value } }
    });
    document.dispatchEvent(event);
  }, [block.id, block.properties]);

  if (isEditing) {
    return (
      <>
        {/* Settings bar */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Default open/closed */}
          <button
            onClick={() => updateProperty('defaultOpen', !defaultOpen)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors
              ${defaultOpen
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'
              }`}
          >
            Default: {defaultOpen ? 'Open' : 'Closed'}
          </button>

          {/* Custom icon */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-500 dark:text-neutral-400">Icon:</span>
            <input
              type="text"
              value={customIcon}
              onChange={(e) => updateProperty('customIcon', e.target.value)}
              className="w-10 px-1 py-0.5 text-center text-lg bg-gray-100 dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded
                focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="▸"
            />
          </div>

          {/* Header color */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-500 dark:text-neutral-400">Color:</span>
            {headerColorOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => updateProperty('headerColor', opt.key)}
                className={`w-4 h-4 rounded border transition-all
                  ${opt.swatch}
                  ${headerColor === opt.key ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-neutral-900' : 'border-gray-300 dark:border-neutral-600'}
                `}
                title={opt.label}
              />
            ))}
          </div>
        </div>

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
  const headerBg = headerBgClasses[headerColor] || headerBgClasses[''];

  return (
    <>
      <div className="rounded-xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center gap-2 px-2 py-2
            rounded-lg transition-colors text-left ${headerBg}`}
        >
          {customIcon ? (
            <span className={`flex-shrink-0 text-base transition-transform duration-200
              ${isExpanded ? 'rotate-90' : ''}`}>{customIcon}</span>
          ) : (
            <ChevronRight
              size={18}
              className={`flex-shrink-0 text-gray-400 dark:text-neutral-500 transition-transform duration-200
                ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
          <span className="text-[16px] font-medium text-gray-800 dark:text-neutral-200">
            {toggleData.title || 'Toggle'}
          </span>
        </button>

        {isExpanded && bodyContent && (
          <div className="pl-7 pt-2 pb-2">
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
