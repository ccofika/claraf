import React, { useState } from 'react';
import { Trash2, FolderInput, Tag, X, AlertTriangle, Check, Loader2, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const BulkOperationsPanel = ({ selectedPages, pages, onComplete, onClear }) => {
  const [operation, setOperation] = useState(null); // 'delete' | 'move' | 'tag' | 'permissions'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Move state
  const [targetParent, setTargetParent] = useState('');
  // Tag state
  const [addTags, setAddTags] = useState('');
  const [removeTags, setRemoveTags] = useState('');
  // Permissions state
  const [visibility, setVisibility] = useState('workspace');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const flatPages = [];
  const flatten = (list, depth = 0) => {
    if (!list) return;
    for (const p of list) {
      flatPages.push({ ...p, depth });
      if (p.children) flatten(p.children, depth + 1);
    }
  };
  flatten(pages);

  const handleBulkDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/knowledge-base/bulk/delete`,
        { pageIds: selectedPages },
        { headers }
      );
      setSuccess(`${res.data.count} pages deleted`);
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/knowledge-base/bulk/move`,
        { pageIds: selectedPages, targetParentId: targetParent || null },
        { headers }
      );
      setSuccess(`${res.data.count} pages moved`);
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Move failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTag = async () => {
    setLoading(true);
    setError(null);
    try {
      const add = addTags ? addTags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const remove = removeTags ? removeTags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await axios.post(`${API_URL}/api/knowledge-base/bulk/tag`,
        { pageIds: selectedPages, addTags: add, removeTags: remove },
        { headers }
      );
      setSuccess(`${res.data.count} pages updated`);
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Tag update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/knowledge-base/bulk/permissions`,
        { pageIds: selectedPages, visibility },
        { headers }
      );
      setSuccess(`${res.data.count} pages updated to ${visibility}`);
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Permissions update failed');
    } finally {
      setLoading(false);
    }
  };

  if (selectedPages.length === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-medium text-blue-800 dark:text-blue-300">
          {selectedPages.length} page{selectedPages.length > 1 ? 's' : ''} selected
        </span>
        <button onClick={onClear} className="text-[12px] text-blue-500 hover:text-blue-700">
          Clear selection
        </button>
      </div>

      {/* Operation buttons */}
      {!operation && (
        <div className="flex gap-2">
          <button
            onClick={() => setOperation('delete')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-red-100 dark:bg-red-900/30
              text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={() => setOperation('move')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-purple-100 dark:bg-purple-900/30
              text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            <FolderInput size={14} /> Move
          </button>
          <button
            onClick={() => setOperation('tag')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-green-100 dark:bg-green-900/30
              text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <Tag size={14} /> Tag
          </button>
          <button
            onClick={() => setOperation('permissions')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-amber-100 dark:bg-amber-900/30
              text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            <Shield size={14} /> Permissions
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {operation === 'delete' && !success && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700 dark:text-red-400">
              Are you sure you want to delete {selectedPages.length} pages? This action can be reversed from the trash.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-red-600 text-white rounded-lg
                hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Confirm Delete
            </button>
            <button
              onClick={() => { setOperation(null); setError(null); }}
              className="px-3 py-1.5 text-[13px] text-gray-600 dark:text-neutral-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Move form */}
      {operation === 'move' && !success && (
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
              Move to parent
            </label>
            <select
              value={targetParent}
              onChange={(e) => setTargetParent(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white dark:bg-neutral-800 border border-gray-200
                dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Root (no parent)</option>
              {flatPages
                .filter(p => !selectedPages.includes(p._id))
                .map(p => (
                  <option key={p._id} value={p._id}>
                    {'  '.repeat(p.depth)}{p.icon || ''} {p.title}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkMove}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-purple-600 text-white rounded-lg
                hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FolderInput size={14} />}
              Move Pages
            </button>
            <button
              onClick={() => { setOperation(null); setError(null); }}
              className="px-3 py-1.5 text-[13px] text-gray-600 dark:text-neutral-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tag form */}
      {operation === 'tag' && !success && (
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
              Add tags (comma separated)
            </label>
            <input
              type="text"
              value={addTags}
              onChange={(e) => setAddTags(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white dark:bg-neutral-800 border border-gray-200
                dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
              Remove tags (comma separated)
            </label>
            <input
              type="text"
              value={removeTags}
              onChange={(e) => setRemoveTags(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white dark:bg-neutral-800 border border-gray-200
                dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="old-tag1, old-tag2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkTag}
              disabled={loading || (!addTags && !removeTags)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-green-600 text-white rounded-lg
                hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
              Update Tags
            </button>
            <button
              onClick={() => { setOperation(null); setError(null); }}
              className="px-3 py-1.5 text-[13px] text-gray-600 dark:text-neutral-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Permissions form */}
      {operation === 'permissions' && !success && (
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
              Set visibility
            </label>
            <div className="flex gap-2">
              {['private', 'workspace', 'public'].map(v => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`flex-1 px-3 py-2 text-[13px] rounded-lg border transition-colors capitalize ${
                    visibility === v
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkPermissions}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-amber-600 text-white rounded-lg
                hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Update Permissions
            </button>
            <button
              onClick={() => { setOperation(null); setError(null); }}
              className="px-3 py-1.5 text-[13px] text-gray-600 dark:text-neutral-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[13px] text-red-600 dark:text-red-400">{error}</p>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Check size={16} className="text-green-600" />
          <span className="text-[13px] text-green-700 dark:text-green-400">{success}</span>
        </div>
      )}
    </div>
  );
};

export default BulkOperationsPanel;
