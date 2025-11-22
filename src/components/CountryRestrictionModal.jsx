import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { restrictionRules } from '../data/countryRestrictions';

const CountryRestrictionModal = ({ isOpen, onClose, country }) => {
  if (!isOpen || !country) return null;

  const rules = restrictionRules[country.level];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50 dark:bg-neutral-950">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {country.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: rules.color }}
              />
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {rules.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Scenarios */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Handling Scenarios
            </h3>
            {rules.scenarios.map((scenario, index) => (
              <div key={index} className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {scenario.title}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* What to do */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-1">
                        <span>✓</span> What to do
                      </h5>
                      <ul className="space-y-1.5">
                        {scenario.whatToDo.map((item, i) => (
                          <li
                            key={i}
                            className="text-xs text-green-800 dark:text-green-200 flex items-start"
                          >
                            <span className="mr-1.5 mt-0.5 flex-shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What not to do */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-1">
                        <span>✗</span> What NOT to do
                      </h5>
                      <ul className="space-y-1.5">
                        {scenario.whatNotToDo.map((item, i) => (
                          <li
                            key={i}
                            className="text-xs text-red-800 dark:text-red-200 flex items-start"
                          >
                            <span className="mr-1.5 mt-0.5 flex-shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
              </div>
            ))}
          </div>

          {/* Process Details */}
          {rules.process && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Process Details
              </h3>

              {/* Important Notes */}
              {rules.process.important && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Important Notes
                  </h4>
                  <ul className="space-y-1.5">
                    {rules.process.important.map((note, i) => (
                      <li
                        key={i}
                        className="text-xs text-blue-800 dark:text-blue-200 flex items-start"
                      >
                        <span className="mr-1.5 mt-0.5 flex-shrink-0">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Troubleshooting */}
              {rules.process.troubleshooting && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    Troubleshooting Steps
                  </h4>
                  <ol className="space-y-1.5">
                    {rules.process.troubleshooting.map((step, i) => (
                      <li
                        key={i}
                        className="text-xs text-purple-800 dark:text-purple-200 flex items-start"
                      >
                        <span className="mr-1.5 mt-0.5 flex-shrink-0 font-medium">
                          {i + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Situations */}
              {rules.process.situation1 && (
                <div className="bg-muted/50 border rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-foreground mb-2">
                    Situation 1: {rules.process.situation1.title}
                  </h4>
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      Steps:
                    </p>
                    <ul className="space-y-1.5">
                      {rules.process.situation1.steps.map((step, i) => (
                        <li
                          key={i}
                          className="text-xs text-foreground flex items-start"
                        >
                          <span className="mr-1.5 mt-0.5 flex-shrink-0">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {rules.process.situation1.message && (
                    <div className="mt-2 bg-card border rounded p-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Message Template:
                      </p>
                      <p className="text-xs italic text-foreground">
                        {rules.process.situation1.message}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {rules.process.situation2 && (
                <div className="bg-muted/50 border rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-foreground mb-2">
                    Situation 2: {rules.process.situation2.title}
                  </h4>
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      Steps:
                    </p>
                    <ul className="space-y-1.5">
                      {rules.process.situation2.steps.map((step, i) => (
                        <li
                          key={i}
                          className="text-xs text-foreground flex items-start"
                        >
                          <span className="mr-1.5 mt-0.5 flex-shrink-0">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {rules.process.situation2.message && (
                    <div className="mt-2 bg-card border rounded p-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Message Template:
                      </p>
                      <p className="text-xs italic text-foreground">
                        {rules.process.situation2.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Countries List */}
          {rules.countries.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Countries in this Category
              </h3>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex flex-wrap gap-1.5">
                  {rules.countries.map((countryName, i) => (
                    <Badge
                      key={i}
                      variant={countryName === country.name ? "default" : "outline"}
                      className="text-xs"
                    >
                      {countryName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountryRestrictionModal;
