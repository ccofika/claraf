// Country restrictions data based on PDF

// Dark Red Flag Countries
export const darkRedCountries = [
  'Afghanistan', 'North Korea', 'Australia', 'Ontario', 'Côte d\'Ivoire',
  'Portugal', 'Cuba', 'Serbia', 'Curaçao', 'Peru',
  'Democratic Republic of the Congo', 'South Sudan', 'Iran', 'Spain',
  'Iraq', 'Sudan', 'Liberia', 'Syria', 'Libya', 'United Kingdom',
  'Netherlands', 'United States', 'Italy', 'Zimbabwe', 'Colombia',
  'Switzerland', 'Brazil', 'Puerto Rico'
];

// Orange Flag Countries
export const orangeCountries = [
  'France', 'Germany', 'Israel', 'Malta', 'Slovakia', 'Czech Republic',
  'Greece', 'Lithuania', 'Cyprus', 'Poland', 'Belgium', 'Denmark',
  'Austria', 'Argentina', 'Croatia'
];

// Yellow Flag Countries
export const yellowCountries = [
  'Sweden'
];

// ISO2 country codes mapping for react-svg-worldmap
export const countryToISO2 = {
  // Dark Red Countries
  'Afghanistan': 'af',
  'North Korea': 'kp',
  'Australia': 'au',
  'Côte d\'Ivoire': 'ci',
  'Portugal': 'pt',
  'Cuba': 'cu',
  'Serbia': 'rs',
  'Curaçao': 'cw',
  'Peru': 'pe',
  'Democratic Republic of the Congo': 'cd',
  'South Sudan': 'ss',
  'Iran': 'ir',
  'Spain': 'es',
  'Iraq': 'iq',
  'Sudan': 'sd',
  'Liberia': 'lr',
  'Syria': 'sy',
  'Libya': 'ly',
  'United Kingdom': 'gb',
  'Netherlands': 'nl',
  'United States': 'us',
  'Italy': 'it',
  'Zimbabwe': 'zw',
  'Colombia': 'co',
  'Switzerland': 'ch',
  'Brazil': 'br',
  'Puerto Rico': 'pr',
  // Orange Countries
  'France': 'fr',
  'Germany': 'de',
  'Israel': 'il',
  'Malta': 'mt',
  'Slovakia': 'sk',
  'Czech Republic': 'cz',
  'Greece': 'gr',
  'Lithuania': 'lt',
  'Cyprus': 'cy',
  'Poland': 'pl',
  'Belgium': 'be',
  'Denmark': 'dk',
  'Austria': 'at',
  'Argentina': 'ar',
  'Croatia': 'hr',
  // Yellow Countries
  'Sweden': 'se'
};

// ISO3 (Alpha-3) country codes for react-simple-maps
export const countryToISO3 = {
  // Dark Red Countries
  'Afghanistan': 'AFG',
  'North Korea': 'PRK',
  'Australia': 'AUS',
  'Côte d\'Ivoire': 'CIV',
  'Portugal': 'PRT',
  'Cuba': 'CUB',
  'Serbia': 'SRB',
  'Curaçao': 'CUW',
  'Peru': 'PER',
  'Democratic Republic of the Congo': 'COD',
  'South Sudan': 'SSD',
  'Iran': 'IRN',
  'Spain': 'ESP',
  'Iraq': 'IRQ',
  'Sudan': 'SDN',
  'Liberia': 'LBR',
  'Syria': 'SYR',
  'Libya': 'LBY',
  'United Kingdom': 'GBR',
  'Netherlands': 'NLD',
  'United States': 'USA',
  'Italy': 'ITA',
  'Zimbabwe': 'ZWE',
  'Colombia': 'COL',
  'Switzerland': 'CHE',
  'Brazil': 'BRA',
  'Puerto Rico': 'PRI',
  // Orange Countries
  'France': 'FRA',
  'Germany': 'DEU',
  'Israel': 'ISR',
  'Malta': 'MLT',
  'Slovakia': 'SVK',
  'Czech Republic': 'CZE',
  'Greece': 'GRC',
  'Lithuania': 'LTU',
  'Cyprus': 'CYP',
  'Poland': 'POL',
  'Belgium': 'BEL',
  'Denmark': 'DNK',
  'Austria': 'AUT',
  'Argentina': 'ARG',
  'Croatia': 'HRV',
  // Yellow Countries
  'Sweden': 'SWE'
};

