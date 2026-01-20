// Scorecard calculation utilities for automatic quality score calculation

// Junior Scorecard point values for each criterion
// Index 0 = Nailed it (best), 1 = Almost there, 2 = Coach, 3 = You can do better, 4 = N/A
const JUNIOR_POINT_VALUES = {
  // Customer Experience section (30% weight)
  opening_message: [3, 2, 1, 0],      // max 3
  attentive_listening: [5, 4, 3, 2],  // max 5
  communication: [12, 8, 5, 2],       // max 12
  response_time: [1, 1, 0, 0],        // max 1
  efficiency: [5, 4, 3, 1],           // max 5
  ending_message: [2, 2, 1, 0],       // max 2

  // Escalations section (15% weight)
  escalation: [15, 10, 7, 3],         // max 15

  // Processes section (20% weight)
  processes: [20, 15, 10, 5],         // max 20

  // Knowledge section (25% weight)
  knowledge: [25, 15, 10, 5],         // max 25

  // Proactivity section (10% weight)
  proactivity: [10, 8, 5, 2]          // max 10
};

// Senior Scorecard | Mentions - point values
// Index 0 = Best, 1 = Good, 2 = Coach, 3 = Fail, 4 = N/A
const SENIOR_MENTIONS_POINT_VALUES = {
  // Process section (65% weight)
  process: [65, 45, 20, 0],    // max 65

  // Knowledge section (35% weight)
  knowledge: [35, 25, 15, 0]   // max 35
};

// Senior Mentions Section definitions with their weights and criteria
const SENIOR_MENTIONS_SECTIONS = {
  process: {
    weight: 65,
    criteria: ['process']
  },
  knowledge: {
    weight: 35,
    criteria: ['knowledge']
  }
};

// Senior Scorecard | Use this one - point values
// Index 0 = Nailed it (best), 1 = Almost there, 2 = Coach, 3 = You can do better, 4 = N/A
const SENIOR_USE_THIS_ONE_POINT_VALUES = {
  // Customer Experience section (30% weight)
  opening_message: [2, 1, 0, 0],      // max 2
  attentive_listening: [8, 6, 3, 2],  // max 8
  communication: [8, 5, 3, 2],        // max 8
  response_time: [2, 1, 0, 0],        // max 2
  efficiency: [8, 6, 3, 1],           // max 8
  ending_message: [2, 2, 1, 0],       // max 2

  // Escalations section (5% weight)
  escalation: [5, 4, 2, 0],           // max 5

  // Processes section (40% weight)
  processes: [15, 10, 5, 3],          // max 15

  // Knowledge section (25% weight)
  knowledge: [15, 10, 5, 3]           // max 15
};

// Senior Use This One Section definitions with their weights and criteria
const SENIOR_USE_THIS_ONE_SECTIONS = {
  customer_experience: {
    weight: 30,
    criteria: ['opening_message', 'attentive_listening', 'communication', 'response_time', 'efficiency', 'ending_message']
  },
  escalations: {
    weight: 5,
    criteria: ['escalation']
  },
  processes: {
    weight: 40,
    criteria: ['processes']
  },
  knowledge: {
    weight: 25,
    criteria: ['knowledge']
  }
};

// Junior Section definitions with their weights and criteria
const JUNIOR_SECTIONS = {
  customer_experience: {
    weight: 30,
    criteria: ['opening_message', 'attentive_listening', 'communication', 'response_time', 'efficiency', 'ending_message']
  },
  escalations: {
    weight: 15,
    criteria: ['escalation']
  },
  processes: {
    weight: 20,
    criteria: ['processes']
  },
  knowledge: {
    weight: 25,
    criteria: ['knowledge']
  },
  proactivity: {
    weight: 10,
    criteria: ['proactivity']
  }
};

// Medior Scorecard point values for each criterion
// Index 0 = Nailed it (best), 1 = Almost there, 2 = Coach, 3 = You can do better, 4 = N/A
const MEDIOR_POINT_VALUES = {
  // Customer Experience section (45% weight)
  opening_message: [3, 2, 1, 0],      // max 3
  attentive_listening: [10, 8, 5, 2], // max 10
  communication: [10, 8, 5, 2],       // max 10
  response_time: [5, 4, 3, 1],        // max 5
  efficiency: [15, 10, 5, 2],         // max 15
  ending_message: [2, 2, 1, 0],       // max 2

  // Escalations section (5% weight)
  escalation: [5, 4, 2, 0],           // max 5

  // Processes section (25% weight)
  processes: [25, 15, 10, 5],         // max 25

  // Knowledge section (15% weight)
  knowledge: [15, 10, 5, 3],          // max 15

  // Proactivity section (10% weight)
  proactivity: [10, 8, 5, 2]          // max 10
};

