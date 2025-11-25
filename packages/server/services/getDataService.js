/**
 * GetData Service
 *
 * Core service for managing and executing data functions that fetch data
 * from external APIs and create Google Calendar events.
 */

const dataFunctionRegistry = require('../dataFunctions');
const CalendarService = require('./calendarService');
const Scraper = require('../models/Scraper'); // Will be renamed to DataFunction
const ScraperLog = require('../models/ScraperLog'); // Will be renamed to DataFunctionLog

class GetDataService {
  /**
   * Run a data function by ID
   * @param {number} functionId - Database ID of the data function
   * @param {number} userId - User ID (admin user with calendar access)
   * @returns {Promise<Object>} Result object with success status and metrics
   */
  static async runFunction(functionId, userId) {
    console.log(`Starting data function execution: functionId=${functionId}`);

    // Get function from database
    const dbFunction = Scraper.findById(functionId);
    if (!dbFunction) {
      throw new Error(`Data function not found: ${functionId}`);
    }

    if (!dbFunction.enabled) {
      throw new Error(`Data function is disabled: ${dbFunction.name}`);
    }

    // Get function definition from registry
    const functionDef = dataFunctionRegistry.getFunction(
      dbFunction.function_key ||
        dbFunction.name.toLowerCase().replace(/\s+/g, '-')
    );

    if (!functionDef) {
      const error = `Data function not found in registry: ${dbFunction.function_key || dbFunction.name}`;
      console.error(error);
      ScraperLog.create(functionId, 'error', error, 0, 0);
      throw new Error(error);
    }

    // Execute with retry logic
    try {
      const result = await this._executeWithRetry(
        functionDef,
        dbFunction,
        userId
      );

      // Update last run time
      Scraper.updateLastRun(functionId);

      // Log success
      ScraperLog.create(
        functionId,
        'success',
        result.message,
        result.eventsCreated,
        result.eventsDeleted
      );

      console.log(`Data function completed successfully: ${dbFunction.name}`);
      return result;
    } catch (error) {
      console.error(`Data function failed: ${dbFunction.name}`, error.message);

      // Log error
      ScraperLog.create(functionId, 'error', error.message, 0, 0);

      throw error;
    }
  }

