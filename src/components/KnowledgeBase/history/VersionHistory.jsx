import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, ChevronRight, User, Eye } from 'lucide-react';
import VersionDiff from './VersionDiff';
import RestoreConfirmModal from './RestoreConfirmModal';

const VersionHistory = ({ pageId, versions = [], onFetchVersions, onRestoreVersion, onFetchVersion, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareVersion, setCompareVersion] = useState(null);
  const [versionDetail, setVersionDetail] = useState(null);
  const [showRestore, setShowRestore] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pageId && onFetchVersions) {
      onFetchVersions(pageId);
    }
  }, [pageId]);

  const handleViewVersion = async (version) => {
    setSelectedVersion(version);
    if (onFetchVersion) {
      setLoading(true);
      try {
        const detail = await onFetchVersion(pageId, version.version);
        setVersionDetail(detail);
      } catch (err) {
        console.error('Failed to load version:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRestore = async (version) => {
    if (onRestoreVersion) {
      await onRestoreVersion(pageId, version.version);
    }
    setShowRestore(null);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      <div className="ml-auto w-[900px] max-w-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Version History</h2>
            <span className="text-sm text-gray-400">({versions.length} versions)</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Version list */}
          <div className="w-72 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                <Clock className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No versions yet</p>
                <p className="text-xs mt-1">Versions are created automatically on each save</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {versions.map((ver, idx) => (
                  <button
                    key={ver._id || ver.version}
                    onClick={() => handleViewVersion(ver)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedVersion?.version === ver.version
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        v{ver.version}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    {ver.changesSummary && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                        {ver.changesSummary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      {ver.createdBy && (
                        <span className="flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" />
                          {ver.createdBy.name || ver.createdBy.email}
                        </span>
                      )}
                      <span>{new Date(ver.createdAt).toLocaleString()}</span>
                    </div>

                    {idx !== 0 && (
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRestore(ver);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          Restore
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Version detail */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedVersion && versionDetail ? (
              <div>
                <div className="mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {versionDetail.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Version {selectedVersion.version} - {new Date(selectedVersion.createdAt).toLocaleString()}
                  </p>
                </div>

                {versionDetail.blocks && versionDetail.blocks.length > 0 ? (
                  <div className="space-y-2 opacity-75">
                    {versionDetail.blocks.map((block, idx) => (
                      <div key={block.id || idx} className="p-2 rounded bg-gray-50 dark:bg-gray-700/50 text-sm">
                        <span className="text-xs text-gray-400 uppercase">{block.type}</span>
                        <div className="text-gray-700 dark:text-gray-300 mt-1">
                          {typeof block.defaultContent === 'string'
                            ? block.defaultContent?.substring(0, 200) || '(empty)'
                            : JSON.stringify(block.defaultContent)?.substring(0, 200) || '(empty)'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No blocks in this version</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Eye className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Select a version to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Restore confirmation */}
        {showRestore && (
          <RestoreConfirmModal
            version={showRestore}
            onConfirm={() => handleRestore(showRestore)}
            onCancel={() => setShowRestore(null)}
          />
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
