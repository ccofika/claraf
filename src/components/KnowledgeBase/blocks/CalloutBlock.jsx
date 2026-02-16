import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle, Lightbulb, Flame, Zap, BookOpen, Star, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

const calloutStyles = {
  info: {
    bg: 'bg-blue-50/70 dark:bg-blue-950/30',
    border: 'border-l-[3px] border-blue-400',
    icon: Info,
    iconColor: 'text-blue-500 dark:text-blue-400',
    label: 'Info', dot: 'bg-blue-400'
  },
  warning: {
    bg: 'bg-amber-50/70 dark:bg-amber-950/30',
    border: 'border-l-[3px] border-amber-400',
    icon: AlertTriangle,
    iconColor: 'text-amber-500 dark:text-amber-400',
    label: 'Warning', dot: 'bg-amber-400'
  },
  error: {
    bg: 'bg-red-50/70 dark:bg-red-950/30',
    border: 'border-l-[3px] border-red-400',
    icon: AlertCircle,
    iconColor: 'text-red-500 dark:text-red-400',
    label: 'Error', dot: 'bg-red-400'
  },
  success: {
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    border: 'border-l-[3px] border-emerald-400',
    icon: CheckCircle,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    label: 'Success', dot: 'bg-emerald-400'
  },
  tip: {
    bg: 'bg-violet-50/70 dark:bg-violet-950/30',
    border: 'border-l-[3px] border-violet-400',
    icon: Lightbulb,
    iconColor: 'text-violet-500 dark:text-violet-400',
    label: 'Tip', dot: 'bg-violet-400'
  },
  important: {
    bg: 'bg-rose-50/70 dark:bg-rose-950/30',
    border: 'border-l-[3px] border-rose-400',
    icon: Flame,
    iconColor: 'text-rose-500 dark:text-rose-400',
    label: 'Important', dot: 'bg-rose-400'
  },
  note: {
    bg: 'bg-gray-50/70 dark:bg-neutral-800/50',
    border: 'border-l-[3px] border-gray-400 dark:border-neutral-500',
    icon: BookOpen,
    iconColor: 'text-gray-500 dark:text-neutral-400',
    label: 'Note', dot: 'bg-gray-400'
  },
  caution: {
    bg: 'bg-orange-50/70 dark:bg-orange-950/30',
    border: 'border-l-[3px] border-orange-400',
    icon: Shield,
    iconColor: 'text-orange-500 dark:text-orange-400',
    label: 'Caution', dot: 'bg-orange-400'
  },
  highlight: {
    bg: 'bg-cyan-50/70 dark:bg-cyan-950/30',
    border: 'border-l-[3px] border-cyan-400',
    icon: Star,
    iconColor: 'text-cyan-500 dark:text-cyan-400',
    label: 'Highlight', dot: 'bg-cyan-400'
  },
  lightning: {
    bg: 'bg-yellow-50/70 dark:bg-yellow-950/30',
    border: 'border-l-[3px] border-yellow-400',
    icon: Zap,
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    label: 'Quick', dot: 'bg-yellow-400'
  }
};

const variantKeys = Object.keys(calloutStyles);

