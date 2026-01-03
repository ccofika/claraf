import React from 'react';
import { Filter, X } from 'lucide-react';

const FilterPills = ({ filters, metadata, onEdit }) => {
  if (!filters?.conditions || filters.conditions.length === 0) {
    return null;
  }

  // Get field label
  const getFieldLabel = (field) => {
    const fieldMap = {
      status: 'Status',
      priority: 'Priority',
      qualityScorePercent: 'Score',
      qualityGrade: 'Grade',
      categories: 'Category',
      agent: 'CS Agent',
      createdBy: 'QA Agent',
      tags: 'Tag',
      isArchived: 'Archived'
    };
    return fieldMap[field] || field;
  };

  // Get operator label
  const getOperatorLabel = (operator) => {
    const opMap = {
      equals: '=',
      not_equals: '≠',
      contains: 'contains',
      greater_than: '>',
      greater_or_equal: '≥',
      less_than: '<',
      less_or_equal: '≤',
      between: 'between',
      in: 'in',
      not_in: 'not in',
      is_empty: 'is empty',
      is_not_empty: 'is not empty'
    };
    return opMap[operator] || operator;
  };

  // Format value for display
  const formatValue = (value, field) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (Array.isArray(value)) return value.join(', ');

    // Try to get label from metadata
    if (field === 'agent' && metadata?.agents) {
      const agent = metadata.agents.find(a => a.value === value);
      if (agent) return agent.label;
    }
    if (field === 'createdBy' && metadata?.qaAgents) {
      const qa = metadata.qaAgents.find(a => a.value === value);
      if (qa) return qa.label;
    }

    return value;
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <div className="flex flex-wrap gap-1">
        {filters.conditions.slice(0, 3).map((condition, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md"
          >
            <span className="font-medium">{getFieldLabel(condition.field)}</span>
            <span className="text-blue-500 dark:text-blue-400">{getOperatorLabel(condition.operator)}</span>
            {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
              <span>{formatValue(condition.value, condition.field)}</span>
            )}
          </span>
        ))}
        {filters.conditions.length > 3 && (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 rounded-md">
            +{filters.conditions.length - 3} more
          </span>
        )}
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        Edit
      </button>
    </div>
  );
};

export default FilterPills;
