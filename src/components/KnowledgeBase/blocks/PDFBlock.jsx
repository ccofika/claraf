import React, { useState } from 'react';
import { FileText, ExternalLink, Download, Maximize2, Minimize2 } from 'lucide-react';

const PDFBlock = ({ block, content, isEditing, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(false);

  const pdfData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', title: '', height: 600 };

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            PDF URL
          </label>
          <input
            type="url"
            value={pdfData.url || ''}
            onChange={(e) => {
              setError(false);
              onUpdate?.({ ...pdfData, url: e.target.value });
            }}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/document.pdf"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={pdfData.title || ''}
            onChange={(e) => onUpdate?.({ ...pdfData, title: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Document title"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Height (px)
          </label>
          <input
            type="number"
            value={pdfData.height || 600}
            onChange={(e) => onUpdate?.({ ...pdfData, height: parseInt(e.target.value) || 600 })}
            className="w-32 px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="200"
            max="1200"
          />
        </div>
      </div>
    );
  }

  if (!pdfData.url) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <FileText size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
          <span className="text-[13px] text-gray-400 dark:text-neutral-500">Add a PDF document</span>
        </div>
      </div>
    );
  }

  const displayHeight = isExpanded ? '90vh' : `${pdfData.height || 600}px`;
  const fileName = pdfData.title || pdfData.url.split('/').pop() || 'Document';

  return (
    <div className="my-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-red-500" />
          <span className="text-[14px] font-medium text-gray-800 dark:text-neutral-200 truncate max-w-md">
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <a
            href={pdfData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </a>
          <a
            href={pdfData.url}
            download
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
            title="Download"
          >
            <Download size={16} />
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      {error ? (
        <div className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 border border-t-0 border-gray-200 dark:border-neutral-700 rounded-b-lg"
          style={{ height: displayHeight }}>
          <div className="text-center">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-neutral-600 mb-3" />
            <p className="text-[14px] text-gray-500 dark:text-neutral-400 mb-2">Unable to display PDF</p>
            <a
              href={pdfData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-blue-500 hover:text-blue-600 underline"
            >
              Open PDF in new tab
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={`${pdfData.url}#toolbar=1&navpanes=0`}
          className="w-full border border-t-0 border-gray-200 dark:border-neutral-700 rounded-b-lg"
          style={{ height: displayHeight }}
          title={fileName}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default PDFBlock;