  /**
   * Execute a data function with retry logic
   * @param {Object} functionDef - Function definition from registry
   * @param {Object} dbFunction - Database record for the function
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Result object
   * @private
   */
  static async _executeWithRetry(functionDef, dbFunction, userId) {
    const maxRetries = 3;
    const delays = [5 * 60 * 1000, 15 * 60 * 1000, 30 * 60 * 1000]; // 5min, 15min, 30min

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Attempt ${attempt + 1}/${maxRetries + 1} for ${functionDef.name}`
        );

        // Execute the data function
        const result = await this._executeFunctionCore(
          functionDef,
          dbFunction,
          userId
        );

        if (attempt > 0) {
          console.log(
            `Success after ${attempt} retries for ${functionDef.name}`
          );
        }

        return result;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error.message);

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new Error(
            `Failed after ${maxRetries + 1} attempts: ${error.message}`
          );
        }

        // Wait before retrying
        const delay = delays[attempt];
        console.log(`Retrying in ${delay / 1000 / 60} minutes...`);
        await this._sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute the core logic of a data function
   * @param {Object} functionDef - Function definition from registry
   * @param {Object} dbFunction - Database record for the function
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Result object
   * @private
   */
  static async _executeFunctionCore(functionDef, dbFunction, userId) {
    // Step 1: Fetch data from external API
    console.log(`Fetching data for ${functionDef.name}...`);
    const rawData = await functionDef.fetchData();

    // Step 2: Parse data into calendar events
    console.log(`Parsing data for ${functionDef.name}...`);
    const events = functionDef.parseData(rawData);

    if (!events || events.length === 0) {
      return {
        success: true,
        message: 'No events to create',
        eventsCreated: 0,
        eventsDeleted: 0,
      };
    }

    console.log(`Parsed ${events.length} events for ${functionDef.name}`);

    // Step 3: Get calendar ID
    const calendarId = dbFunction.calendar_id || functionDef.calendarId;

    if (!calendarId) {
      throw new Error('No calendar ID configured for data function');
    }

    // Step 4: Get date range for deduplication
    const dates = this._extractDatesFromEvents(events);
    const timeMin = dates.min;
    const timeMax = dates.max;

    console.log(
      `Fetching existing events from ${timeMin} to ${timeMax} for deduplication...`
    );

    // Step 5: Fetch existing events in the date range
    const existingEvents = await CalendarService.getEvents(
      userId,
      calendarId,
      timeMin,
      timeMax
    );

    console.log(`Found ${existingEvents.length} existing events in date range`);

    // Step 6: Delete existing events that match our event types
    const deletedCount = await this._deleteMatchingEvents(
      userId,
      calendarId,
      existingEvents,
      events
    );

    console.log(`Deleted ${deletedCount} existing events`);

    // Step 7: Create new events
    let createdCount = 0;
    for (const event of events) {
      try {
        await CalendarService.createEvent(userId, calendarId, event);
        createdCount++;
      } catch (error) {
        console.error(
          `Failed to create event "${event.summary}":`,
          error.message
        );
        // Continue creating other events even if one fails
      }
    }

    console.log(`Created ${createdCount} new events`);

    return {
      success: true,
      message: `Created ${createdCount} events, deleted ${deletedCount} existing events`,
      eventsCreated: createdCount,
      eventsDeleted: deletedCount,
    };
  }

  /**
   * Extract min and max dates from events for time range query
   * @param {Array} events - Array of event objects
   * @returns {Object} Object with min and max ISO date strings
   * @private
   */
  static _extractDatesFromEvents(events) {
    const dates = events
      .map((event) => event.start.date)
      .filter((date) => date)
      .sort();

    if (dates.length === 0) {
      // Default to next 7 days if no dates found
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7);

      return {
        min: now.toISOString(),
        max: endDate.toISOString(),
      };
    }

    // Return min date at start of day, max date at end of day (in UTC to avoid timezone shifts)
    const minDate = new Date(dates[0] + 'T00:00:00Z');
    const maxDate = new Date(dates[dates.length - 1] + 'T23:59:59Z');

    return {
      min: minDate.toISOString(),
      max: maxDate.toISOString(),
    };
  }

  /**
   * Delete existing events that match our event types
   * @param {number} userId - User ID
   * @param {string} calendarId - Calendar ID
   * @param {Array} existingEvents - Existing events from calendar
   * @param {Array} newEvents - New events we're about to create
   * @returns {Promise<number>} Number of events deleted
   * @private
   */
  static async _deleteMatchingEvents(
    userId,
    calendarId,
    existingEvents,
    newEvents
  ) {
    // Extract unique summary prefixes from new events
    const summaryPrefixes = new Set(
      newEvents.map((event) => event.summaryPrefix).filter((prefix) => prefix)
    );

    // Find existing events that match our prefixes
    const eventsToDelete = existingEvents.filter((event) => {
      const summary = event.summary || '';
      return Array.from(summaryPrefixes).some((prefix) =>
        summary.startsWith(prefix)
      );
    });

    console.log(
      `Found ${eventsToDelete.length} existing events matching our event types`
    );

    // Delete matching events
    let deletedCount = 0;
    for (const event of eventsToDelete) {
      try {
        await CalendarService.deleteEvent(userId, calendarId, event.id);
        deletedCount++;
      } catch (error) {
        console.error(
          `Failed to delete event "${event.summary}":`,
          error.message
        );
        // Continue deleting other events even if one fails
      }
    }

    return deletedCount;
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all data functions from database
   * @returns {Array} Array of data function records
   */
  static getAllFunctions() {
    return Scraper.getAll();
  }

  /**
   * Get a data function by ID
   * @param {number} functionId - Function ID
   * @returns {Object|null} Function record or null
   */
  static getFunction(functionId) {
    return Scraper.findById(functionId);
  }

  /**
   * Get enabled data functions
   * @returns {Array} Array of enabled data function records
   */
  static getEnabledFunctions() {
    return Scraper.getEnabled();
  }
}

module.exports = GetDataService;
