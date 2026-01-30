import React from 'react';
import { FileJson, FileText, Code, Hash, Layers, Tag } from 'lucide-react';

const ImportPreview = ({ data, fileName }) => {
  const format = data.format || 'json';
  const isJSON = format === 'json' || (!data.format && data.blocks);
  const isMarkdown = format === 'markdown';
  const isHTML = format === 'html';

  // Extract preview info
  const title = data.title || 'Untitled Page';
  const blockCount = data.blocks?.length || 0;
  const hasDropdowns = data.dropdowns?.length > 0;
  const tags = data.tags || [];

  const FormatIcon = isJSON ? FileJson : isMarkdown ? FileText : Code;
  const formatLabel = isJSON ? 'JSON' : isMarkdown ? 'Markdown' : 'HTML';

  // For markdown/HTML, show a content preview
  const contentPreview = data.content
    ? data.content.substring(0, 300) + (data.content.length > 300 ? '...' : '')
    : null;

  return (
    <div className="space-y-4">
      {/* File Info */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <FormatIcon size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
            {fileName || 'Uploaded file'}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-neutral-400">
            Format: {formatLabel}
          </p>
        </div>
      </div>

      {/* Page Details */}
      <div>
        <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
          Page Details
        </label>
        <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-900 dark:text-white">
              {data.icon && <span className="mr-1">{data.icon}</span>}
              {title}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-[13px] text-gray-500 dark:text-neutral-400">
            {isJSON && (
              <>
                <span className="flex items-center gap-1">
                  <Layers size={14} />
                  {blockCount} blocks
                </span>
                {hasDropdowns && (
                  <span className="flex items-center gap-1">
                    <Hash size={14} />
                    {data.dropdowns.length} dropdowns
                  </span>
                )}
              </>
            )}
            {tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag size={14} />
                {tags.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Block Types Summary (for JSON) */}
      {isJSON && blockCount > 0 && (
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Content Summary
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(
              data.blocks.reduce((acc, b) => {
                acc[b.type] = (acc[b.type] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => (
              <span
                key={type}
                className="px-2 py-1 text-[12px] bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 rounded"
              >
                {type.replace(/_/g, ' ')} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content Preview (for Markdown/HTML) */}
      {contentPreview && (
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Content Preview
          </label>
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg max-h-40 overflow-y-auto">
            <pre className="text-[12px] text-gray-600 dark:text-neutral-400 whitespace-pre-wrap font-mono">
              {contentPreview}
            </pre>
          </div>
        </div>
      )}

      {/* Import Note */}
      <p className="text-[12px] text-gray-400 dark:text-neutral-500">
        A new page will be created in your knowledge base with the imported content.
      </p>
    </div>
  );
};

export default ImportPreview;
