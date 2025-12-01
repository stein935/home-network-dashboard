/**
 * Data Functions Registry
 *
 * This file loads and exports all data functions for the GetData Service.
 * Each data function is a module that defines how to fetch and parse data
 * from an external source and transform it into calendar events.
 */

const marcyLunches = require('./marcyLunches');

/**
 * Registry of all available data functions
 * Key: function_key (used in database)
 * Value: function definition object
 */
const dataFunctions = {
  'marcy-lunches': marcyLunches,
};

/**
 * Get all registered data functions
 * @returns {Object} Object with function keys as properties
 */
function getAllFunctions() {
  return dataFunctions;
}

/**
 * Get a specific data function by key
 * @param {string} functionKey - The unique key for the function
 * @returns {Object|null} Function definition or null if not found
 */
function getFunction(functionKey) {
  return dataFunctions[functionKey] || null;
}

/**
 * Get array of all function keys
 * @returns {string[]} Array of function keys
 */
function getFunctionKeys() {
  return Object.keys(dataFunctions);
}

module.exports = {
  getAllFunctions,
  getFunction,
  getFunctionKeys,
  dataFunctions,
};
