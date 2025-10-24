/**
 * Check if an element is completely inside a wrapper
 * @param {Object} element - The element to check
 * @param {Object} wrapper - The wrapper element
 * @returns {boolean} - True if element is inside wrapper
 */
export const isElementInsideWrapper = (element, wrapper) => {
  if (!element || !wrapper) return false;
  if (!element.position || !element.dimensions) return false;
  if (!wrapper.position || !wrapper.dimensions) return false;
  if (element._id === wrapper._id) return false; // Don't include itself
  if (element.type === 'wrapper') return false; // Don't include other wrappers

  const elementLeft = element.position.x;
  const elementTop = element.position.y;
  const elementRight = elementLeft + element.dimensions.width;
  const elementBottom = elementTop + element.dimensions.height;

  const wrapperLeft = wrapper.position.x;
  const wrapperTop = wrapper.position.y;
  const wrapperRight = wrapperLeft + wrapper.dimensions.width;
  const wrapperBottom = wrapperTop + wrapper.dimensions.height;

  // Element is completely inside wrapper if all its corners are within wrapper bounds
  return (
    elementLeft >= wrapperLeft &&
    elementRight <= wrapperRight &&
    elementTop >= wrapperTop &&
    elementBottom <= wrapperBottom
  );
};

/**
 * Get all elements that are inside a wrapper
 * @param {Object} wrapper - The wrapper element
 * @param {Array} allElements - All canvas elements
 * @returns {Array} - Array of element IDs that are inside the wrapper
 */
export const getElementsInsideWrapper = (wrapper, allElements) => {
  if (!wrapper || !allElements) return [];

  return allElements
    .filter(element => isElementInsideWrapper(element, wrapper))
    .map(element => element._id);
};

/**
 * Update wrapper's childElements based on current positions
 * @param {Object} wrapper - The wrapper element
 * @param {Array} allElements - All canvas elements
 * @returns {Object} - Updated wrapper element with childElements
 */
export const updateWrapperChildren = (wrapper, allElements) => {
  const childElementIds = getElementsInsideWrapper(wrapper, allElements);

  return {
    ...wrapper,
    content: {
      ...wrapper.content,
      childElements: childElementIds
    }
  };
};
