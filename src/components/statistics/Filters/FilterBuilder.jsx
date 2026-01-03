import React from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';

const FilterBuilder = ({ filters, metadata, onChange }) => {
  // Initialize filters if null
  const currentFilters = filters || { logic: 'AND', conditions: [], groups: [] };

  const addCondition = () => {
    const newConditions = [
      ...currentFilters.conditions,
      { field: '', operator: 'equals', value: '', logic: 'AND' }
    ];
    onChange({ ...currentFilters, conditions: newConditions });
  };

  const removeCondition = (index) => {
    const newConditions = currentFilters.conditions.filter((_, i) => i !== index);
    onChange({ ...currentFilters, conditions: newConditions });
  };

  const updateCondition = (index, updates) => {
    const newConditions = currentFilters.conditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    );
    onChange({ ...currentFilters, conditions: newConditions });
  };

  const toggleLogic = () => {
    onChange({ ...currentFilters, logic: currentFilters.logic === 'AND' ? 'OR' : 'AND' });
  };

  // Get available fields for filtering
  const getFilterFields = () => {
    const fields = [
      { value: 'status', label: 'Status', type: 'select', options: metadata?.statuses },
      { value: 'priority', label: 'Priority', type: 'select', options: metadata?.priorities },
      { value: 'qualityScorePercent', label: 'Quality Score', type: 'number' },
      { value: 'qualityGrade', label: 'Quality Grade', type: 'select', options: metadata?.qualityGrades },
      { value: 'categories', label: 'Category', type: 'select', options: metadata?.categories },
      { value: 'agent', label: 'CS Agent', type: 'select', options: metadata?.agents },
      { value: 'createdBy', label: 'QA Agent', type: 'select', options: metadata?.qaAgents },
      { value: 'tags', label: 'Tags', type: 'text' },
      { value: 'notes', label: 'Notes', type: 'text' },
      { value: 'feedback', label: 'Feedback', type: 'text' },
      { value: 'ticketId', label: 'Ticket ID', type: 'text' },
      { value: 'isArchived', label: 'Archived', type: 'boolean' }
    ];
    return fields;
  };

  // Get operators for field type
  const getOperators = (fieldType) => {
    const allOperators = metadata?.filterOperators || [];

    switch (fieldType) {
      case 'text':
        return allOperators.filter(o =>
          ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'].includes(o.value)
        );
      case 'number':
        return allOperators.filter(o =>
          ['equals', 'not_equals', 'greater_than', 'greater_or_equal', 'less_than', 'less_or_equal', 'between'].includes(o.value)
        );
      case 'select':
        return allOperators.filter(o =>
          ['equals', 'not_equals', 'in', 'not_in'].includes(o.value)
        );
      case 'boolean':
        return allOperators.filter(o =>
          ['equals'].includes(o.value)
        );
      default:
        return allOperators;
    }
  };

  const fields = getFilterFields();

  const renderValueInput = (condition, index) => {
    const field = fields.find(f => f.value === condition.field);
    if (!field) return null;

    if (field.type === 'select' && field.options) {
      return (
        <select
          value={condition.value || ''}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Select value...</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'number') {
      return (
        <div className="flex-1 flex gap-2">
          <input
            type="number"
            value={condition.value || ''}
            onChange={(e) => updateCondition(index, { value: parseFloat(e.target.value) || '' })}
            placeholder="Value"
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
          />
          {condition.operator === 'between' && (
            <>
              <span className="self-center text-gray-500 text-sm">and</span>
              <input
                type="number"
                value={condition.valueTo || ''}
                onChange={(e) => updateCondition(index, { valueTo: parseFloat(e.target.value) || '' })}
                placeholder="Value"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
              />
            </>
          )}
        </div>
      );
    }

    if (field.type === 'boolean') {
      return (
        <select
          value={condition.value?.toString() || ''}
          onChange={(e) => updateCondition(index, { value: e.target.value === 'true' })}
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Select...</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={condition.value || ''}
        onChange={(e) => updateCondition(index, { value: e.target.value })}
        placeholder="Enter value..."
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h3>
        {currentFilters.conditions.length > 1 && (
          <button
            onClick={toggleLogic}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Match {currentFilters.logic === 'AND' ? 'ALL' : 'ANY'} conditions
          </button>
        )}
      </div>

      {/* Filter conditions */}
      <div className="space-y-2">
        {currentFilters.conditions.map((condition, index) => {
          const field = fields.find(f => f.value === condition.field);
          const operators = getOperators(field?.type || 'text');

          return (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-xs text-gray-500 w-8 text-center">
                  {currentFilters.logic}
                </span>
              )}
              {index === 0 && <div className="w-8" />}

              {/* Field selector */}
              <select
                value={condition.field}
                onChange={(e) => updateCondition(index, { field: e.target.value, value: '', operator: 'equals' })}
                className="w-32 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Field...</option>
                {fields.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              {/* Operator selector */}
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, { operator: e.target.value })}
                className="w-36 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                disabled={!condition.field}
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {/* Value input */}
              {!['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(condition.operator) && (
                renderValueInput(condition, index)
              )}

              {/* Remove button */}
              <button
                onClick={() => removeCondition(index)}
                className="p-2 text-gray-400 hover:text-red-500 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add condition button */}
      <button
        onClick={addCondition}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <Plus className="w-4 h-4" />
        Add condition
      </button>

      {currentFilters.conditions.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No filters applied. Click "Add condition" to filter the data.
        </p>
      )}
    </div>
  );
};

export default FilterBuilder;