const CalloutBlock = ({ block, content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const variant = block.properties?.variant || 'info';
  const compact = block.properties?.compact || false;
  const customIcon = block.properties?.customIcon || '';
  const style = calloutStyles[variant] || calloutStyles.info;
  const Icon = style.icon;
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showIconInput, setShowIconInput] = useState(false);

  const calloutData = typeof content === 'object' && content !== null
    ? content
    : { text: content || '' };

  const textContent = calloutData.text || '';

  const handleUpdate = useCallback((html) => {
    onUpdate?.({ ...calloutData, text: html });
  }, [onUpdate, calloutData]);

  const richText = useRichTextEditor({ onUpdate: handleUpdate, externalEditorRef: editorRef });

  useEffect(() => {
    if (editorRef.current && isEditing && editorRef.current.innerHTML !== textContent) {
      editorRef.current.innerHTML = textContent;
    }
  }, [isEditing]);

  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== textContent) {
      editorRef.current.innerHTML = textContent;
    }
  }, [textContent, isFocused]);

  const handleInput = useCallback((e) => {
    handleUpdate(e.target.innerHTML);
  }, [handleUpdate]);

  // We need onUpdateProperties to change variant/compact/customIcon.
  // These are on block.properties, but onUpdate only updates defaultContent.
  // We pass property changes via a special __updateProperties key in onUpdate
  // that the parent (BlockEditor) intercepts.
  // Actually, block.properties changes need to go through the BlockEditor's updateBlockProperties.
  // For now, we'll emit a custom event pattern: onUpdate with a special marker.
  // Better approach: use the extraProps mechanism. The block receives onUpdateBlockProperties if available.

  if (isEditing) {
    return (
      <>
        {/* Variant selector bar */}
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {variantKeys.map(key => {
            const s = calloutStyles[key];
            return (
              <button
                key={key}
                onClick={() => {
                  // Emit property update via the block's onUpdate with a __properties marker
                  // We'll handle this in the parent by checking for it
                  const event = new CustomEvent('kb-block-property-update', {
                    detail: { blockId: block.id, properties: { ...block.properties, variant: key } }
                  });
                  document.dispatchEvent(event);
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all
                  ${variant === key
                    ? 'ring-1 ring-offset-1 ring-blue-500 dark:ring-offset-neutral-900'
                    : 'opacity-60 hover:opacity-100'
                  } ${s.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </button>
            );
          })}

          {/* Custom emoji button */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowIconInput(!showIconInput)}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-neutral-800
                text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {customIcon || '🎯'} Icon
            </button>
            {showIconInput && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 w-48">
                <input
                  autoFocus
                  type="text"
                  value={customIcon}
                  onChange={(e) => {
                    const event = new CustomEvent('kb-block-property-update', {
                      detail: { blockId: block.id, properties: { ...block.properties, customIcon: e.target.value } }
                    });
                    document.dispatchEvent(event);
                  }}
                  placeholder="Paste emoji..."
                  className="w-full px-2 py-1 text-lg bg-gray-50 dark:bg-neutral-700
                    border border-gray-200 dark:border-neutral-600 rounded
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Paste any emoji or leave empty for default</p>
                {customIcon && (
                  <button
                    onClick={() => {
                      const event = new CustomEvent('kb-block-property-update', {
                        detail: { blockId: block.id, properties: { ...block.properties, customIcon: '' } }
                      });
                      document.dispatchEvent(event);
                      setShowIconInput(false);
                    }}
                    className="mt-1 text-[11px] text-red-500 hover:underline"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Compact toggle */}
          <button
            onClick={() => {
              const event = new CustomEvent('kb-block-property-update', {
                detail: { blockId: block.id, properties: { ...block.properties, compact: !compact } }
              });
              document.dispatchEvent(event);
            }}
            className={`ml-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors
              ${compact
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'
              }`}
          >
            {compact ? 'Compact ✓' : 'Compact'}
          </button>
        </div>

        <div className={`flex gap-3.5 rounded-lg ${style.bg} ${style.border}
          ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
          {customIcon ? (
            <span className={`flex-shrink-0 ${compact ? 'text-base mt-0.5' : 'text-xl mt-0.5'}`}>{customIcon}</span>
          ) : (
            <Icon size={compact ? 16 : 20} className={`flex-shrink-0 mt-0.5 ${style.iconColor}`} />
          )}
          <div ref={richText.wrapperRef} className="flex-1" style={{ position: 'relative' }}>
            <div
              ref={editorRef}
              contentEditable
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onInput={handleInput}
              onMouseUp={richText.handleSelectionChange}
              onKeyUp={richText.handleSelectionChange}
              className={`kb-callout-editor w-full bg-transparent leading-[1.7] text-gray-700 dark:text-neutral-300
                focus:outline-none
                [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
                ${compact ? 'text-[13px] min-h-8' : 'text-[15px] min-h-16'}`}
              style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
              data-placeholder="Callout content..."
              suppressContentEditableWarning
            />
            <RichTextToolbar {...richText} pageTree={pageTree} />
          </div>
        </div>
        <style>{`
          .kb-callout-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  if (!textContent) return null;

  const hasHtml = /<[^>]+>/.test(textContent);

  return (
    <>
      <div className={`flex gap-4 rounded-xl ${style.bg} ${style.border}
        ${compact ? 'px-3.5 py-2.5' : 'px-5 py-4'}`}>
        {customIcon ? (
          <span className={`flex-shrink-0 ${compact ? 'text-base mt-0.5' : 'text-xl mt-0.5'}`}>{customIcon}</span>
        ) : (
          <Icon size={compact ? 16 : 20} className={`flex-shrink-0 mt-0.5 ${style.iconColor}`} />
        )}
        {hasHtml ? (
          <div
            className={`flex-1 prose prose-gray dark:prose-invert max-w-none
              leading-[1.7] text-gray-700 dark:text-neutral-300
              [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-gray-800 [&_strong]:dark:text-neutral-200
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
              [&_code]:text-[13px] [&_code]:bg-white/50 [&_code]:dark:bg-black/20
              [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
              ${compact ? 'text-[13px]' : 'text-[15px]'}`}
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        ) : (
          <div className={`flex-1 prose prose-gray dark:prose-invert max-w-none
            leading-[1.7] text-gray-700 dark:text-neutral-300
            [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-gray-800 [&_strong]:dark:text-neutral-200
            [&_code]:text-[13px] [&_code]:bg-white/50 [&_code]:dark:bg-black/20
            [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
            ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {textContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {hasHtml && <style>{textColorStyles}</style>}
    </>
  );
};

export default CalloutBlock;
