import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Check, Globe, Lock, Users, FileText, MessageCircle, Share2, Layers } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_API_URL || '';

const ALL_BLOCK_TYPES = [
  'paragraph', 'heading_1', 'heading_2', 'heading_3',
  'bulleted_list', 'numbered_list', 'toggle', 'callout',
  'quote', 'divider', 'code', 'image', 'table',
  'video', 'embed', 'bookmark', 'file', 'equation',
  'button', 'table_of_contents', 'audio', 'pdf',
  'breadcrumbs', 'synced_block', 'columns'
];

const SettingsPanel = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/knowledge-base/settings`, { headers });
      setSettings(res.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/knowledge-base/settings`, {
        defaultPermissions: settings.defaultPermissions,
        allowedBlockTypes: settings.allowedBlockTypes,
        branding: settings.branding,
        contentSettings: settings.contentSettings
      }, { headers });
      setSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const toggleBlockType = (blockType) => {
    setSettings(prev => {
      const types = [...(prev.allowedBlockTypes || [])];
      const idx = types.indexOf(blockType);
      if (idx >= 0) {
        types.splice(idx, 1);
      } else {
        types.push(blockType);
      }
      return { ...prev, allowedBlockTypes: types };
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  const allAllowed = !settings.allowedBlockTypes || settings.allowedBlockTypes.length === 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-gray-400" />
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
            KB Settings
          </h2>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700
            text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {/* Branding */}
        <div className="px-6 py-5">
          <h3 className="text-[13px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-4">Branding</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] text-gray-500 dark:text-neutral-400 mb-1">KB Name</label>
              <input
                type="text"
                value={settings.branding?.name || ''}
                onChange={(e) => updateField('branding.name', e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-neutral-800 border border-gray-200
                  dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 dark:text-neutral-400 mb-1">Description</label>
              <textarea
                value={settings.branding?.description || ''}
                onChange={(e) => updateField('branding.description', e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-neutral-800 border border-gray-200
                  dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
        </div>

        {/* Default Permissions */}
        <div className="px-6 py-5">
          <h3 className="text-[13px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-4">Default Permissions</h3>
          <div className="flex gap-2">
            {[
              { value: 'private', label: 'Private', icon: Lock, desc: 'Only creator can see' },
              { value: 'workspace', label: 'Workspace', icon: Users, desc: 'All team members' },
              { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone with link' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateField('defaultPermissions.visibility', opt.value)}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                  settings.defaultPermissions?.visibility === opt.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                }`}
              >
                <opt.icon size={18} />
                <span className="text-[12px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Settings */}
        <div className="px-6 py-5">
          <h3 className="text-[13px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-4">Content</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-gray-700 dark:text-neutral-300">Max Page Depth</p>
                <p className="text-[11px] text-gray-400">Maximum nesting level for sub-pages</p>
              </div>
              <select
                value={settings.contentSettings?.maxPageDepth || 5}
                onChange={(e) => updateField('contentSettings.maxPageDepth', parseInt(e.target.value))}
                className="px-2 py-1 text-[13px] bg-gray-50 dark:bg-neutral-800 border border-gray-200
                  dark:border-neutral-700 rounded-lg focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n} level{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-gray-700 dark:text-neutral-300">Version History Limit</p>
                <p className="text-[11px] text-gray-400">Max versions to keep per page</p>
              </div>
              <select
                value={settings.contentSettings?.versionRetentionCount || 100}
                onChange={(e) => updateField('contentSettings.versionRetentionCount', parseInt(e.target.value))}
                className="px-2 py-1 text-[13px] bg-gray-50 dark:bg-neutral-800 border border-gray-200
                  dark:border-neutral-700 rounded-lg focus:outline-none"
              >
                {[10, 25, 50, 100, 200, 500].map(n => (
                  <option key={n} value={n}>{n} versions</option>
                ))}
              </select>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Share2 size={15} className="text-gray-400" />
                <span className="text-[13px] text-gray-700 dark:text-neutral-300">Allow Public Sharing</span>
              </div>
              <input
                type="checkbox"
                checked={settings.contentSettings?.allowPublicSharing !== false}
                onChange={(e) => updateField('contentSettings.allowPublicSharing', e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-gray-400" />
                <span className="text-[13px] text-gray-700 dark:text-neutral-300">Allow Comments</span>
              </div>
              <input
                type="checkbox"
                checked={settings.contentSettings?.allowComments !== false}
                onChange={(e) => updateField('contentSettings.allowComments', e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Allowed Block Types */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Allowed Block Types</h3>
            <button
              onClick={() => setSettings(prev => ({ ...prev, allowedBlockTypes: allAllowed ? [...ALL_BLOCK_TYPES] : [] }))}
              className="text-[11px] text-blue-500 hover:text-blue-600"
            >
              {allAllowed ? 'Restrict' : 'Allow All'}
            </button>
          </div>
          {allAllowed ? (
            <p className="text-[12px] text-gray-400 italic">All block types are currently allowed. Click "Restrict" to select specific types.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {ALL_BLOCK_TYPES.map(bt => {
                const isEnabled = settings.allowedBlockTypes.includes(bt);
                return (
                  <button
                    key={bt}
                    onClick={() => toggleBlockType(bt)}
                    className={`px-2 py-1 text-[11px] rounded-md border transition-colors capitalize ${
                      isEnabled
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 border-gray-200 dark:border-neutral-700 line-through'
                    }`}
                  >
                    {bt.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
