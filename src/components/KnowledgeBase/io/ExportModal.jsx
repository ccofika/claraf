import React, { useState } from 'react';
import { X, Download, FileJson, FileText, Code, Globe, Check, Loader2 } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';

const exportFormats = [
  {
    id: 'json',
    label: 'JSON',
    description: 'Raw data format. Best for backups and re-importing.',
    icon: FileJson,
    extension: '.json'
  },
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Plain text with formatting. Compatible with most editors.',
    icon: FileText,
    extension: '.md'
  },
  {
    id: 'html',
    label: 'HTML',
    description: 'Standalone web page. Viewable in any browser.',
    icon: Code,
    extension: '.html'
  }
];

const ExportModal = ({ pageId, pageTitle, onClose }) => {
  const { exportPage } = useKnowledgeBase();
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const data = await exportPage(pageId, selectedFormat);

      // Create and download file
      let content, mimeType;
      if (selectedFormat === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
      } else if (selectedFormat === 'markdown') {
        content = typeof data === 'string' ? data : data.content || JSON.stringify(data);
        mimeType = 'text/markdown';
      } else {
        content = typeof data === 'string' ? data : data.content || JSON.stringify(data);
        mimeType = 'text/html';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = pageTitle?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'page';
      const ext = exportFormats.find(f => f.id === selectedFormat)?.extension || '.json';
      a.href = url;
      a.download = `${slug}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExported(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export page');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">Export Page</h3>
            <p className="text-[13px] text-gray-500 dark:text-neutral-400 mt-0.5">{pageTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format Options */}
        <div className="p-6 space-y-3">
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
            Export Format
          </label>
          {exportFormats.map(format => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className={`text-[14px] font-medium ${
                    isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-neutral-200'
                  }`}>
                    {format.label}
                    <span className="ml-1 text-[12px] font-normal text-gray-400">{format.extension}</span>
                  </p>
                  <p className="text-[12px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    {format.description}
                  </p>
                </div>
                {isSelected && (
                  <Check size={18} className="text-blue-500 mt-1 flex-shrink-0" />
                )}
              </button>
            );
          })}

          {error && (
            <p className="text-[13px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[14px] text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-[14px] bg-blue-600 hover:bg-blue-700
              text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : exported ? (
              <Check size={16} />
            ) : (
              <Download size={16} />
            )}
            {exported ? 'Exported!' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
