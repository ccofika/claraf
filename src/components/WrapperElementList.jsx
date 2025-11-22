import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Search, CheckCircle, Circle, Type, FileText, Wrench, BookOpen, Image as ImageIcon, Link as LinkIcon, StickyNote, RotateCcw } from 'lucide-react';

const WrapperElementList = ({ isOpen, onClose, wrapper, allElements, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Store original child elements when modal opens
  const [originalChildElements] = useState(() => wrapper?.content?.childElements || []);

  // Get currently selected element IDs
  const selectedElementIds = useMemo(() => {
    return new Set(wrapper?.content?.childElements || []);
  }, [wrapper]);

  // Filter out the wrapper itself and other wrappers
  const availableElements = useMemo(() => {
    return allElements.filter(el =>
      el._id !== wrapper._id &&
      el.type !== 'wrapper'
    );
  }, [allElements, wrapper._id]);

  // Split elements into selected and available
  const { selectedElements, unselectedElements } = useMemo(() => {
    const selected = [];
    const unselected = [];

    availableElements.forEach(element => {
      if (selectedElementIds.has(element._id)) {
        selected.push(element);
      } else {
        unselected.push(element);
      }
    });

    return { selectedElements: selected, unselectedElements: unselected };
  }, [availableElements, selectedElementIds]);

  // Apply search and filter
  const filterElements = (elements) => {
    return elements.filter(element => {
      if (filterType !== 'all' && element.type !== filterType) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentText = getElementContentText(element).toLowerCase();
        return contentText.includes(query);
      }

      return true;
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredSelected = useMemo(() => filterElements(selectedElements), [selectedElements, searchQuery, filterType]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredUnselected = useMemo(() => filterElements(unselectedElements), [unselectedElements, searchQuery, filterType]);

  // Get element icon
  const getElementIcon = (type) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'title': return <Type className={iconClass} />;
      case 'description': return <FileText className={iconClass} />;
      case 'macro': return <Wrench className={iconClass} />;
      case 'example': return <BookOpen className={iconClass} />;
      case 'image': return <ImageIcon className={iconClass} />;
      case 'link': return <LinkIcon className={iconClass} />;
      case 'sticky-note': return <StickyNote className={iconClass} />;
      default: return <FileText className={iconClass} />;
    }
  };

  // Get element content text for display
  function getElementContentText(element) {
    if (!element.content) return 'Empty';

    // For title and description elements (use value field)
    if (element.content.value) {
      const stripped = element.content.value.replace(/<[^>]*>/g, ''); // Strip HTML
      return stripped || 'Empty';
    }

    // For macro elements (use title field)
    if (element.content.title) return element.content.title;

    // For text/card elements
    if (element.content.text) return element.content.text;

    // For link elements
    if (element.content.url) return element.content.url;

    // For example elements
    if (element.content.examples && element.content.examples.length > 0) {
      return element.content.examples[0].title || 'Example';
    }

    return element.type || 'Element';
  }

  // Toggle element selection
  const toggleElement = (elementId) => {
    const newChildElements = [...(wrapper.content?.childElements || [])];

    if (selectedElementIds.has(elementId)) {
      const index = newChildElements.indexOf(elementId);
      if (index > -1) {
        newChildElements.splice(index, 1);
      }
    } else {
      newChildElements.push(elementId);
    }

    if (onUpdate) {
      onUpdate({
        ...wrapper,
        content: {
          ...wrapper.content,
          childElements: newChildElements
        }
      });
    }
  };

  // Reset to original selection
  const handleReset = () => {
    if (onUpdate) {
      onUpdate({
        ...wrapper,
        content: {
          ...wrapper.content,
          childElements: originalChildElements
        }
      });
    }
  };

  // Select all filtered elements
  const selectAllFiltered = () => {
    const newChildElements = new Set(wrapper.content?.childElements || []);
    filteredUnselected.forEach(element => {
      newChildElements.add(element._id);
    });

    if (onUpdate) {
      onUpdate({
        ...wrapper,
        content: {
          ...wrapper.content,
          childElements: Array.from(newChildElements)
        }
      });
    }
  };

  // Deselect all filtered elements
  const deselectAllFiltered = () => {
    const filteredSelectedIds = new Set(filteredSelected.map(el => el._id));
    const newChildElements = (wrapper.content?.childElements || []).filter(
      id => !filteredSelectedIds.has(id)
    );

    if (onUpdate) {
      onUpdate({
        ...wrapper,
        content: {
          ...wrapper.content,
          childElements: newChildElements
        }
      });
    }
  };

  // Get unique element types
  const elementTypes = useMemo(() => {
    const types = new Set(availableElements.map(el => el.type));
    return ['all', ...Array.from(types).sort()];
  }, [availableElements]);

  const hasChanges = JSON.stringify(wrapper?.content?.childElements || []) !== JSON.stringify(originalChildElements);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card border shadow-lg p-0">
        {/* Header */}
        <DialogHeader className="border-b p-6">
          <div>
            <DialogTitle className="text-xl font-semibold">Manage Elements</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedElements.length} of {availableElements.length} elements selected
            </p>
          </div>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="border-b p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search elements..."
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {elementTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={selectAllFiltered}
              disabled={filteredUnselected.length === 0}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
            >
              Select All ({filteredUnselected.length})
            </button>
            <button
              onClick={deselectAllFiltered}
              disabled={filteredSelected.length === 0}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
            >
              Deselect All ({filteredSelected.length})
            </button>
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none ml-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* Selected Elements */}
          {filteredSelected.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Selected ({filteredSelected.length})
              </h3>
              <div className="space-y-2">
                {filteredSelected.map(element => (
                  <ElementCard
                    key={element._id}
                    element={element}
                    isSelected={true}
                    onClick={() => toggleElement(element._id)}
                    getElementIcon={getElementIcon}
                    getElementContentText={getElementContentText}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Elements */}
          {filteredUnselected.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                <Circle className="h-4 w-4" />
                Available ({filteredUnselected.length})
              </h3>
              <div className="space-y-2">
                {filteredUnselected.map(element => (
                  <ElementCard
                    key={element._id}
                    element={element}
                    isSelected={false}
                    onClick={() => toggleElement(element._id)}
                    getElementIcon={getElementIcon}
                    getElementContentText={getElementContentText}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredSelected.length === 0 && filteredUnselected.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Circle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No elements found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium w-full"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Element Card Component
const ElementCard = ({ element, isSelected, onClick, getElementIcon, getElementContentText }) => {
  const contentText = getElementContentText(element);
  const truncatedText = contentText.length > 100 ? contentText.substring(0, 100) + '...' : contentText;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-sm ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
          : 'border-input hover:bg-accent/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${
          isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
        }`}>
          {isSelected ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </div>

        {/* Element Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${
          isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
        }`}>
          {getElementIcon(element.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isSelected
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            }`}>
              {element.type.replace('-', ' ')}
            </span>
          </div>
          <p className="text-sm leading-relaxed break-words">
            {truncatedText}
          </p>
        </div>
      </div>
    </button>
  );
};

export default WrapperElementList;