// Section definitions with their weights and criteria
const MEDIOR_SECTIONS = {
  customer_experience: {
    weight: 45,
    criteria: ['opening_message', 'attentive_listening', 'communication', 'response_time', 'efficiency', 'ending_message']
  },
  escalations: {
    weight: 5,
    criteria: ['escalation']
  },
  processes: {
    weight: 25,
    criteria: ['processes']
  },
  knowledge: {
    weight: 15,
    criteria: ['knowledge']
  },
  proactivity: {
    weight: 10,
    criteria: ['proactivity']
  }
};

/**
 * Calculate the quality score for a Medior scorecard
 * @param {Object} scorecardValues - Object with criterion keys and option indices (0-4)
 * @returns {number|null} - Quality score percentage (0-100) or null if no values
 */
export function calculateMediorQualityScore(scorecardValues) {
  if (!scorecardValues || Object.keys(scorecardValues).length === 0) {
    return null;
  }

  let totalWeightedScore = 0;
  let totalActiveWeight = 0;

  // Process each section
  for (const [sectionKey, section] of Object.entries(MEDIOR_SECTIONS)) {
    let sectionEarnedPoints = 0;
    let sectionMaxPoints = 0;
    let hasAnyValue = false;

    // Process each criterion in the section
    for (const criterionKey of section.criteria) {
      const optionIndex = scorecardValues[criterionKey];

      // Skip if no value selected or if N/A (index 4)
      if (optionIndex === null || optionIndex === undefined || optionIndex === 4) {
        continue;
      }

      hasAnyValue = true;
      const pointValues = MEDIOR_POINT_VALUES[criterionKey];

      if (pointValues) {
        const earnedPoints = pointValues[optionIndex] ?? 0;
        const maxPoints = pointValues[0]; // First option is always max

        sectionEarnedPoints += earnedPoints;
        sectionMaxPoints += maxPoints;
      }
    }

    // Only include section in calculation if it has at least one graded criterion
    if (hasAnyValue && sectionMaxPoints > 0) {
      const sectionPercentage = sectionEarnedPoints / sectionMaxPoints;
      totalWeightedScore += sectionPercentage * section.weight;
      totalActiveWeight += section.weight;
    }
  }

  // If no sections have any graded criteria, return null
  if (totalActiveWeight === 0) {
    return null;
  }

  // Normalize the score based on active weights (handles N/A sections)
  const normalizedScore = (totalWeightedScore / totalActiveWeight) * 100;

  // Round to nearest integer
  return Math.round(normalizedScore);
}

/**
 * Calculate the quality score for a Junior scorecard
 * @param {Object} scorecardValues - Object with criterion keys and option indices (0-4)
 * @returns {number|null} - Quality score percentage (0-100) or null if no values
 */
export function calculateJuniorQualityScore(scorecardValues) {
  if (!scorecardValues || Object.keys(scorecardValues).length === 0) {
    return null;
  }

  let totalWeightedScore = 0;
  let totalActiveWeight = 0;

  // Process each section
  for (const [sectionKey, section] of Object.entries(JUNIOR_SECTIONS)) {
    let sectionEarnedPoints = 0;
    let sectionMaxPoints = 0;
    let hasAnyValue = false;

    // Process each criterion in the section
    for (const criterionKey of section.criteria) {
      const optionIndex = scorecardValues[criterionKey];

      // Skip if no value selected or if N/A (index 4)
      if (optionIndex === null || optionIndex === undefined || optionIndex === 4) {
        continue;
      }

      hasAnyValue = true;
      const pointValues = JUNIOR_POINT_VALUES[criterionKey];

      if (pointValues) {
        const earnedPoints = pointValues[optionIndex] ?? 0;
        const maxPoints = pointValues[0]; // First option is always max

        sectionEarnedPoints += earnedPoints;
        sectionMaxPoints += maxPoints;
      }
    }

    // Only include section in calculation if it has at least one graded criterion
    if (hasAnyValue && sectionMaxPoints > 0) {
      const sectionPercentage = sectionEarnedPoints / sectionMaxPoints;
      totalWeightedScore += sectionPercentage * section.weight;
      totalActiveWeight += section.weight;
    }
  }

  // If no sections have any graded criteria, return null
  if (totalActiveWeight === 0) {
    return null;
  }

  // Normalize the score based on active weights (handles N/A sections)
  const normalizedScore = (totalWeightedScore / totalActiveWeight) * 100;

  // Round to nearest integer
  return Math.round(normalizedScore);
}

/**
 * Calculate the quality score for a Senior Scorecard | Mentions
 * @param {Object} scorecardValues - Object with criterion keys and option indices (0-4)
 * @returns {number|null} - Quality score percentage (0-100) or null if no values
 */
