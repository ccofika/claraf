import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  getRestrictionLevel,
  getCountryColor,
  restrictionRules,
  colors,
  countryToISO2,
  darkRedCountries,
  orangeCountries,
  yellowCountries
} from '../data/countryRestrictions';
import CountryRestrictionModal from '../components/CountryRestrictionModal';
import RestrictionRulesSection from '../components/RestrictionRulesSection';
import { Globe, AlertTriangle, Shield, Users, FileText } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CountriesRestrictions = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // Map country names from world-atlas to our list
  const normalizeCountryName = (mapName) => {
    const nameMap = {
      'United States of America': 'United States',
      'United Kingdom': 'United Kingdom',
      'Dem. Rep. Congo': 'Democratic Republic of the Congo',
      'S. Sudan': 'South Sudan',
      'Côte d\'Ivoire': 'Côte d\'Ivoire',
      'Czechia': 'Czech Republic',
      'Korea': 'North Korea',
      'Dem. Rep. Korea': 'North Korea'
    };

    return nameMap[mapName] || mapName;
  };

  // Get country color based on country name from properties
  const getCountryFillColor = (geo) => {
    if (!geo || !geo.properties || !geo.properties.name) return colors.green;

    const mapName = geo.properties.name;
    const countryName = normalizeCountryName(mapName);

    // Check if country is in any restriction list
    if (darkRedCountries.includes(countryName)) {
      return colors.darkRed;
    }
    if (orangeCountries.includes(countryName)) {
      return colors.orange;
    }
    if (yellowCountries.includes(countryName)) {
      return colors.yellow;
    }

    return colors.green;
  };

  const handleCountryClick = (geo) => {
    if (!geo || !geo.properties || !geo.properties.name) return;

    const mapName = geo.properties.name;
    const countryName = normalizeCountryName(mapName);
    let restrictionLevel = 'green';

    if (darkRedCountries.includes(countryName)) {
      restrictionLevel = 'red';
    } else if (orangeCountries.includes(countryName)) {
      restrictionLevel = 'orange';
    } else if (yellowCountries.includes(countryName)) {
      restrictionLevel = 'yellow';
    }

    setSelectedCountry({
      name: countryName,
      iso: geo.id,
      level: restrictionLevel
    });
    setModalOpen(true);
  };

  // Calculate totals for each restriction type
  const totalRestricted = darkRedCountries.length + orangeCountries.length + yellowCountries.length;
  const totalScenarios = Object.values(restrictionRules).reduce(
    (sum, rule) => sum + rule.scenarios.length, 0
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Countries & Restrictions</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Global restriction policies and compliance guidelines</p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hard Restricted Countries */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Hard Restricted</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{darkRedCountries.length}</div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                    Account suspension required • Level 3 verification needed
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg"
                  style={{ backgroundColor: colors.darkRed, opacity: 0.8 }}
                />
              </div>
            </div>

          {/* Medium Restricted Countries */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Medium Restricted</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{orangeCountries.length}</div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                    Troubleshooting required • Whitelist role option available
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg"
                  style={{ backgroundColor: colors.orange, opacity: 0.8 }}
                />
              </div>
            </div>

          {/* Soft Restricted Countries */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Soft Restricted</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{yellowCountries.length}</div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                    Advisory notices only • Local law compliance required
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg"
                  style={{ backgroundColor: colors.yellow, opacity: 0.8 }}
                />
              </div>
            </div>

          {/* Total Support Scenarios */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Support Scenarios</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalScenarios}</div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                    Documented handling procedures across all restriction levels
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
        </div>

        {/* Map Section */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
            <div className="space-y-4">
              {/* Map Instructions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    Click any country to view detailed restriction policies • Scroll to zoom • Drag to pan
                  </span>
                </div>
              </div>

              {/* Map */}
              <div className="bg-muted/30 rounded-lg overflow-hidden border" style={{ height: '400px' }}>
                <ComposableMap
                  projectionConfig={{
                    scale: 147,
                    center: [0, 20]
                  }}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <ZoomableGroup
                    center={[0, 20]}
                    zoom={1}
                    minZoom={1}
                    maxZoom={20}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const fillColor = getCountryFillColor(geo);
                          const isHovered = hoveredCountry === geo.id;

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fillColor}
                              stroke="#d1d5db"
                              strokeWidth={0.1}
                              onMouseEnter={() => setHoveredCountry(geo.id)}
                              onMouseLeave={() => setHoveredCountry(null)}
                              onClick={() => handleCountryClick(geo)}
                              style={{
                                default: {
                                  outline: 'none',
                                  opacity: isHovered ? 0.8 : 1
                                },
                                hover: {
                                  outline: 'none',
                                  cursor: 'pointer',
                                  opacity: 0.8
                                },
                                pressed: {
                                  outline: 'none',
                                  opacity: 0.7
                                }
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    color: colors.darkRed,
                    label: 'Hard Restricted',
                    count: darkRedCountries.length,
                    description: 'Account suspension + KYC required'
                  },
                  {
                    color: colors.orange,
                    label: 'Medium Restricted',
                    count: orangeCountries.length,
                    description: 'Troubleshooting + local law check'
                  },
                  {
                    color: colors.yellow,
                    label: 'Soft Restricted',
                    count: yellowCountries.length,
                    description: 'Advisory + terms of service'
                  },
                  {
                    color: colors.green,
                    label: 'Not Restricted',
                    count: '190+',
                    description: 'Standard service available'
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="w-5 h-5 rounded border-2 border-background shadow-sm flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-foreground">
                          {item.label}
                        </p>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {item.count}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Key Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Red Flag Process */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 border-l-4 border-l-red-500 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                Hard Restricted Process
              </h3>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-neutral-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Immediate account restriction to withdrawal-only mode</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Senior support must set SuspendedLevel3 role</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Level 3 KYC verification required for resolution</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Never mention "HARD/RED" terminology to customers</span>
                </li>
              </ul>
            </div>

          {/* Orange Flag Process */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 border-l-4 border-l-orange-500 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                Medium Restricted Process
              </h3>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-neutral-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>No account restriction - provide troubleshooting first</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Try IP change, browser alternatives, mobile data</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Whitelist role available for 30min withdrawals if needed</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Advise checking local laws and Terms of Service</span>
                </li>
              </ul>
            </div>

          {/* Yellow/Green Flag Process */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 border-l-4 border-l-yellow-500 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                Soft Restricted Process
              </h3>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-neutral-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>No restrictions applied - advisory approach only</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>Forward customers to Terms of Service for review</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>Advise checking local gambling laws before using site</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>Never confirm/deny specific country restriction status</span>
                </li>
              </ul>
            </div>
        </div>

        {/* Rules Section */}
        <RestrictionRulesSection />
      </div>

      {/* Modal for country details */}
      <CountryRestrictionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        country={selectedCountry}
      />
    </div>
  );
};

export default CountriesRestrictions;