// Pastel colors for the map
export const colors = {
  darkRed: '#ef4444',     // Stronger red (tailwind red-500)
  orange: '#f97316',      // Stronger orange (tailwind orange-500)
  yellow: '#eab308',      // Stronger yellow (tailwind yellow-500)
  green: '#f3f4f6',       // Very light gray for unrestricted (tailwind gray-100)
  hover: 0.85             // Darken factor on hover (multiply by this)
};

// Get color for a country (accepts ISO2 or ISO3 code)
export const getCountryColor = (countryCode) => {
  const code = countryCode ? countryCode.toUpperCase() : '';
  const darkRedCodes = darkRedCountries.map(c => countryToISO3[c]).filter(Boolean);
  const orangeCodes = orangeCountries.map(c => countryToISO3[c]).filter(Boolean);
  const yellowCodes = yellowCountries.map(c => countryToISO3[c]).filter(Boolean);

  if (darkRedCodes.includes(code)) return colors.darkRed;
  if (orangeCodes.includes(code)) return colors.orange;
  if (yellowCodes.includes(code)) return colors.yellow;
  return colors.green;
};

// Get restriction level for a country (accepts ISO2 or ISO3 code)
export const getRestrictionLevel = (countryCode) => {
  const code = countryCode ? countryCode.toUpperCase() : '';
  const darkRedCodes = darkRedCountries.map(c => countryToISO3[c]).filter(Boolean);
  const orangeCodes = orangeCountries.map(c => countryToISO3[c]).filter(Boolean);
  const yellowCodes = yellowCountries.map(c => countryToISO3[c]).filter(Boolean);

  if (darkRedCodes.includes(code)) return 'red';
  if (orangeCodes.includes(code)) return 'orange';
  if (yellowCodes.includes(code)) return 'yellow';
  return 'green';
};