export function calculateSeniorMentionsQualityScore(scorecardValues) {
  if (!scorecardValues || Object.keys(scorecardValues).length === 0) {
    return null;
  }

  let totalWeightedScore = 0;
  let totalActiveWeight = 0;

  // Process each section
  for (const [sectionKey, section] of Object.entries(SENIOR_MENTIONS_SECTIONS)) {
    let sectionEarnedPoints = 0;
    let sectionMaxPoints = 0;
    let hasAnyValue = false;

    // Process each criterion in the section
    for (const criterionKey of section.criteria) {
      const optionIndex = scorecardValues[criterionKey];

      // Skip if no value selected or if N/A (index 4)
      if (optionIndex === null || optionIndex === undefined || optionIndex === 4) {
        continue;
      }

      hasAnyValue = true;
      const pointValues = SENIOR_MENTIONS_POINT_VALUES[criterionKey];

      if (pointValues) {
        const earnedPoints = pointValues[optionIndex] ?? 0;
        const maxPoints = pointValues[0]; // First option is always max

        sectionEarnedPoints += earnedPoints;
        sectionMaxPoints += maxPoints;
      }
    }

    // Only include section in calculation if it has at least one graded criterion
    if (hasAnyValue && sectionMaxPoints > 0) {
      const sectionPercentage = sectionEarnedPoints / sectionMaxPoints;
      totalWeightedScore += sectionPercentage * section.weight;
      totalActiveWeight += section.weight;
    }
  }

  // If no sections have any graded criteria, return null
  if (totalActiveWeight === 0) {
    return null;
  }

  // Normalize the score based on active weights (handles N/A sections)
  const normalizedScore = (totalWeightedScore / totalActiveWeight) * 100;

  // Round to nearest integer
  return Math.round(normalizedScore);
}

/**
 * Calculate the quality score for a Senior Scorecard | Use this one
 * @param {Object} scorecardValues - Object with criterion keys and option indices (0-4)
 * @returns {number|null} - Quality score percentage (0-100) or null if no values
 */
export function calculateSeniorUseThisOneQualityScore(scorecardValues) {
  if (!scorecardValues || Object.keys(scorecardValues).length === 0) {
    return null;
  }

  let totalWeightedScore = 0;
  let totalActiveWeight = 0;

  // Process each section
  for (const [sectionKey, section] of Object.entries(SENIOR_USE_THIS_ONE_SECTIONS)) {
    let sectionEarnedPoints = 0;
    let sectionMaxPoints = 0;
    let hasAnyValue = false;

    // Process each criterion in the section
    for (const criterionKey of section.criteria) {
      const optionIndex = scorecardValues[criterionKey];

      // Skip if no value selected or if N/A (index 4)
      if (optionIndex === null || optionIndex === undefined || optionIndex === 4) {
        continue;
      }

      hasAnyValue = true;
      const pointValues = SENIOR_USE_THIS_ONE_POINT_VALUES[criterionKey];

      if (pointValues) {
        const earnedPoints = pointValues[optionIndex] ?? 0;
        const maxPoints = pointValues[0]; // First option is always max

        sectionEarnedPoints += earnedPoints;
        sectionMaxPoints += maxPoints;
      }
    }

    // Only include section in calculation if it has at least one graded criterion
    if (hasAnyValue && sectionMaxPoints > 0) {
      const sectionPercentage = sectionEarnedPoints / sectionMaxPoints;
      totalWeightedScore += sectionPercentage * section.weight;
      totalActiveWeight += section.weight;
    }
  }

  // If no sections have any graded criteria, return null
  if (totalActiveWeight === 0) {
    return null;
  }

  // Normalize the score based on active weights (handles N/A sections)
  const normalizedScore = (totalWeightedScore / totalActiveWeight) * 100;

  // Round to nearest integer
  return Math.round(normalizedScore);
}

/**
 * Check if a position supports automatic quality score calculation
 * @param {string} position - Agent position
 * @param {string} variant - Scorecard variant (for positions with multiple variants)
 * @returns {boolean}
 */
export function supportsAutoQualityScore(position, variant = null) {
  if (position === 'Medior Scorecard' || position === 'Junior Scorecard') {
    return true;
  }
  if (position === 'Senior Scorecard') {
    return variant === 'mentions' || variant === 'use_this_one';
  }
  return false;
}

/**
 * Calculate quality score based on position and variant
 * @param {string} position - Agent position
 * @param {Object} scorecardValues - Scorecard values object
 * @param {string} variant - Scorecard variant (for positions with multiple variants)
 * @returns {number|null}
 */
export function calculateQualityScore(position, scorecardValues, variant = null) {
  if (position === 'Medior Scorecard') {
    return calculateMediorQualityScore(scorecardValues);
  }
  if (position === 'Junior Scorecard') {
    return calculateJuniorQualityScore(scorecardValues);
  }
  if (position === 'Senior Scorecard') {
    if (variant === 'mentions') {
      return calculateSeniorMentionsQualityScore(scorecardValues);
    }
    if (variant === 'use_this_one') {
      return calculateSeniorUseThisOneQualityScore(scorecardValues);
    }
  }
  // Add other position calculations here in the future
  return null;
}
