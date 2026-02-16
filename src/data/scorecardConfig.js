// Scorecard configuration for QA ticket grading
// Each agent position has a specific scorecard with values to grade

// =============================================================================
// V2 SCORECARD FLAG - Set to false to revert to old position-based scorecards
// =============================================================================
export const USE_NEW_SCORECARD = false;

// Color scheme for scorecard value indices
// 0 = Best (green), 1 = Good (yellow), 2 = Needs improvement (amber), 3 = Poor (red), 4 = N/A (gray)
export const SCORE_COLORS = {
  0: { bg: 'bg-green-500', bgLight: 'bg-green-100', border: 'border-green-500', text: 'text-white', textDark: 'text-green-700' },
  1: { bg: 'bg-yellow-400', bgLight: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-gray-900', textDark: 'text-yellow-700' },
  2: { bg: 'bg-amber-500', bgLight: 'bg-amber-100', border: 'border-amber-500', text: 'text-white', textDark: 'text-amber-700' },
  3: { bg: 'bg-red-500', bgLight: 'bg-red-100', border: 'border-red-500', text: 'text-white', textDark: 'text-red-700' },
  4: { bg: 'bg-gray-400', bgLight: 'bg-gray-100', border: 'border-gray-400', text: 'text-white', textDark: 'text-gray-600' }
};

// Standard option labels for tooltip display (short versions)
export const SHORT_LABELS = {
  0: 'Best',
  1: 'Good',
  2: 'Coach',
  3: 'Improve',
  4: 'N/A'
};

// V2 short labels (3 options + N/A at index 3)
export const V2_SHORT_LABELS = {
  0: 'Best',
  1: 'Good',
  2: 'Coach',
  3: 'N/A'
};

// Reoccurring error category options (V2 scorecard)
export const REOCCURRING_ERROR_OPTIONS = [
  'Responsible Gambling',
  'Available Bonuses',
  'Security',
  'Transactions',
  'Games',
  'Errors',
  'VIP',
  'Stake Basics',
  'Promotions',
  'Compliance',
  'Affiliate program'
];

// Default categories (shared across all V2 agents)
const V2_CATEGORIES = [
  'Account closure', 'ACP usage', 'Account recovery', 'Affiliate program', 'Available bonuses',
  'Balance issues', 'Bet | Bet archive', 'Birthday bonus', 'Break in play', 'Bonus crediting',
  'Bonus drops', 'Casino', 'Coin mixing | AML', 'Compliance (KYC, Terms of service, Privacy)',
  'Crypto - General', 'Crypto deposits', 'Crypto withdrawals', 'Data Deletion', 'Deposit bonus',
  'Exclusion | General', 'Exclusion | Self exclusion', 'Exclusion | Casino exclusion',
  'Fiat General', 'Fiat - CAD', 'Fiat - BRL', 'Fiat - JPY', 'Fiat - PEN/ARS/CLP', 'Fiat - INR',
  'Fiat - NGN/VND/IDR', 'Forum', 'Funds recovery', 'Games issues', 'Games | Providers | Rules',
  'Games | Live games', 'Hacked accounts', 'In-game chat | Third party chat', 'Monthly bonus',
  'No luck tickets | RTP', 'Phishing | Scam attempt', 'Phone removal', 'Pre/Post monthly bonus',
  'Promotions', 'Provably fair', 'Race', 'Rakeback', 'Reload', 'Responsible gambling', 'Roles',
  'Rollover', 'Security (2FA, Password, Email codes)', 'Sportsbook', 'Stake basics', 'Stake originals',
  'Tech issues | Jira cases | Bugs', 'Tip Recovery', 'VIP host', 'VIP program', 'Welcome bonus', 'Weekly bonus'
];

// V2 Scorecard - unified for all agents
// Values: 0 = Nailed it, 1 = Almost there, 2 = Coach, 3 = N/A
const V2_SCORECARD_CONFIG = {
  variants: null,
  defaultVariant: 'default',
  values: {
    default: [
      { key: 'escalation', label: 'Escalation', shortLabel: 'Escalation', options: ['Nailed it', 'Almost there', 'Coach', 'N/A'] },
      { key: 'process', label: 'Process', shortLabel: 'Process', options: ['Nailed it', 'Almost there', 'Coach', 'N/A'] },
      { key: 'knowledge', label: 'Knowledge', shortLabel: 'Knowledge', options: ['Nailed it', 'Almost there', 'Coach', 'N/A'] }
    ]
  },
  categories: V2_CATEGORIES
};

// =============================================================================
// Legacy scorecard configuration by agent position (kept for old tickets & revert)
// =============================================================================
export const SCORECARD_CONFIG = {
  'Junior Scorecard': {
    variants: null, // No variant selection needed
    defaultVariant: 'use_this_one',
    values: {
      use_this_one: [
        { key: 'opening_message', label: 'Opening message', shortLabel: 'Opening', options: ['Nailed it', 'Almost there', 'Coach', "Don't forget to say hello!", 'N/A'] },
        { key: 'attentive_listening', label: 'Attentive Listening', shortLabel: 'Listening', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'communication', label: 'Communication', shortLabel: 'Communic.', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'response_time', label: 'Response Time', shortLabel: 'Resp. Time', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'efficiency', label: 'Efficiency', shortLabel: 'Efficiency', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'ending_message', label: 'Ending Message', shortLabel: 'Ending', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'escalation', label: 'Escalation', shortLabel: 'Escalation', options: ['Nailed it', 'Almost there.', 'Coach', 'You can do better', 'N/A'] },
        { key: 'processes', label: 'Processes', shortLabel: 'Processes', options: ['Nailed it!', 'On track', 'Coaching Opportunity', "Let's improve!", 'N/A'] },
        { key: 'knowledge', label: 'Knowledge', shortLabel: 'Knowledge', options: ['Nailed it!', 'On the right track', 'Coaching Opportunity.', 'Room to grow!', 'N/A'] },
        { key: 'proactivity', label: 'Proactivity', shortLabel: 'Proactivity', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] }
      ]
    },
    categories: [
      'Account closure', 'ACP usage', 'Account recovery', 'Affiliate program', 'Available bonuses',
      'Balance issues', 'Bet | Bet archive', 'Birthday bonus', 'Break in play', 'Bonus crediting',
      'Bonus drops', 'Casino', 'Coin mixing | AML', 'Compliance (KYC, Terms of service, Privacy)',
      'Crypto - General', 'Crypto deposits', 'Crypto withdrawals', 'Data Deletion', 'Deposit bonus',
      'Exclusion | General', 'Exclusion | Self exclusion', 'Exclusion | Casino exclusion',
      'Fiat General', 'Fiat - CAD', 'Fiat - BRL', 'Fiat - JPY', 'Fiat - PEN/ARS/CLP', 'Fiat - INR',
      'Fiat - NGN/VND/IDR', 'Forum', 'Funds recovery', 'Games issues', 'Games | Providers | Rules',
      'Games | Live games', 'Hacked accounts', 'In-game chat | Third party chat', 'Monthly bonus',
      'No luck tickets | RTP', 'Phishing | Scam attempt', 'Phone removal', 'Pre/Post monthly bonus',
      'Promotions', 'Provably fair', 'Race', 'Rakeback', 'Reload', 'Responsible gambling', 'Roles',
      'Rollover', 'Security (2FA, Password, Email codes)', 'Sportsbook', 'Stake basics', 'Stake originals',
      'Tech issues | Jira cases | Bugs', 'Tip Recovery', 'VIP host', 'VIP program', 'Welcome bonus', 'Weekly bonus'
    ]
  },

  'Medior Scorecard': {
    variants: null, // No variant selection needed
    defaultVariant: 'use_this_one',
    values: {
      use_this_one: [
        { key: 'opening_message', label: 'Opening message', shortLabel: 'Opening', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'attentive_listening', label: 'Attentive Listening', shortLabel: 'Listening', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'communication', label: 'Communication', shortLabel: 'Communic.', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'response_time', label: 'Response Time', shortLabel: 'Resp. Time', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'efficiency', label: 'Efficiency', shortLabel: 'Efficiency', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'ending_message', label: 'Ending Message', shortLabel: 'Ending', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'escalation', label: 'Escalation', shortLabel: 'Escalation', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'processes', label: 'Processes', shortLabel: 'Processes', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'knowledge', label: 'Knowledge', shortLabel: 'Knowledge', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'proactivity', label: 'Proactivity', shortLabel: 'Proactivity', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] }
      ]
    },
    categories: [
      'Account closure', 'ACP usage', 'Account recovery', 'Affiliate program', 'Available bonuses',
      'Balance issues', 'Bet | Bet archive', 'Birthday bonus', 'Break in play', 'Bonus crediting',
      'Bonus drops', 'Casino', 'Coin mixing | AML', 'Compliance (KYC, Terms of service, Privacy)',
      'Crypto - General', 'Crypto deposits', 'Crypto withdrawals', 'Data deletion', 'Deposit bonus',
      'Exclusion | General', 'Exclusion | Self exclusion', 'Exclusion | Casino exclusion',
      'Fiat General', 'Fiat - CAD', 'Fiat - BRL', 'Fiat - JPY', 'Fiat - INR', 'Fiat - PEN/ARS/CLP',
      'Forum', 'Funds recovery', 'Games issues', 'Games | Providers | Rules', 'Games | Live games',
      'Hacked accounts', 'In-game chat | Third party chat', 'Monthly bonus', 'No luck tickets | RTP',
      'Phishing | Scam attempt', 'Phone removal', 'Pre/Post monthly bonus', 'Promotions', 'Provably fair',
      'Race', 'Rakeback', 'Reload', 'Responsible gambling', 'Roles', 'Rollover',
      'Security (2FA, Password, Email codes)', 'Sportsbook', 'Stake basics', 'Stake chat', 'Stake original',
      'Tech issues | Jira cases | Bugs', 'Tip recovery', 'VIP host', 'VIP program', 'Welcome bonus', 'Weekly bonus'
    ]
  },

  'Senior Scorecard': {
    variants: [
      { key: 'mentions', label: 'Specialist | Senior Scorecard | Mentions' },
      { key: 'use_this_one', label: 'Specialist | Supervisor | Senior Scorecard | Use this one' }
    ],
    defaultVariant: null, // Must be selected
    values: {
      mentions: [
        { key: 'process', label: 'Process', shortLabel: 'Process', options: ['Properly followed process', 'Need some minor improvements', 'Coaching opportunity', 'Completely failed', 'N/A'] },
        { key: 'knowledge', label: 'Knowledge', shortLabel: 'Knowledge', options: ['Nailed it!', 'On the right track.', 'Coaching Opportunity.', 'Room to grow!', 'N/A'] }
      ],
      use_this_one: [
        { key: 'opening_message', label: 'Opening message', shortLabel: 'Opening', options: ['Nailed it', 'Coach', 'You can do better', "Don't forget to say hello!", 'N/A'] },
        { key: 'attentive_listening', label: 'Attentive Listening', shortLabel: 'Listening', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'communication', label: 'Communication', shortLabel: 'Communic.', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'response_time', label: 'Response Time', shortLabel: 'Resp. Time', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'efficiency', label: 'Efficiency', shortLabel: 'Efficiency', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'ending_message', label: 'Ending Message', shortLabel: 'Ending', options: ['Nailed it', 'Almost there', 'Coach', 'You can do better', 'N/A'] },
        { key: 'escalation', label: 'Escalation', shortLabel: 'Escalation', options: ['Nailed it.', 'Almost there', 'Coaching opportunity', 'You can do better', 'N/A'] },
        { key: 'processes', label: 'Processes', shortLabel: 'Processes', options: ['Nailed it!', 'On the right track.', 'Coaching Opportunity', "Let's improve!", 'N/A'] },
        { key: 'knowledge', label: 'Knowledge', shortLabel: 'Knowledge', options: ['Nailed it!', 'On the right track.', 'Coaching Opportunity', 'Room to grow!', 'N/A'] }
      ]
    },
    categories: [
      'Account closure', 'ACP usage', 'Account recovery', 'Affiliate program', 'Available bonuses',
      'Balance issues', 'Bet | Bet archive', 'Birthday bonus', 'Break in play', 'Bonus crediting',
      'Bonus drops', 'Casino', 'Coin mixing | AML', 'Compliance (KYC, Terms of service, Privacy)',
      'Crypto - General', 'Crypto deposits', 'Crypto withdrawals', 'Data Deletion', 'Deposit bonus',
      'Exclusion | General', 'Exclusion | Self exclusion', 'Exclusion | Casino exclusion',
      'Fiat General', 'Fiat - CAD', 'Fiat - BRL', 'Fiat - JPY', 'Fiat - PEN/ARS/CLP', 'Fiat - INR',
      'Fiat - NGN/VND', 'Forum', 'Funds recovery', 'Games issues', 'Games | Providers | Rules',
      'Games | Live games', 'Hacked accounts', 'In-game chat | Third party chat', 'Monthly bonus',
      'No luck tickets | RTP', 'Phishing | Scam attempt', 'Phone removal', 'Pre/Post monthly bonus',
      'Promotions', 'Provably fair', 'Race', 'Rakeback', 'Reload', 'Responsible gambling', 'Roles',
      'Rollover', 'Security (2FA, Password, Email codes)', 'Sportsbook', 'Stake basics', 'Stake originals',
      'Tech issues | Jira cases | Bugs', 'Tip Recovery', 'VIP host', 'VIP program', 'Welcome bonus', 'Weekly bonus'
    ]
  }
};

