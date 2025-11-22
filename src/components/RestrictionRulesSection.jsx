import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { restrictionRules, colors } from '../data/countryRestrictions';

const RestrictionRulesSection = () => {
  const [expandedSections, setExpandedSections] = useState({
    red: true,
    orange: false,
    yellow: false,
    green: false
  });

  const toggleSection = (level) => {
    setExpandedSections((prev) => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const renderScenarios = (scenarios) => (
    <div className="space-y-3">
      {scenarios.map((scenario, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderProcessDetails = (process) => {
    if (!process) return null;

    return (
      <div className="mt-3 space-y-3">
        {/* Important Notes */}
        {process.important && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Important Notes
            </h4>
            <ul className="space-y-1.5">
              {process.important.map((note, i) => (
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
        {process.troubleshooting && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">
              Troubleshooting Steps
            </h4>
            <ol className="space-y-1.5">
              {process.troubleshooting.map((step, i) => (
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
        {process.situation1 && (
          <div className="bg-muted/50 border rounded-lg p-3">
            <h4 className="text-xs font-semibold text-foreground mb-2">
              Situation 1: {process.situation1.title}
            </h4>
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Steps:
              </p>
              <ul className="space-y-1.5">
                {process.situation1.steps.map((step, i) => (
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
            {process.situation1.message && (
              <div className="mt-2 bg-card border rounded p-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Message Template:
                </p>
                <p className="text-xs italic text-foreground">
                  {process.situation1.message}
                </p>
              </div>
            )}
          </div>
        )}

        {process.situation2 && (
          <div className="bg-muted/50 border rounded-lg p-3">
            <h4 className="text-xs font-semibold text-foreground mb-2">
              Situation 2: {process.situation2.title}
            </h4>
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Steps:
              </p>
              <ul className="space-y-1.5">
                {process.situation2.steps.map((step, i) => (
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
            {process.situation2.message && (
              <div className="mt-2 bg-card border rounded p-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Message Template:
                </p>
                <p className="text-xs italic text-foreground">
                  {process.situation2.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">
        Restriction Rules & Guidelines
      </h2>

      <div className="space-y-3">
        {Object.entries(restrictionRules).map(([level, data]) => (
          <Card key={level}>
            <CardContent className="p-0">
              {/* Header */}
              <button
                onClick={() => toggleSection(level)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded border-2 border-background shadow-sm flex-shrink-0"
                    style={{ backgroundColor: data.color }}
                  />
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-foreground">
                      {data.title}
                    </h3>
                    {data.countries.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {data.countries.length} countries
                      </p>
                    )}
                  </div>
                </div>
                {expandedSections[level] ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Content */}
              {expandedSections[level] && (
                <div className="px-4 py-3 border-t space-y-3">
                  {/* Countries List */}
                  {data.countries.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">
                        Countries in this Category
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-3 border">
                        <div className="flex flex-wrap gap-1.5">
                          {data.countries.map((country, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scenarios */}
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-2">
                      Handling Scenarios
                    </h4>
                    {renderScenarios(data.scenarios)}
                  </div>

                  {/* Process Details */}
                  {renderProcessDetails(data.process)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-xs text-yellow-900 dark:text-yellow-200">
          <span className="font-semibold">Note:</span> All customer support
          agents must follow these guidelines strictly. When in doubt, always
          escalate to a senior support agent before taking action.
        </p>
      </div>
    </div>
  );
};

export default RestrictionRulesSection;
