/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex) => {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
};

/**
 * Convert RGB to HSL
 */
export const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

/**
 * Convert HSL to RGB
 */
export const hslToRgb = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

/**
 * Convert RGB to hex
 */
export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Get adaptive color for TEXT based on theme
 * If color is dark and we're in dark mode, make it lighter
 * If color is light and we're in light mode, make it darker
 */
export const getAdaptiveColor = (color, isDarkMode) => {
  // Handle transparent
  if (!color || color === 'transparent') {
    return color;
  }

  // Handle rgba
  if (color.startsWith('rgba')) {
    return color; // Keep rgba as is for now
  }

  try {
    // Convert to RGB
    const rgb = hexToRgb(color);

    // Convert to HSL
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Determine if color is dark (lightness < 50%)
    const isDarkColor = hsl.l < 50;

    // Adjust lightness based on theme and color brightness
    let newLightness = hsl.l;

    if (isDarkMode && isDarkColor) {
      // In dark mode with dark color - make it lighter (for text visibility)
      // Invert the lightness but keep it visible
      newLightness = 100 - hsl.l;
      // Ensure it's not too bright (cap at 90%)
      newLightness = Math.min(newLightness, 90);
    } else if (!isDarkMode && !isDarkColor) {
      // In light mode with light color - make it darker (for text visibility)
      // Invert the lightness but keep it visible
      newLightness = 100 - hsl.l;
      // Ensure it's not too dark (floor at 10%)
      newLightness = Math.max(newLightness, 10);
    }

    // Convert back to RGB
    const newRgb = hslToRgb(hsl.h, hsl.s, newLightness);

    // Convert to hex
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  } catch (error) {
    // If conversion fails, return original color
    console.warn('Color conversion failed:', error);
    return color;
  }
};

/**
 * Get adaptive color for BACKGROUND based on theme
 * If color is light and we're in dark mode, make it darker
 * If color is dark and we're in light mode, make it lighter
 */
export const getAdaptiveBackgroundColor = (color, isDarkMode) => {
  // Handle transparent
  if (!color || color === 'transparent') {
    return color;
  }

  // Handle rgba
  if (color.startsWith('rgba')) {
    return color; // Keep rgba as is for now
  }

  try {
    // Convert to RGB
    const rgb = hexToRgb(color);

    // Convert to HSL
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Determine if color is dark (lightness < 50%)
    const isDarkColor = hsl.l < 50;

    // Adjust lightness based on theme and color brightness
    let newLightness = hsl.l;

    if (isDarkMode && !isDarkColor) {
      // In dark mode with light color - make it darker (for background)
      // Invert the lightness but keep it visible
      newLightness = 100 - hsl.l;
      // Ensure it's not too dark (floor at 3% for dark canvas match)
      newLightness = Math.max(newLightness, 3);
    } else if (!isDarkMode && isDarkColor) {
      // In light mode with dark color - make it lighter (for background)
      // Invert the lightness but keep it visible
      newLightness = 100 - hsl.l;
      // Ensure it's not too bright (cap at 90%)
      newLightness = Math.min(newLightness, 90);
    }

    // Convert back to RGB
    const newRgb = hslToRgb(hsl.h, hsl.s, newLightness);

    // Convert to hex
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  } catch (error) {
    // If conversion fails, return original color
    console.warn('Color conversion failed:', error);
    return color;
  }
};

/**
 * Check if color is dark
 */
export const isColorDark = (color) => {
  if (!color || color === 'transparent') return false;

  try {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.l < 50;
  } catch (error) {
    return false;
  }
};
