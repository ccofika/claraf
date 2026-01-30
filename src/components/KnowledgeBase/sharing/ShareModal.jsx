import React, { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Globe, Lock, Users, Eye, Edit3, MessageCircle, Shield, Trash2 } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: Lock, description: 'Only specific users' },
  { value: 'workspace', label: 'Workspace', icon: Users, description: 'All workspace members' },
  { value: 'public', label: 'Public', icon: Globe, description: 'Anyone with the link' },
];

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', icon: Eye },
  { value: 'commenter', label: 'Commenter', icon: MessageCircle },
  { value: 'editor', label: 'Editor', icon: Edit3 },
  { value: 'admin', label: 'Admin', icon: Shield },
];

const ShareModal = ({
  page,
  permissions,
  onUpdatePermissions,
  onGenerateShareLink,
  onRevokeShareLink,
  onClose
}) => {
  const [visibility, setVisibility] = useState(permissions?.visibility || 'workspace');
  const [users, setUsers] = useState(permissions?.users || []);
  const [shareLink, setShareLink] = useState(permissions?.shareLink || null);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdatePermissions?.({
        visibility,
        users,
        inheritFromParent: false
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLink = async () => {
    const link = await onGenerateShareLink?.();
    if (link) setShareLink(link);
  };

  const handleCopyLink = () => {
    if (shareLink?.token) {
      const url = `${window.location.origin}/knowledge-base/shared/${shareLink.token}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddUser = () => {
    if (!inviteEmail.trim()) return;
    setUsers(prev => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
    setInviteEmail('');
  };

  const handleRemoveUser = (idx) => {
    setUsers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleChangeRole = (idx, role) => {
    setUsers(prev => prev.map((u, i) => i === idx ? { ...u, role } : u));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Share Page</h2>
            <p className="text-xs text-gray-500 mt-0.5">{page?.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
            <div className="space-y-1.5">
              {VISIBILITY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      visibility === opt.value
                        ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${visibility === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Share Link</label>
            {shareLink?.enabled ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 font-mono truncate">
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    {`${window.location.origin}/knowledge-base/shared/${shareLink.token}`}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                {shareLink.expiresAt && (
                  <p className="text-xs text-gray-400">
                    Expires: {new Date(shareLink.expiresAt).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={onRevokeShareLink}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  Revoke link
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Generate share link
              </button>
            )}
          </div>

          {/* User permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">People</label>
            {/* Invite */}
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Enter email"
                className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={handleAddUser}
                disabled={!inviteEmail.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>

            {/* User list */}
            {users.length > 0 ? (
              <div className="space-y-1.5">
                {users.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] font-medium text-blue-600 dark:text-blue-400">
                      {(u.email || u.user?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                      {u.email || u.user?.email}
                    </span>
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(idx, e.target.value)}
                      className="text-xs px-1.5 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none"
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button onClick={() => handleRemoveUser(idx)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No individual permissions set</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
