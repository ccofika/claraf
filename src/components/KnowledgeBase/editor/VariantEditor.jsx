import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Save } from 'lucide-react';
import BlockRenderer from '../BlockRenderer';

const VariantEditor = ({ block, dropdowns, onSave, onClose }) => {
  // State to track variants being edited
  // Format: { "dropdownId:optionValue": content }
  const [variants, setVariants] = useState({});
  const [selectedDropdown, setSelectedDropdown] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // Initialize variants from block
  useEffect(() => {
    if (block.variants) {
      // Convert Map to object if needed
      const variantsObj = block.variants instanceof Map
        ? Object.fromEntries(block.variants)
        : { ...block.variants };
      setVariants(variantsObj);
    }
  }, [block]);

  // Get list of existing variant keys
  const existingVariantKeys = Object.keys(variants);

  // Handle selecting a dropdown option to edit
  const selectVariant = (dropdownId, optionValue) => {
    const key = `${dropdownId}:${optionValue}`;
    setSelectedDropdown(dropdownId);
    setSelectedOption(optionValue);
    setEditingContent(variants[key] || block.defaultContent || '');
  };

  // Save the current editing content as a variant
  const saveVariant = () => {
    if (!selectedDropdown || !selectedOption) return;

    const key = `${selectedDropdown}:${selectedOption}`;

    // Only save if content is different from default
    if (editingContent === block.defaultContent) {
      // Remove variant if it matches default
      const newVariants = { ...variants };
      delete newVariants[key];
      setVariants(newVariants);
    } else {
      setVariants(prev => ({
        ...prev,
        [key]: editingContent
      }));
    }

    setSelectedDropdown(null);
    setSelectedOption(null);
    setEditingContent('');
  };

  // Delete a variant
  const deleteVariant = (key) => {
    const newVariants = { ...variants };
    delete newVariants[key];
    setVariants(newVariants);
  };

  // Handle final save
  const handleSave = () => {
    onSave(variants);
  };

  // Parse variant key to get dropdown and option labels
  const parseVariantKey = (key) => {
    const [dropdownId, optionValue] = key.split(':');
    const dropdown = dropdowns.find(d => d.id === dropdownId);
    const option = dropdown?.options.find(o => o.value === optionValue);
    return {
      dropdownLabel: dropdown?.label || dropdownId,
      optionLabel: option?.label || optionValue
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Block Variants
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              Create different content for each dropdown option
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200
              hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Default Content Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Default Content
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg text-sm text-gray-600 dark:text-neutral-400">
              {typeof block.defaultContent === 'string'
                ? block.defaultContent || '(empty)'
                : JSON.stringify(block.defaultContent) || '(empty)'}
            </div>
          </div>

          {/* Existing Variants */}
          {existingVariantKeys.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Existing Variants
              </h3>
              <div className="space-y-2">
                {existingVariantKeys.map(key => {
                  const { dropdownLabel, optionLabel } = parseVariantKey(key);
                  return (
                    <div
                      key={key}
                      className="flex items-start justify-between p-3 bg-purple-50 dark:bg-purple-900/20
                        border border-purple-200 dark:border-purple-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-xs bg-purple-200 dark:bg-purple-800
                            text-purple-700 dark:text-purple-300 rounded">
                            {dropdownLabel}
                          </span>
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            {optionLabel}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-neutral-400 truncate">
                          {typeof variants[key] === 'string'
                            ? variants[key]
                            : JSON.stringify(variants[key])}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => {
                            const [dropdownId, optionValue] = key.split(':');
                            selectVariant(dropdownId, optionValue);
                          }}
                          className="p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVariant(key)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add/Edit Variant */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              {selectedDropdown ? 'Edit Variant' : 'Add Variant'}
            </h3>

            {!selectedDropdown ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dropdowns.map(dropdown => (
                  <div key={dropdown.id} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                      {dropdown.icon && <span className="mr-1">{dropdown.icon}</span>}
                      {dropdown.label}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dropdown.options.map(option => {
                        const key = `${dropdown.id}:${option.value}`;
                        const hasVariant = existingVariantKeys.includes(key);
                        return (
                          <button
                            key={option.value}
                            onClick={() => selectVariant(dropdown.id, option.value)}
                            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                              hasVariant
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {option.icon && <span className="mr-1">{option.icon}</span>}
                            {option.label}
                            {hasVariant && ' ✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-neutral-400">
                    Editing variant for:
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-purple-200 dark:bg-purple-800
                    text-purple-700 dark:text-purple-300 rounded">
                    {dropdowns.find(d => d.id === selectedDropdown)?.label}
                  </span>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {dropdowns.find(d => d.id === selectedDropdown)?.options.find(o => o.value === selectedOption)?.label}
                  </span>
                </div>

                <textarea
                  value={typeof editingContent === 'string' ? editingContent : JSON.stringify(editingContent)}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full h-32 p-3 bg-gray-50 dark:bg-neutral-800
                    border border-gray-200 dark:border-neutral-700 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Enter content for this variant..."
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={saveVariant}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                  >
                    Save Variant
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDropdown(null);
                      setSelectedOption(null);
                      setEditingContent('');
                    }}
                    className="px-3 py-1.5 text-gray-600 dark:text-neutral-400 hover:bg-gray-100
                      dark:hover:bg-neutral-800 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-neutral-400 hover:bg-gray-100
              dark:hover:bg-neutral-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Save size={16} />
            Save All Variants
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VariantEditor;
