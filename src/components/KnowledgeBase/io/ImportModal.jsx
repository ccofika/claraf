import React, { useState, useRef } from 'react';
import { X, Upload, FileJson, FileText, Code, AlertTriangle, Loader2 } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import ImportPreview from './ImportPreview';

const ImportModal = ({ onClose, onImported }) => {
  const { importPage } = useKnowledgeBase();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'done'
  const fileInputRef = useRef(null);

  const supportedFormats = [
    { ext: '.json', label: 'JSON', icon: FileJson, mime: 'application/json' },
    { ext: '.md', label: 'Markdown', icon: FileText, mime: 'text/markdown' },
    { ext: '.html', label: 'HTML', icon: Code, mime: 'text/html' }
  ];

  const handleFileSelect = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);

    try {
      const text = await selected.text();
      const ext = selected.name.split('.').pop()?.toLowerCase();

      let parsed;
      if (ext === 'json') {
        parsed = JSON.parse(text);
        if (!parsed.title && !parsed.blocks) {
          throw new Error('Invalid JSON format: missing title or blocks');
        }
      } else if (ext === 'md') {
        parsed = { title: selected.name.replace('.md', ''), format: 'markdown', content: text };
      } else if (ext === 'html' || ext === 'htm') {
        parsed = { title: selected.name.replace(/\.html?$/, ''), format: 'html', content: text };
      } else {
        throw new Error(`Unsupported file format: .${ext}`);
      }

      setParsedData(parsed);
      setStep('preview');
    } catch (err) {
      setError(err.message || 'Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setError(null);
    try {
      await importPage(parsedData);
      setStep('done');
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import page');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Trigger the same flow as file select
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (['json', 'md', 'html', 'htm'].includes(ext)) {
        setFile(droppedFile);
        const fakeEvent = { target: { files: [droppedFile] } };
        handleFileSelect(fakeEvent);
      } else {
        setError(`Unsupported file format: .${ext}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
          <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            {step === 'upload' ? 'Import Page' : step === 'preview' ? 'Preview Import' : 'Import Complete'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed
                  border-gray-300 dark:border-neutral-600 rounded-xl cursor-pointer
                  hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50
                  dark:hover:bg-blue-900/10 transition-colors"
              >
                <Upload size={36} className="text-gray-400 dark:text-neutral-500 mb-3" />
                <p className="text-[14px] text-gray-700 dark:text-neutral-300 font-medium mb-1">
                  Drop a file here or click to browse
                </p>
                <p className="text-[12px] text-gray-400 dark:text-neutral-500">
                  Supports JSON, Markdown, and HTML
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.md,.html,.htm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Supported Formats */}
              <div className="flex items-center justify-center gap-4">
                {supportedFormats.map(fmt => {
                  const Icon = fmt.icon;
                  return (
                    <div key={fmt.ext} className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-neutral-500">
                      <Icon size={14} />
                      <span>{fmt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'preview' && parsedData && (
            <ImportPreview data={parsedData} fileName={file?.name} />
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-[16px] font-medium text-gray-900 dark:text-white mb-1">Import Successful</p>
              <p className="text-[13px] text-gray-500 dark:text-neutral-400">
                The page has been imported and added to your knowledge base.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
          {step === 'upload' && (
            <button onClick={onClose} className="px-4 py-2 text-[14px] text-gray-600 dark:text-neutral-400">
              Cancel
            </button>
          )}
          {step === 'preview' && (
            <>
              <button
                onClick={() => { setStep('upload'); setParsedData(null); setFile(null); setError(null); }}
                className="px-4 py-2 text-[14px] text-gray-600 dark:text-neutral-400"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 text-[14px] bg-blue-600 hover:bg-blue-700
                  text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {importing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Import Page
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-[14px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
