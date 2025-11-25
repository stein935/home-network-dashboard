/**
 * Marcy Lunches Data Function
 *
 * Fetches school lunch menu data from LinqConnect API and creates
 * Google Calendar events for Hot Lunch and Bistro options.
 */

const axios = require('axios');

/**
 * Data function configuration
 */
module.exports = {
  name: 'Marcy Lunches',
  functionKey: 'marcy-lunches',
  calendarId:
    '2b93b24f73e19d7d7664b8fd9c16dc12f90892b97f2cb069a5504568a0eaf5ba@group.calendar.google.com', // Target calendar
  schedule: '0 6 * * *', // Daily at 6:00 AM
  enabled: true,

  /**
   * Fetch lunch menu data from LinqConnect API
   * @returns {Promise<Object>} Raw API response data
   */
  fetchData: async function () {
    const today = new Date();
    const startDate = addDays(today, 1); // Tomorrow
    const endDate = addDays(today, 7); // +7 days

    const params = {
      buildingId: 'ff05b302-22d7-ee11-a71c-a811a99a3020',
      districtId: '37aa0b35-eba0-ee11-839d-b338dc280a64',
      startDate: formatDateForApi(startDate),
      endDate: formatDateForApi(endDate),
    };

    try {
      const response = await axios.get(
        'https://api.linqconnect.com/api/FamilyMenu',
        {
          params,
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data || !response.data.FamilyMenuSessions) {
        throw new Error('Invalid API response structure');
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('API request timed out after 30 seconds');
      } else if (error.response) {
        throw new Error(
          `API returned ${error.response.status}: ${error.response.statusText}`
        );
      } else if (error.request) {
        throw new Error('No response received from API');
      }
      throw error;
    }
  },

  /**
   * Parse API response and transform into calendar events
   * @param {Object} apiData - Raw API response
   * @returns {Array<Object>} Array of calendar event objects
   */
  parseData: function (apiData) {
    const events = [];

    // Extract menu days from API response
    const days = apiData.FamilyMenuSessions?.[0]?.MenuPlans?.[0]?.Days || [];

    if (days.length === 0) {
      console.warn('No menu days found in API response');
      return events;
    }

    for (const day of days) {
      try {
        const date = formatDateForCalendar(day.Date);
        const menuMeals = day.MenuMeals || [];

        // Extract Hot Lunch event
        const hotLunchEvent = createHotLunchEvent(menuMeals, date);
        if (hotLunchEvent) {
          events.push(hotLunchEvent);
        }

        // Extract Bistro event
        const bistroEvent = createBistroEvent(menuMeals, date);
        if (bistroEvent) {
          events.push(bistroEvent);
        }
      } catch (error) {
        console.error(`Error parsing day ${day.Date}:`, error.message);
        // Continue processing other days
      }
    }

    return events;
  },
};

/**
 * Helper Functions
 */

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date for LinqConnect API (M-D-YYYY)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForApi(date) {
  const month = date.getMonth() + 1; // No leading zero
  const day = date.getDate(); // No leading zero
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

/**
 * Format date for Google Calendar API (YYYY-MM-DD)
 * @param {string} apiDate - Date from API (M/D/YYYY or M-D-YYYY)
 * @returns {string} ISO date string
 */
function formatDateForCalendar(apiDate) {
  // Handle both slash and hyphen separators
  const parts = apiDate.split(/[/-]/);
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Pad with leading zeros
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');

  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Get next day in ISO format (for all-day event end date)
 * @param {string} isoDate - Date in YYYY-MM-DD format
 * @returns {string} Next day in YYYY-MM-DD format
 */
function getNextDay(isoDate) {
  // Parse the date components directly to avoid timezone issues
  const [year, month, day] = isoDate.split('-').map(Number);

  // Create date in UTC to avoid timezone shifts
  const date = new Date(Date.UTC(year, month - 1, day));

  // Add 1 day
  date.setUTCDate(date.getUTCDate() + 1);

  // Return in YYYY-MM-DD format
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getUTCDate()).padStart(2, '0');

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/**
 * Find a menu meal by name or category
 * @param {Array} menuMeals - Array of menu meals
 * @param {string} searchTerm - Name to search for
 * @returns {Object|null} Menu meal object or null
 */
function findMenuMeal(menuMeals, searchTerm) {
  return (
    menuMeals.find(
      (meal) =>
        meal.MenuMealName === searchTerm ||
        meal.RecipeCategories?.some((cat) => cat.CategoryName === searchTerm)
    ) || null
  );
}

/**
 * Extract recipes from a menu meal by category name
 * @param {Object} menuMeal - Menu meal object
 * @param {string} categoryName - Category to extract
 * @returns {Array} Array of recipe objects
 */
function extractRecipesByCategory(menuMeal, categoryName) {
  if (!menuMeal || !menuMeal.RecipeCategories) return [];

  const category = menuMeal.RecipeCategories.find(
    (cat) => cat.CategoryName === categoryName
  );

  return category?.Recipes || [];
}

/**
 * Extract all recipes from a menu meal grouped by category
 * @param {Object} menuMeal - Menu meal object
 * @returns {Object} Object with category names as keys, recipe arrays as values
 */
function extractAllRecipesByCategory(menuMeal) {
  if (!menuMeal || !menuMeal.RecipeCategories) return {};

  const result = {};
  for (const category of menuMeal.RecipeCategories) {
    if (category.Recipes && category.Recipes.length > 0) {
      result[category.CategoryName] = category.Recipes;
    }
  }
  return result;
}

/**
 * Filter shared items that are not duplicates of main items
 * @param {Array} sharedRecipes - Recipes from Shared Items
 * @param {Array} mainRecipes - Recipes from main category (Hot Lunch or Bistro)
 * @returns {Array} Filtered shared recipes
 */
function filterSharedItems(sharedRecipes, mainRecipes) {
  const mainRecipeNames = new Set(
    mainRecipes.map((recipe) => recipe.RecipeName)
  );

  return sharedRecipes.filter(
    (recipe) => !mainRecipeNames.has(recipe.RecipeName)
  );
}

/**
 * Build event description from recipes
 * @param {string} mainTitle - Main category title (e.g., "Hot lunch")
 * @param {Object} recipesByCategory - Object with categories and recipes
 * @returns {string} Formatted description
 */
function buildDescription(mainTitle, recipesByCategory) {
  const lines = [];

  // Add main category first
  if (recipesByCategory[mainTitle]) {
    const recipeNames = recipesByCategory[mainTitle]
      .map((r) => r.RecipeName)
      .join(', ');
    lines.push(`${mainTitle}: ${recipeNames}`);
    delete recipesByCategory[mainTitle]; // Remove so we don't duplicate
  }

  // Add other categories
  for (const [categoryName, recipes] of Object.entries(recipesByCategory)) {
    if (recipes.length > 0) {
      const recipeNames = recipes.map((r) => r.RecipeName).join(', ');
      lines.push(`${categoryName}: ${recipeNames}`);
    }
  }

  return lines.join('\n');
}

/**
 * Create Hot Lunch calendar event
 * @param {Array} menuMeals - Array of menu meals for the day
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object|null} Calendar event object or null
 */
function createHotLunchEvent(menuMeals, date) {
  // Find meals
  const hotLunchMeal = findMenuMeal(menuMeals, 'Hot Lunch');
  const sharedMeal = findMenuMeal(menuMeals, 'Shared Items');

  if (!hotLunchMeal) {
    console.warn(`No Hot Lunch found for ${date}`);
    return null;
  }

  // Extract Hot Lunch recipes
  const hotLunchRecipes = extractRecipesByCategory(hotLunchMeal, 'Hot Lunch');

  if (hotLunchRecipes.length === 0) {
    console.warn(`No recipes in Hot Lunch category for ${date}`);
    return null;
  }

  // Get first item for summary
  const firstItem = hotLunchRecipes[0].RecipeName;

  // Extract all categories from Hot Lunch meal
  const hotLunchCategories = extractAllRecipesByCategory(hotLunchMeal);

  // Extract and filter shared items
  let sharedCategories = {};
  if (sharedMeal) {
    const allSharedRecipes = [];
    const sharedCategoriesRaw = extractAllRecipesByCategory(sharedMeal);

    // Flatten all shared recipes
    for (const recipes of Object.values(sharedCategoriesRaw)) {
      allSharedRecipes.push(...recipes);
    }

    // Filter out duplicates
    const filteredShared = filterSharedItems(allSharedRecipes, hotLunchRecipes);

    // Re-group by category
    for (const recipe of filteredShared) {
      // Find original category
      for (const [catName, recipes] of Object.entries(sharedCategoriesRaw)) {
        if (recipes.some((r) => r.RecipeName === recipe.RecipeName)) {
          if (!sharedCategories[catName]) sharedCategories[catName] = [];
          sharedCategories[catName].push(recipe);
          break;
        }
      }
    }
  }

  // Combine categories for description
  const allCategories = { ...hotLunchCategories, ...sharedCategories };

  // Build description
  const description = buildDescription('Hot Lunch', allCategories);

  return {
    summary: `🔥 ${firstItem}`,
    description,
    start: { date },
    end: { date: getNextDay(date) },
    summaryPrefix: '🔥', // For deduplication
  };
}

/**
 * Create Bistro calendar event
 * @param {Array} menuMeals - Array of menu meals for the day
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object|null} Calendar event object or null
 */
function createBistroEvent(menuMeals, date) {
  // Find meals
  const bistroMeal = findMenuMeal(menuMeals, 'Bistro Box');
  const sharedMeal = findMenuMeal(menuMeals, 'Shared Items');

  if (!bistroMeal) {
    console.warn(`No Bistro found for ${date}`);
    return null;
  }

  // Extract Bistro recipes
  const bistroRecipes = extractRecipesByCategory(bistroMeal, 'Bistro');

  if (bistroRecipes.length === 0) {
    console.warn(`No recipes in Bistro category for ${date}`);
    return null;
  }

  // Get bistro box name for summary
  const bistroBoxName = bistroRecipes[0].RecipeName;

  // Extract all categories from Bistro meal
  const bistroCategories = extractAllRecipesByCategory(bistroMeal);

  // Extract and filter shared items
  let sharedCategories = {};
  if (sharedMeal) {
    const allSharedRecipes = [];
    const sharedCategoriesRaw = extractAllRecipesByCategory(sharedMeal);

    // Flatten all shared recipes
    for (const recipes of Object.values(sharedCategoriesRaw)) {
      allSharedRecipes.push(...recipes);
    }

    // Filter out duplicates
    const filteredShared = filterSharedItems(allSharedRecipes, bistroRecipes);

    // Re-group by category
    for (const recipe of filteredShared) {
      // Find original category
      for (const [catName, recipes] of Object.entries(sharedCategoriesRaw)) {
        if (recipes.some((r) => r.RecipeName === recipe.RecipeName)) {
          if (!sharedCategories[catName]) sharedCategories[catName] = [];
          sharedCategories[catName].push(recipe);
          break;
        }
      }
    }
  }

  // Combine categories for description
  const allCategories = { ...bistroCategories, ...sharedCategories };

  // Build description
  const description = buildDescription('Bistro', allCategories);

  return {
    summary: `🍱 ${bistroBoxName}`,
    description,
    start: { date },
    end: { date: getNextDay(date) },
    summaryPrefix: '🍱', // For deduplication
  };
}