// =============================================================================
// Helper functions (V2-aware — when USE_NEW_SCORECARD is true, bypass position)
// =============================================================================

// Helper function to get scorecard config for an agent position
export const getScorecardConfig = (position) => {
  if (USE_NEW_SCORECARD) return V2_SCORECARD_CONFIG;
  return SCORECARD_CONFIG[position] || null;
};

// Helper function to get values for a specific scorecard variant
export const getScorecardValues = (position, variant) => {
  if (USE_NEW_SCORECARD) {
    return V2_SCORECARD_CONFIG.values.default;
  }
  const config = SCORECARD_CONFIG[position];
  if (!config) return [];

  const variantKey = variant || config.defaultVariant;
  return config.values[variantKey] || [];
};

// Helper function to get categories for a specific position
export const getScorecardCategories = (position) => {
  if (USE_NEW_SCORECARD) return V2_CATEGORIES;
  const config = SCORECARD_CONFIG[position];
  return config?.categories || [];
};

// Helper function to check if position requires variant selection
export const requiresVariantSelection = (position) => {
  if (USE_NEW_SCORECARD) return false;
  const config = SCORECARD_CONFIG[position];
  return config?.variants !== null && config?.defaultVariant === null;
};

// Helper to check if a position has scorecard
export const hasScorecard = (position) => {
  if (USE_NEW_SCORECARD) return true; // All agents use V2 scorecard
  return SCORECARD_CONFIG.hasOwnProperty(position);
};

// Default empty scorecard values object
export const getEmptyScorecardValues = (position, variant) => {
  const values = getScorecardValues(position, variant);
  const empty = {};
  values.forEach(v => {
    empty[v.key] = null;
  });
  return empty;
};

// Check if a scorecard value index represents N/A for a given ticket version
export const isNAValue = (value, scorecardVersion) => {
  if (scorecardVersion === 'v2') return value === 3;
  return value === 4;
};

// Get the short label for a scorecard value, accounting for version
export const getShortLabel = (value, scorecardVersion) => {
  if (scorecardVersion === 'v2') return V2_SHORT_LABELS[value] || '';
  return SHORT_LABELS[value] || '';
};

// Legacy helper: get config for a specific scorecard version on a ticket (for display)
export const getLegacyScorecardConfig = (position) => {
  return SCORECARD_CONFIG[position] || null;
};
export const getLegacyScorecardValues = (position, variant) => {
  const config = SCORECARD_CONFIG[position];
  if (!config) return [];
  const variantKey = variant || config.defaultVariant;
  return config.values[variantKey] || [];
};
