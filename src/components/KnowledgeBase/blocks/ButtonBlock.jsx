import React, { useState } from 'react';
import { MousePointer, ExternalLink, Copy, Check } from 'lucide-react';

const ButtonBlock = ({ block, content, isEditing, onUpdate }) => {
  const [copied, setCopied] = useState(false);

  // Content structure: { label: string, action: 'link' | 'copy', url: string, copyText: string, style: string, align: string }
  const buttonData = typeof content === 'object' && content !== null
    ? content
    : { label: content || 'Button', action: 'link', url: '', copyText: '', style: 'primary', align: 'left' };

  const handleClick = async () => {
    if (isEditing) return;

    if (buttonData.action === 'copy' && buttonData.copyText) {
      try {
        await navigator.clipboard.writeText(buttonData.copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    } else if (buttonData.action === 'link' && buttonData.url) {
      window.open(buttonData.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Style variants
  const styleClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
  };

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Button Label
          </label>
          <input
            type="text"
            value={buttonData.label || ''}
            onChange={(e) => onUpdate?.({ ...buttonData, label: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Click me"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Action Type
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={buttonData.action === 'link'}
                onChange={() => onUpdate?.({ ...buttonData, action: 'link' })}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-neutral-600 focus:ring-blue-500"
              />
              <span className="text-[14px] text-gray-700 dark:text-neutral-300">Open Link</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={buttonData.action === 'copy'}
                onChange={() => onUpdate?.({ ...buttonData, action: 'copy' })}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-neutral-600 focus:ring-blue-500"
              />
              <span className="text-[14px] text-gray-700 dark:text-neutral-300">Copy Text</span>
            </label>
          </div>
        </div>

        {buttonData.action === 'link' && (
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              URL
            </label>
            <input
              type="url"
              value={buttonData.url || ''}
              onChange={(e) => onUpdate?.({ ...buttonData, url: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
        )}

        {buttonData.action === 'copy' && (
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Text to Copy
            </label>
            <textarea
              value={buttonData.copyText || ''}
              onChange={(e) => onUpdate?.({ ...buttonData, copyText: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Text that will be copied to clipboard"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Style
            </label>
            <select
              value={buttonData.style || 'primary'}
              onChange={(e) => onUpdate?.({ ...buttonData, style: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Primary (Blue)</option>
              <option value="secondary">Secondary (Gray)</option>
              <option value="success">Success (Green)</option>
              <option value="danger">Danger (Red)</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Alignment
            </label>
            <select
              value={buttonData.align || 'left'}
              onChange={(e) => onUpdate?.({ ...buttonData, align: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-lg">
          <p className="text-[12px] text-gray-500 dark:text-neutral-400 mb-3">Preview</p>
          <div className={`flex ${alignClasses[buttonData.align || 'left']}`}>
            <button
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-[14px] transition-colors ${styleClasses[buttonData.style || 'primary']}`}
            >
              {buttonData.action === 'copy' ? <Copy size={16} /> : <ExternalLink size={16} />}
              {buttonData.label || 'Button'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!buttonData.label) {
    return (
      <div className="flex items-center justify-center h-16 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <MousePointer size={24} className="mx-auto text-gray-300 dark:text-neutral-600 mb-1" />
          <span className="text-[13px] text-gray-400 dark:text-neutral-500">No button label</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex my-4 ${alignClasses[buttonData.align || 'left']}`}>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-[14px] transition-colors ${styleClasses[buttonData.style || 'primary']}`}
      >
        {buttonData.action === 'copy' ? (
          copied ? <Check size={16} /> : <Copy size={16} />
        ) : (
          <ExternalLink size={16} />
        )}
        {copied ? 'Copied!' : buttonData.label}
      </button>
    </div>
  );
};

export default ButtonBlock;
