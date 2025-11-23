import React from 'react';
import { Bold, Italic, Code, Link, List, ListOrdered } from 'lucide-react';

const FormattingToolbar = ({ onFormat, inputRef }) => {
  const handleFormat = (type) => {
    if (!inputRef.current) return;

    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = '';
    let newCursorPos = start;

    switch (type) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        newCursorPos = start + (selectedText ? 2 : 2); // Position cursor inside **
        break;
      case 'italic':
        formattedText = `_${selectedText || 'italic text'}_`;
        newCursorPos = start + (selectedText ? 1 : 1);
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        newCursorPos = start + (selectedText ? 1 : 1);
        break;
      case 'codeblock':
        formattedText = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        newCursorPos = start + 4;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        newCursorPos = start + (selectedText ? selectedText.length + 3 : 11);
        break;
      case 'list':
        formattedText = selectedText
          ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
          : '- list item';
        newCursorPos = start + 2;
        break;
      case 'orderedList':
        formattedText = selectedText
          ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
          : '1. list item';
        newCursorPos = start + 3;
        break;
      default:
        return;
    }

    const newValue =
      textarea.value.substring(0, start) +
      formattedText +
      textarea.value.substring(end);

    // Update via onFormat callback
    onFormat(newValue);

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      if (!selectedText) {
        // If no text was selected, position cursor to allow typing inside formatting
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } else {
        // If text was selected, position cursor after formatted text
        const endPos = start + formattedText.length;
        textarea.setSelectionRange(endPos, endPos);
      }
    }, 0);
  };

  const buttons = [
    { icon: Bold, type: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, type: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Code, type: 'code', tooltip: 'Inline code' },
    { icon: List, type: 'list', tooltip: 'Bullet list' },
    { icon: ListOrdered, type: 'orderedList', tooltip: 'Numbered list' },
    { icon: Link, type: 'link', tooltip: 'Link' },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-t border-gray-200 dark:border-neutral-700">
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.type}
            type="button"
            onClick={() => handleFormat(btn.type)}
            title={btn.tooltip}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200"
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
      <div className="ml-auto text-[11px] text-gray-400 dark:text-neutral-500">
        Markdown supported
      </div>
    </div>
  );
};

export default FormattingToolbar;
