import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Plus, Trash2, Settings, ChevronDown, ChevronRight,
  Image as ImageIcon, Type, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import BlockEditor from './BlockEditor';
import VariantEditor from './VariantEditor';
import IconPicker from './IconPicker';

const PageEditor = ({ page, onSave, onClose, onDelete }) => {
  const [title, setTitle] = useState(page?.title || '');
  const [icon, setIcon] = useState(page?.icon || '📄');
  const [coverImage, setCoverImage] = useState(page?.coverImage || '');
  const [blocks, setBlocks] = useState(page?.blocks || []);
  const [dropdowns, setDropdowns] = useState(page?.dropdowns || []);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('content');
  const [variantBlock, setVariantBlock] = useState(null);
  const [showDropdownEditor, setShowDropdownEditor] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setIcon(page.icon || '📄');
      setCoverImage(page.coverImage || '');
      setBlocks(page.blocks || []);
      setDropdowns(page.dropdowns || []);
    }
  }, [page]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        icon,
        coverImage,
        blocks,
        dropdowns
      });
      toast.success('Page saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDropdown = () => {
    const newDropdown = {
      id: `dropdown_${Date.now()}`,
      label: 'New Dropdown',
      icon: '📋',
      options: [
        { value: 'option1', label: 'Option 1', icon: '' },
        { value: 'option2', label: 'Option 2', icon: '' }
      ],
      defaultValue: 'option1'
    };
    setDropdowns([...dropdowns, newDropdown]);
  };

  const handleUpdateDropdown = (dropdownId, updates) => {
    setDropdowns(dropdowns.map(d =>
      d.id === dropdownId ? { ...d, ...updates } : d
    ));
  };

  const handleDeleteDropdown = (dropdownId) => {
    if (!window.confirm('Delete this dropdown? This may affect block variants.')) return;
    setDropdowns(dropdowns.filter(d => d.id !== dropdownId));
  };

  const handleAddOption = (dropdownId) => {
    setDropdowns(dropdowns.map(d => {
      if (d.id !== dropdownId) return d;
      const newOption = {
        value: `option_${Date.now()}`,
        label: `Option ${d.options.length + 1}`,
        icon: ''
      };
      return { ...d, options: [...d.options, newOption] };
    }));
  };

  const handleUpdateOption = (dropdownId, optionValue, updates) => {
    setDropdowns(dropdowns.map(d => {
      if (d.id !== dropdownId) return d;
      return {
        ...d,
        options: d.options.map(o =>
          o.value === optionValue ? { ...o, ...updates } : o
        )
      };
    }));
  };

  const handleDeleteOption = (dropdownId, optionValue) => {
    setDropdowns(dropdowns.map(d => {
      if (d.id !== dropdownId) return d;
      return {
        ...d,
        options: d.options.filter(o => o.value !== optionValue)
      };
    }));
  };

  const handleVariantSave = (variants) => {
    if (!variantBlock) return;
    setBlocks(blocks.map(b =>
      b.id === variantBlock.id ? { ...b, variants } : b
    ));
    setVariantBlock(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200
              hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="w-10 h-10 text-2xl text-center bg-gray-100 dark:bg-neutral-800 rounded-lg
                border-2 border-transparent hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors cursor-pointer flex items-center justify-center"
              title="Click to change icon"
            >
              {icon}
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title..."
              className="text-xl font-semibold bg-transparent border-none focus:outline-none
                text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {page?._id && (
            <button
              onClick={() => {
                if (window.confirm('Delete this page?')) {
                  onDelete?.(page._id);
                }
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
              text-white rounded-lg disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex-shrink-0 flex gap-1 px-4 py-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
        <button
          onClick={() => setActiveSection('content')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'content'
              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
          }`}
        >
          <Type size={16} />
          Content
        </button>
        <button
          onClick={() => setActiveSection('dropdowns')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'dropdowns'
              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
          }`}
        >
          <Sliders size={16} />
          Dropdowns ({dropdowns.length})
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'settings'
              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
          }`}
        >
          <Settings size={16} />
          Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'content' && (
          <div className="p-6 pl-12">
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              dropdowns={dropdowns}
              onOpenVariants={setVariantBlock}
            />
          </div>
        )}

        {activeSection === 'dropdowns' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Page Dropdowns
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  Create dropdowns that allow content to change based on selection
                </p>
              </div>
              <button
                onClick={handleAddDropdown}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700
                  text-white rounded-lg text-sm"
              >
                <Plus size={16} />
                Add Dropdown
              </button>
            </div>

            {dropdowns.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg">
                <Sliders size={48} className="mx-auto text-gray-300 dark:text-neutral-600 mb-4" />
                <p className="text-gray-500 dark:text-neutral-400 mb-4">
                  No dropdowns yet. Add a dropdown to create dynamic content.
                </p>
                <button
                  onClick={handleAddDropdown}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Add Your First Dropdown
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {dropdowns.map((dropdown, idx) => (
                  <div
                    key={dropdown.id}
                    className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden"
                  >
                    {/* Dropdown Header */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-900">
                      <input
                        type="text"
                        value={dropdown.icon || ''}
                        onChange={(e) => handleUpdateDropdown(dropdown.id, { icon: e.target.value })}
                        className="w-8 h-8 text-lg text-center bg-white dark:bg-neutral-800
                          border border-gray-200 dark:border-neutral-700 rounded"
                        maxLength={2}
                        placeholder="📋"
                      />
                      <input
                        type="text"
                        value={dropdown.label}
                        onChange={(e) => handleUpdateDropdown(dropdown.id, { label: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800
                          border border-gray-200 dark:border-neutral-700 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Dropdown label..."
                      />
                      <button
                        onClick={() => handleDeleteDropdown(dropdown.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Options */}
                    <div className="p-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                        Options
                      </div>
                      <div className="space-y-2">
                        {dropdown.options.map((option, optIdx) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`default_${dropdown.id}`}
                              checked={dropdown.defaultValue === option.value}
                              onChange={() => handleUpdateDropdown(dropdown.id, { defaultValue: option.value })}
                              className="text-blue-600"
                              title="Set as default"
                            />
                            <input
                              type="text"
                              value={option.icon || ''}
                              onChange={(e) => handleUpdateOption(dropdown.id, option.value, { icon: e.target.value })}
                              className="w-8 h-8 text-center bg-gray-50 dark:bg-neutral-800
                                border border-gray-200 dark:border-neutral-700 rounded text-sm"
                              maxLength={2}
                              placeholder="🔹"
                            />
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => handleUpdateOption(dropdown.id, option.value, { label: e.target.value })}
                              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-neutral-800
                                border border-gray-200 dark:border-neutral-700 rounded-lg text-sm
                                focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Option label..."
                            />
                            <button
                              onClick={() => handleDeleteOption(dropdown.id, option.value)}
                              disabled={dropdown.options.length <= 1}
                              className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleAddOption(dropdown.id)}
                        className="mt-2 flex items-center gap-1 px-2 py-1 text-sm text-blue-600
                          hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      >
                        <Plus size={14} />
                        Add Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Page Settings
            </h3>

            <div className="space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-neutral-800
                      border border-gray-200 dark:border-neutral-700 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {coverImage && (
                    <button
                      onClick={() => setCoverImage('')}
                      className="px-3 py-2 text-gray-500 hover:text-red-600
                        hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {coverImage && (
                  <div className="mt-2 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Page Info */}
              {page && (
                <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                  <div className="text-sm text-gray-500 dark:text-neutral-400 space-y-1">
                    <p>Slug: <code className="px-1 bg-gray-100 dark:bg-neutral-800 rounded">{page.slug}</code></p>
                    {page.createdAt && (
                      <p>Created: {new Date(page.createdAt).toLocaleString()}</p>
                    )}
                    {page.updatedAt && (
                      <p>Updated: {new Date(page.updatedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Variant Editor Modal */}
      <AnimatePresence>
        {variantBlock && (
          <VariantEditor
            block={variantBlock}
            dropdowns={dropdowns}
            onSave={handleVariantSave}
            onClose={() => setVariantBlock(null)}
          />
        )}
      </AnimatePresence>

      {/* Icon Picker Modal */}
      <IconPicker
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={(selectedIcon) => setIcon(selectedIcon)}
        currentIcon={icon}
      />
    </div>
  );
};

export default PageEditor;
