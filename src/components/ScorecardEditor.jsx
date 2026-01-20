import React, { useMemo, useCallback, useState } from 'react';
import {
  SCORE_COLORS,
  getScorecardConfig,
  getScorecardValues,
  requiresVariantSelection,
  hasScorecard
} from '../data/scorecardConfig';

// Short labels for each score index
const SCORE_SHORT_LABELS = ['Best', 'Good', 'Coach', 'Improve', 'N/A'];

// Individual score button with hover effect
const ScoreButton = ({ index, isSelected, disabled, onClick, optionText }) => {
  const [isHovered, setIsHovered] = useState(false);
  const colors = SCORE_COLORS[index];

  // Get background color for different states
  const getBackgroundColor = () => {
    if (isSelected) {
      // Selected state - full color
      switch (index) {
        case 0: return '#22c55e'; // green-500
        case 1: return '#facc15'; // yellow-400
        case 2: return '#f59e0b'; // amber-500
        case 3: return '#ef4444'; // red-500
        case 4: return '#9ca3af'; // gray-400
        default: return '#9ca3af';
      }
    }
    if (isHovered && !disabled) {
      // Hover state - lighter color
      switch (index) {
        case 0: return '#86efac'; // green-300
        case 1: return '#fef08a'; // yellow-200
        case 2: return '#fcd34d'; // amber-300
        case 3: return '#fca5a5'; // red-300
        case 4: return '#d1d5db'; // gray-300
        default: return '#d1d5db';
      }
    }
    // Default state
    return '#e5e7eb'; // gray-200
  };

  const getTextColor = () => {
    if (isSelected) {
      return index === 1 ? '#1f2937' : '#ffffff'; // dark text for yellow, white for others
    }
    if (isHovered && !disabled) {
      return '#1f2937'; // dark text on hover
    }
    return '#6b7280'; // gray-500
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={optionText}
      style={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
      }}
      className={`
        flex-1 flex flex-col items-center justify-center py-1.5 rounded-md transition-all duration-150
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      {/* Small circle indicator */}
      <div
        className={`w-3 h-3 rounded-full mb-0.5 flex items-center justify-center ${
          isSelected ? 'bg-white/30' : ''
        }`}
      >
        {isSelected && (
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {/* Short label */}
      <span className="text-[9px] font-medium leading-tight">
        {SCORE_SHORT_LABELS[index]}
      </span>
    </button>
  );
};

// Individual scorecard value card component
const ScorecardValueCard = ({
  valueConfig,
  selectedIndex,
  onChange,
  disabled
}) => {
  const { key, label, shortLabel, options } = valueConfig;

  // Get background color based on selected value
  const getCardStyle = () => {
    if (selectedIndex === null || selectedIndex === undefined) {
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
    const colors = SCORE_COLORS[selectedIndex];
    return `${colors.bgLight} ${colors.border} dark:bg-opacity-20`;
  };

  return (
    <div className={`rounded-lg p-2 transition-all duration-150 border ${getCardStyle()}`}>
      {/* Label - always show full name */}
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 truncate" title={label}>
        {label}
      </div>

      {/* Radio buttons row - full width with equal sizing */}
      <div className="flex items-center gap-1 w-full">
        {options.map((option, index) => (
          <ScoreButton
            key={index}
            index={index}
            isSelected={selectedIndex === index}
            disabled={disabled}
            onClick={() => onChange(key, index)}
            optionText={option}
          />
        ))}
      </div>
    </div>
  );
};

// Variant selector for Senior Scorecard
const VariantSelector = ({ variants, selectedVariant, onChange, disabled }) => {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Scorecard Type
      </label>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(variant.key)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-all duration-150
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${selectedVariant === variant.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {variant.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main ScorecardEditor component
const ScorecardEditor = ({
  agentPosition,
  variant,
  onVariantChange,
  values = {},
  onChange,
  hideVariantSelector = false,
  disabled = false,
  className = ''
}) => {
  // Get scorecard configuration
  const config = useMemo(() => getScorecardConfig(agentPosition), [agentPosition]);

  // Get values for current variant
  const scorecardValues = useMemo(() => {
    if (!config) return [];
    return getScorecardValues(agentPosition, variant);
  }, [agentPosition, variant, config]);

  // Check if position requires variant selection
  const needsVariant = useMemo(() => requiresVariantSelection(agentPosition), [agentPosition]);

  // Handle individual value change
  const handleValueChange = useCallback((key, index) => {
    const newValues = { ...values, [key]: index };
    onChange(newValues);
  }, [values, onChange]);

  // Handle 100% button - set all values to 0 (best)
  const handleSetAll100 = useCallback(() => {
    const newValues = {};
    scorecardValues.forEach(v => {
      newValues[v.key] = 0;
    });
    onChange(newValues);
  }, [scorecardValues, onChange]);

  // If no scorecard config for this position, don't render
  if (!config || !hasScorecard(agentPosition)) {
    return null;
  }

  // If variant is required but not selected, show only variant selector
  // When hideVariantSelector is true, always show values (variant is passed directly)
  const showValues = hideVariantSelector || !needsVariant || variant;

  return (
    <div className={`${className}`}>
      {/* Variant selector (only for Senior, hidden when showing separate editors) */}
      {config.variants && !hideVariantSelector && (
        <VariantSelector
          variants={config.variants}
          selectedVariant={variant}
          onChange={onVariantChange}
          disabled={disabled}
        />
      )}

      {/* Scorecard values grid */}
      {showValues && scorecardValues.length > 0 && (
        <div>
          {/* Header with 100% button */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Scorecard Values
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleSetAll100}
                className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                title="Set all values to best score"
              >
                100%
              </button>
            )}
          </div>

          {/* Values grid - 2 columns on desktop (fill left column first, then right), 1 on mobile */}
          {(() => {
            const totalValues = scorecardValues.length;
            const rowsNeeded = Math.ceil(totalValues / 2);
            const leftColumn = scorecardValues.slice(0, rowsNeeded);
            const rightColumn = scorecardValues.slice(rowsNeeded);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {/* Left column */}
                <div className="flex flex-col gap-2">
                  {leftColumn.map((valueConfig) => (
                    <ScorecardValueCard
                      key={valueConfig.key}
                      valueConfig={valueConfig}
                      selectedIndex={values[valueConfig.key]}
                      onChange={handleValueChange}
                      disabled={disabled}
                    />
                  ))}
                </div>
                {/* Right column */}
                {rightColumn.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {rightColumn.map((valueConfig) => (
                      <ScorecardValueCard
                        key={valueConfig.key}
                        valueConfig={valueConfig}
                        selectedIndex={values[valueConfig.key]}
                        onChange={handleValueChange}
                        disabled={disabled}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Message when variant not selected */}
      {needsVariant && !variant && (
        <div className="text-sm text-amber-600 dark:text-amber-400 mt-2">
          Please select a scorecard type to continue grading.
        </div>
      )}
    </div>
  );
};

export default ScorecardEditor;