// Restriction rules and scenarios
export const restrictionRules = {
  red: {
    title: 'Dark Red Flag Countries',
    color: colors.darkRed,
    countries: darkRedCountries,
    scenarios: [
      {
        title: 'Customer mentions they are from Red country',
        whatToDo: [
          'Support agent has to contact senior to restrict the user',
          'Senior support has to restrict the user and set the role Suspendedlevel3',
          'Assist them with account verification to remove restrictions after providing appropriate documents',
          'Mention that they are from one of the restricted areas without including "RED/HARD" word'
        ],
        whatNotToDo: [
          'Ignore the customer',
          'Forward to local law and Terms of service if the account is not restricted'
        ]
      },
      {
        title: 'Customer has been suspended by the KYC team for the documents that they have sent from the RED country',
        whatToDo: [
          'Agent has to assist them properly with the account verification',
          'The agent is free to notify them that the country is one of the restricted areas'
        ],
        whatNotToDo: [
          'Refusing to speed up the process of verification'
        ]
      },
      {
        title: 'Customer claims that they are living in a country that is not restricted, but they have documents proving that they are from one of the RED countries',
        whatToDo: [
          'Support agent has to contact senior to restrict the user',
          'Senior support has to restrict the user and set the role Suspendedlevel3',
          'Assist them with account verification to remove restrictions after providing appropriate documents'
        ],
        whatNotToDo: [
          'Leaving the account opened without previously restricting it'
        ]
      }
    ],
    process: {
      situation1: {
        title: 'Customer reached out claiming they are from a RED country',
        steps: [
          'The account has to be restricted while setting the appropriate suspend role to the customer\'s account',
          'The customer service agent is obligated to notify the customer that we do not offer services for the country in question'
        ],
        message: '"Since you claimed that your place of residence is one of the forbidden/restricted regions, your account has been moved to withdrawal-only mode. If you do not live in a restricted area, please upload the proof of address at level 3."'
      },
      situation2: {
        title: 'Customer suspended for uploading documents from RED area',
        steps: [
          'Notify the customer that according to his documents, his place of residence is one of the restricted areas therefore he can\'t continue using our services'
        ],
        message: '"Your account has been placed in withdrawal-only status as you have provided documentation indicating that you reside in one of the restricted regions on our website. If you do not live in a restricted area, please upload the proof of address at level 3."'
      }
    }
  },
  orange: {
    title: 'Orange Flag Countries',
    color: colors.orange,
    countries: orangeCountries,
    scenarios: [
      {
        title: 'The customer mentions they are from Orange country',
        whatToDo: [
          'Advise them to be up to date on local laws before using the service',
          'Forward them the TOS to check everything themselves'
        ],
        whatNotToDo: [
          'Do not restrict the account',
          'Do not mention that they are from one of the Orange countries'
        ]
      },
      {
        title: 'The customer mentions they are unable to login to their account due to being from Orange country',
        whatToDo: [
          'Try first troubleshooting options step by step',
          'If nothing is working, notify the customer that they should check the law of the country and our terms of service',
          'If they are still unable to use the site, tell them it is up to the regulators'
        ],
        whatNotToDo: [
          'Do not restrict the account',
          'Do not mention that they are from one of the Orange countries'
        ]
      }
    ],
    process: {
      important: [
        'ORANGE countries cannot be treated as RED flag countries',
        'In these situations, we do not set any restrictions on the customer\'s account',
        'If customer has funds on his balance and cannot access his account, place whitelist role so they can access it | Tag senior'
      ],
      troubleshooting: [
        'Ask the user to try another IP address',
        'Ask the user to try the Opera browser / Tenta Private browser',
        'Ask the user to try mobile data',
        'Ask the user to restart the router',
        'If none of this works, and the user is not able to collect the funds they have, set the whitelist role for 30 minutes so that they can withdraw the funds',
        'Forward to state law and Terms of Service, explaining that the decision was on regulators'
      ]
    }
  },
  yellow: {
    title: 'Yellow Flag Countries',
    color: colors.yellow,
    countries: yellowCountries,
    scenarios: [
      {
        title: 'Customer claims that they are from a Yellow country',
        whatToDo: [
          'Advise them to be up to date on local laws before using the service',
          'Forward them the TOS to check everything themselves'
        ],
        whatNotToDo: [
          'Do not restrict the account',
          'Do not mention that they are from one of the Yellow countries'
        ]
      },
      {
        title: 'Customer asks if they are allowed to use the site from one of the Yellow countries',
        whatToDo: [
          'Advise them to be up to date on local laws before using the service',
          'Forward them the TOS to check everything themselves'
        ],
        whatNotToDo: [
          'Do not confirm if the country is restricted',
          'Do not suspend the user'
        ]
      }
    ],
    process: {
      important: [
        'In these situations, we do not set any restrictions on the customer\'s account',
        'Forward them to thoroughly read the law of their country before proceeding to use our services',
        'Forward the link to our Terms of Service to be able to check everything by themselves without explaining/confirming if the country is one of the Yellow Flag countries'
      ]
    }
  },
  green: {
    title: 'Green Flag Countries (Not Restricted)',
    color: colors.green,
    countries: [], // All other countries
    scenarios: [
      {
        title: 'Customer asks if they are allowed to use our services from the Green country that is not restricted',
        whatToDo: [
          'Advise them to be up to date on local laws before using the service',
          'Forward them the TOS to check everything themselves'
        ],
        whatNotToDo: [
          'Do not confirm with Yes/No answer to the customer since the customer is obligated to check everything by themselves',
          'Use should if necessary'
        ]
      }
    ],
    process: {
      important: [
        'These countries have no specific restrictions',
        'Always advise customers to check their local laws',
        'Forward them to Terms of Service for complete information'
      ]
    }
  }
};
