import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Search, Filter, Link as LinkIcon } from 'lucide-react';

const ElementLinkModal = ({ isOpen, onClose, onElementSelect, onRemoveLink, currentElementLink, currentWorkspaceId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [elements, setElements] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedElementType, setSelectedElementType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const elementTypes = [
    { value: '', label: 'All Types' },
    { value: 'title', label: 'Title' },
    { value: 'description', label: 'Description' },
    { value: 'macro', label: 'Macro' },
    { value: 'example', label: 'Example' },
    { value: 'card', label: 'Card' },
    { value: 'text', label: 'Text' },
    { value: 'subtext', label: 'Subtext' },
    { value: 'sticky-note', label: 'Sticky Note' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
      fetchElements();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const delaySearch = setTimeout(() => {
        fetchElements();
      }, 300);
      return () => clearTimeout(delaySearch);
    }
  }, [searchQuery, selectedWorkspace, selectedElementType, dateFrom, dateTo]);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(response.data);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  const fetchElements = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (searchQuery) params.append('query', searchQuery);
      if (selectedWorkspace) params.append('workspaceId', selectedWorkspace);
      if (selectedElementType) params.append('elementType', selectedElementType);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/canvas/search?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setElements(response.data);
    } catch (err) {
      console.error('Error fetching elements:', err);
      setError('Failed to load elements');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedWorkspace('');
    setSelectedElementType('');
    setDateFrom('');
    setDateTo('');
    setShowFilters(false);
    setError('');
    onClose();
  };

  const handleElementSelect = (element) => {
    onElementSelect({
      elementId: element._id,
      workspaceId: element.workspaceId,
      elementType: element.type,
      elementTitle: getElementTitle(element)
    });
    handleClose();
  };

  const getElementTitle = (element) => {
    if (element.content?.title) return element.content.title;
    if (element.content?.value) return element.content.value;
    if (element.content?.text) return element.content.text;
    if (element.content?.description) return element.content.description;
    return `${element.type} element`;
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getElementPreview = (element) => {
    let preview = '';

    // For title, macro, and example elements - show title
    if (element.type === 'title') {
      preview = stripHtml(element.content?.value || '');
    } else if (element.type === 'macro') {
      preview = stripHtml(element.content?.title || '');
    } else if (element.type === 'example') {
      const currentExample = element.content?.examples?.[element.content?.currentExampleIndex || 0];
      preview = stripHtml(currentExample?.title || '');
    } else if (element.type === 'description') {
      // For description - show first few words
      const fullText = stripHtml(element.content?.value || '');
      const words = fullText.split(' ').slice(0, 8).join(' ');
      preview = words + (fullText.split(' ').length > 8 ? '...' : '');
    } else {
      // For other types, use the generic title
      preview = stripHtml(getElementTitle(element));
    }

    return preview.length > 60 ? preview.substring(0, 60) + '...' : preview;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getElementTypeColor = (type) => {
    const colors = {
      'title': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'description': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'macro': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'example': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'card': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'text': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'subtext': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'sticky-note': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-neutral-50 flex items-center gap-2">
            <LinkIcon size={20} />
            Link to Element
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-neutral-400">
            Search and select an element to link to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search elements..."
              className="w-full pl-10 pr-10 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-50 placeholder:text-gray-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                showFilters
                  ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300'
              }`}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-gray-200 dark:border-neutral-700">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Workspace
                </label>
                <select
                  value={selectedWorkspace}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md text-gray-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Workspaces</option>
                  {workspaces.map((ws) => (
                    <option key={ws._id} value={ws._id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Element Type
                </label>
                <select
                  value={selectedElementType}
                  onChange={(e) => setSelectedElementType(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md text-gray-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {elementTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md text-gray-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md text-gray-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center py-2">
              {error}
            </div>
          )}

          {/* Elements List */}
          <div className="max-h-[400px] overflow-y-auto border border-gray-200 dark:border-neutral-700 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-transparent border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : elements.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                {elements.map((element) => (
                  <div
                    key={element._id}
                    onClick={() => handleElementSelect(element)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getElementTypeColor(element.type)}`}>
                            {element.type}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-neutral-500">
                            {element.workspaceName}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate">
                          {getElementPreview(element)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                          Created {formatDate(element.createdAt)}
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <LinkIcon size={16} className="text-blue-600 dark:text-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Search size={48} className="text-gray-300 dark:text-neutral-600 mb-3" />
                <div className="text-sm text-gray-600 dark:text-neutral-400 text-center">
                  {searchQuery || selectedWorkspace || selectedElementType || dateFrom || dateTo
                    ? 'No elements found matching your search'
                    : 'Start searching to find elements to link to'}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-2 pt-2">
            {currentElementLink && currentElementLink.elementId && onRemoveLink ? (
              <button
                type="button"
                onClick={onRemoveLink}
                className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Remove Link
              </button>
            ) : (
              <div></div>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ElementLinkModal;
