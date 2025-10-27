/**
 * Data cleaning utilities for normalizing API responses
 * Use these helpers to safely handle messy/inconsistent API data
 */

/**
 * Safely parse float with fallback
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback value if parse fails
 * @returns {number} Parsed float or fallback
 */
export function safeFloat(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parse integer with fallback
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback value if parse fails
 * @returns {number} Parsed integer or fallback
 */
export function safeInt(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Normalize date to ISO string
 * Handles multiple date formats including Unix timestamps
 * @param {any} date - Date value (string, number, Date object)
 * @returns {string|null} ISO date string or null if invalid
 */
export function normalizeDate(date) {
  if (!date) return null;

  try {
    // Handle Unix timestamp (seconds)
    if (typeof date === 'number') {
      // If > 10 digits, likely milliseconds
      const timestamp = date > 9999999999 ? date : date * 1000;
      return new Date(timestamp).toISOString();
    }

    // Handle date string or Date object
    return new Date(date).toISOString();
  } catch (error) {
    console.warn('Failed to normalize date:', date);
    return null;
  }
}

/**
 * Get nested object property safely (like lodash.get)
 * @param {Object} obj - Object to query
 * @param {string} path - Path like "user.address.city"
 * @param {any} fallback - Fallback if path not found
 * @returns {any} Value at path or fallback
 */
export function safeGet(obj, path, fallback = null) {
  if (!obj || !path) return fallback;

  return path.split('.').reduce((current, prop) =>
    current?.[prop], obj
  ) ?? fallback;
}

/**
 * Normalize price to GBP float
 * Handles string prices, currency conversion
 * @param {any} price - Price value
 * @param {string} currency - Currency code (GBP, USD, EUR)
 * @returns {number} Normalized price in GBP
 */
export function normalizePrice(price, currency = 'GBP') {
  const amount = safeFloat(price);

  // Simple currency conversion (use actual rates in production)
  const RATES = {
    'GBP': 1.0,
    'USD': 0.79,
    'EUR': 0.86
  };

  return amount * (RATES[currency] || 1.0);
}

/**
 * Normalize product name (trim, title case, clean)
 * @param {string} name - Product name
 * @returns {string} Normalized product name
 */
export function normalizeProductName(name) {
  if (!name || typeof name !== 'string') {
    return 'Unknown Product';
  }

  return name
    .trim()
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if value is valid (not null, undefined, or empty string)
 * @param {any} value - Value to check
 * @returns {boolean} True if valid
 */
export function isValid(value) {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Clamp number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalize percentage (ensure 0-100 range)
 * @param {number} value - Percentage value
 * @returns {number} Normalized percentage
 */
export function normalizePercentage(value) {
  const num = safeFloat(value);
  return clamp(num, 0, 100);
}

/**
 * Convert weight to kg (handles lbs, oz, kg)
 * @param {number} weight - Weight value
 * @param {string} unit - Unit (kg, lbs, oz, g)
 * @returns {number} Weight in kg
 */
export function normalizeWeight(weight, unit = 'kg') {
  const value = safeFloat(weight);

  const CONVERSIONS = {
    'kg': 1.0,
    'g': 0.001,
    'lbs': 0.453592,
    'oz': 0.0283495
  };

  return value * (CONVERSIONS[unit.toLowerCase()] || 1.0);
}

/**
 * Remove null/undefined values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
export function removeNulls(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}
