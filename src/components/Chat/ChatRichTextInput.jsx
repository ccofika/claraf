import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

const ChatRichTextInput = forwardRef(({
  value = '',
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = 'Type a message...',
  className = '',
  rows = 1,
  disabled = false
}, ref) => {
  const editorRef = useRef(null);
  const isComposingRef = useRef(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    blur: () => editorRef.current?.blur(),
    get selectionStart() {
      return getCaretPosition();
    },
    get selectionEnd() {
      return getCaretPosition();
    },
    setSelectionRange: (start, end) => {
      // Move cursor to position
      const editor = editorRef.current;
      if (!editor) return;

      const range = document.createRange();
      const sel = window.getSelection();

      // For simplicity, move to end
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    },
    get value() {
      return editorRef.current?.innerHTML || '';
    },
    applyFormat: (format) => applyFormatting(format)
  }));

  // Get caret position (approximate)
  const getCaretPosition = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Apply formatting using execCommand
  const applyFormatting = (format) => {
    editorRef.current?.focus();

    switch (format) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough', false, null);
        break;
      case 'code':
        // Wrap selection in code tag
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          const code = document.createElement('code');
          code.className = 'bg-gray-200 dark:bg-neutral-700 text-red-600 dark:text-red-400 px-1 rounded font-mono text-[14px]';
          code.textContent = selectedText || 'code';
          range.deleteContents();
          range.insertNode(code);
          // Move cursor after code
          range.setStartAfter(code);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        break;
      case 'codeblock':
        // Insert code block
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const r = sel.getRangeAt(0);
          const selectedContent = r.toString();
          const pre = document.createElement('pre');
          pre.className = 'bg-gray-100 dark:bg-neutral-900 p-2 rounded my-1 font-mono text-[13px] overflow-x-auto';
          const codeEl = document.createElement('code');
          codeEl.textContent = selectedContent || 'code';
          pre.appendChild(codeEl);
          r.deleteContents();
          r.insertNode(pre);
          // Add line break after
          const br = document.createElement('br');
          pre.parentNode.insertBefore(br, pre.nextSibling);
        }
        break;
      case 'quote':
        // Insert blockquote
        const selQuote = window.getSelection();
        if (selQuote.rangeCount > 0) {
          const rQuote = selQuote.getRangeAt(0);
          const selectedQuote = rQuote.toString();
          const blockquote = document.createElement('blockquote');
          blockquote.className = 'border-l-4 border-gray-300 dark:border-neutral-600 pl-3 italic text-gray-600 dark:text-neutral-400 my-1';
          blockquote.textContent = selectedQuote || 'quote';
          rQuote.deleteContents();
          rQuote.insertNode(blockquote);
          // Add line break after
          const brQ = document.createElement('br');
          blockquote.parentNode.insertBefore(brQ, blockquote.nextSibling);
        }
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand('createLink', false, url);
          // Style the link
          const links = editorRef.current.querySelectorAll('a');
          links.forEach(link => {
            if (link.href === url || link.getAttribute('href') === url) {
              link.className = 'text-[#1164A3] dark:text-blue-400 underline';
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
            }
          });
        }
        break;
      case 'list':
        document.execCommand('insertUnorderedList', false, null);
        break;
      case 'orderedList':
        document.execCommand('insertOrderedList', false, null);
        break;
      default:
        break;
    }

    // Trigger change
    handleInput();
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    // Convert <div> and <br> to proper structure
    onChange?.(html === '<br>' ? '' : html);
  };

  const handleKeyDown = (e) => {
    // Formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormatting('bold');
          return;
        case 'i':
          e.preventDefault();
          applyFormatting('italic');
          return;
        case 'u':
          if (e.shiftKey) {
            e.preventDefault();
            applyFormatting('link');
            return;
          }
          break;
        case 'x':
          if (e.shiftKey) {
            e.preventDefault();
            applyFormatting('strikethrough');
            return;
          }
          break;
        case 'c':
          if (e.shiftKey) {
            e.preventDefault();
            applyFormatting('codeblock');
            return;
          }
          break;
        default:
          break;
      }
    }

    // Pass to parent handler
    onKeyDown?.(e);
  };

  const handlePaste = (e) => {
    // Check for images
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          // Let parent handle image paste
          return;
        }
      }
    }

    // For text, paste as plain text to avoid formatting issues
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  };

  // Check if content is empty for placeholder
  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={handlePaste}
        onCompositionStart={() => isComposingRef.current = true}
        onCompositionEnd={() => {
          isComposingRef.current = false;
          handleInput();
        }}
        className={`outline-none min-h-[24px] ${className}`}
        style={{
          minHeight: rows > 1 ? `${rows * 24}px` : '24px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      {isEmpty && (
        <div
          className="absolute top-0 left-0 pointer-events-none text-gray-400 dark:text-neutral-500"
          aria-hidden="true"
        >
          {placeholder}
        </div>
      )}
    </div>
  );
});

ChatRichTextInput.displayName = 'ChatRichTextInput';

export default ChatRichTextInput;
