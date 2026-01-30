import React, { useState, useEffect } from 'react';
import { Search, Plus, Layout, FileText, Users, Briefcase, Star, X } from 'lucide-react';
import TemplateCard from './TemplateCard';
import TemplatePreview from './TemplatePreview';
import CreateTemplateModal from './CreateTemplateModal';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Layout },
  { id: 'meeting', label: 'Meeting', icon: Users },
  { id: 'project', label: 'Project', icon: Briefcase },
  { id: 'docs', label: 'Documentation', icon: FileText },
  { id: 'personal', label: 'Personal', icon: Star },
  { id: 'custom', label: 'Custom', icon: Plus },
];

const TemplateGallery = ({ templates = [], onUseTemplate, onCreateTemplate, onUpdateTemplate, onDeleteTemplate, isAdmin = false, onClose }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = templates.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Templates</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-3 space-y-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === cat.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Layout className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map(template => (
                    <TemplateCard
                      key={template._id}
                      template={template}
                      onClick={() => setSelectedTemplate(template)}
                      isAdmin={isAdmin}
                      onDelete={onDeleteTemplate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <TemplatePreview
            template={selectedTemplate}
            onUse={() => {
              onUseTemplate(selectedTemplate._id);
              setSelectedTemplate(null);
              onClose?.();
            }}
            onClose={() => setSelectedTemplate(null)}
            isAdmin={isAdmin}
          />
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <CreateTemplateModal
            onSave={(data) => {
              onCreateTemplate(data);
              setShowCreateModal(false);
            }}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;
