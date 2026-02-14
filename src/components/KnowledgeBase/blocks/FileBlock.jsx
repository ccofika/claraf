import React, { useState } from 'react';
import {
  File, FileText, FileImage, FileVideo, FileAudio,
  FileArchive, FileCode, FileSpreadsheet, Download, ExternalLink
} from 'lucide-react';

const FileBlock = ({ block, content, isEditing, onUpdate }) => {
  // Content structure: { url: string, name: string, size: string, type: string }
  const fileData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', name: '', size: '', type: '' };

  // Get file icon based on extension or type
  const getFileIcon = (name, type) => {
    const ext = name?.split('.').pop()?.toLowerCase() || '';
    const mimeType = type?.toLowerCase() || '';

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mimeType.startsWith('image/')) {
      return FileImage;
    }
    // Videos
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext) || mimeType.startsWith('video/')) {
      return FileVideo;
    }
    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext) || mimeType.startsWith('audio/')) {
      return FileAudio;
    }
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return FileArchive;
    }
    // Code
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
      return FileCode;
    }
    // Spreadsheets
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('spreadsheet')) {
      return FileSpreadsheet;
    }
    // Documents
    if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'md'].includes(ext) || mimeType.includes('document') || mimeType.includes('pdf')) {
      return FileText;
    }

    return File;
  };

  // Get file extension color
  const getExtensionColor = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase() || '';

    const colorMap = {
      // Documents
      pdf: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      doc: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      docx: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      // Spreadsheets
      xls: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      xlsx: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      csv: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      // Images
      jpg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      png: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      // Code
      js: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      ts: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      py: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      // Archives
      zip: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    };

    return colorMap[ext] || 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400';
  };

  const FileIcon = getFileIcon(fileData.name, fileData.type);
  const fileName = fileData.name || fileData.url?.split('/').pop() || 'Unknown file';
  const fileExt = fileName.split('.').pop()?.toUpperCase() || '';

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            File URL
          </label>
          <input
            type="url"
            value={fileData.url || ''}
            onChange={(e) => onUpdate?.({ ...fileData, url: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/file.pdf"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={fileData.name || ''}
            onChange={(e) => onUpdate?.({ ...fileData, name: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="document.pdf"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              File Size (optional)
            </label>
            <input
              type="text"
              value={fileData.size || ''}
              onChange={(e) => onUpdate?.({ ...fileData, size: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2.5 MB"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              MIME Type (optional)
            </label>
            <input
              type="text"
              value={fileData.type || ''}
              onChange={(e) => onUpdate?.({ ...fileData, type: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="application/pdf"
            />
          </div>
        </div>

        {fileData.url && (
          <div className="mt-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
            <p className="text-[12px] text-gray-500 dark:text-neutral-400 mb-2">Preview</p>
            <FilePreview data={fileData} />
          </div>
        )}
      </div>
    );
  }

  if (!fileData.url) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <File size={32} className="mx-auto text-gray-300 dark:text-neutral-600 mb-1" />
          <span className="text-[13px] text-gray-400 dark:text-neutral-500">No file URL</span>
        </div>
      </div>
    );
  }

  return <FilePreview data={fileData} />;
};

// Separate preview component
const FilePreview = ({ data }) => {
  const getFileIcon = (name, type) => {
    const ext = name?.split('.').pop()?.toLowerCase() || '';
    const mimeType = type?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mimeType.startsWith('image/')) return FileImage;
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext) || mimeType.startsWith('video/')) return FileVideo;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext) || mimeType.startsWith('audio/')) return FileAudio;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'css', 'html', 'json'].includes(ext)) return FileCode;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
    if (['doc', 'docx', 'pdf', 'txt', 'md'].includes(ext)) return FileText;
    return File;
  };

  const getExtensionColor = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase() || '';
    const colorMap = {
      pdf: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      doc: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      docx: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      xls: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      xlsx: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      zip: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return colorMap[ext] || 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400';
  };

  const FileIcon = getFileIcon(data.name, data.type);
  const fileName = data.name || data.url?.split('/').pop() || 'Unknown file';
  const fileExt = fileName.split('.').pop()?.toUpperCase() || '';

  return (
    <div className="group flex items-center gap-4 p-5 bg-gray-50/60 dark:bg-neutral-900/40 border border-gray-200 dark:border-neutral-700 rounded-xl hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
      {/* Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${getExtensionColor(fileName)}`}>
        <FileIcon size={24} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-gray-800 dark:text-neutral-200 truncate">
          {fileName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {fileExt && (
            <span className="text-[12px] font-medium text-gray-500 dark:text-neutral-400">
              {fileExt}
            </span>
          )}
          {data.size && (
            <>
              <span className="text-gray-300 dark:text-neutral-600">•</span>
              <span className="text-[12px] text-gray-400 dark:text-neutral-500">
                {data.size}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={18} />
        </a>
        <a
          href={data.url}
          download={fileName}
          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Download"
        >
          <Download size={18} />
        </a>
      </div>
    </div>
  );
};

export default FileBlock;
