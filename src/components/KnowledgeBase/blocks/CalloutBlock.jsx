import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle, Lightbulb, Flame } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

const calloutStyles = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-l-4 border-blue-500',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Info'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-l-4 border-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'Warning'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-l-4 border-red-500',
    icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    title: 'Error'
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-l-4 border-emerald-500',
    icon: CheckCircle,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: 'Success'
  },
  tip: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-l-4 border-violet-500',
    icon: Lightbulb,
    iconColor: 'text-violet-600 dark:text-violet-400',
    title: 'Tip'
  },
  important: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-l-4 border-rose-500',
    icon: Flame,
    iconColor: 'text-rose-600 dark:text-rose-400',
    title: 'Important'
  }
};

const CalloutBlock = ({ block, content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const variant = block.properties?.variant || 'info';
  const style = calloutStyles[variant] || calloutStyles.info;
  const Icon = style.icon;
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

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

  if (isEditing) {
    return (
      <>
        <div className={`flex gap-4 p-5 rounded-lg ${style.bg} ${style.border}`}>
          <Icon size={22} className={`flex-shrink-0 mt-0.5 ${style.iconColor}`} />
          <div ref={richText.wrapperRef} className="flex-1" style={{ position: 'relative' }}>
            <div
              ref={editorRef}
              contentEditable
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onInput={handleInput}
              onMouseUp={richText.handleSelectionChange}
              onKeyUp={richText.handleSelectionChange}
              className="kb-callout-editor w-full bg-transparent text-[15px] leading-[1.6] text-gray-800 dark:text-neutral-200
                focus:outline-none min-h-16
                [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
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
      <div className={`flex gap-4 p-5 rounded-lg ${style.bg} ${style.border}`}>
        <Icon size={22} className={`flex-shrink-0 mt-0.5 ${style.iconColor}`} />
        {hasHtml ? (
          <div
            className="flex-1 prose prose-gray dark:prose-invert max-w-none
              text-[15px] leading-[1.6] text-gray-800 dark:text-neutral-200
              [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-gray-900 [&_strong]:dark:text-white
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
              [&_code]:text-[13px] [&_code]:bg-white/50 [&_code]:dark:bg-black/20
              [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        ) : (
          <div className="flex-1 prose prose-gray dark:prose-invert max-w-none
            text-[15px] leading-[1.6] text-gray-800 dark:text-neutral-200
            [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-gray-900 [&_strong]:dark:text-white
            [&_code]:text-[13px] [&_code]:bg-white/50 [&_code]:dark:bg-black/20
            [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
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
