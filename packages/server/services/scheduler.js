const cron = require('node-cron');
const Scraper = require('../models/Scraper'); // Now uses data_functions table
const GetDataService = require('./getDataService');
const User = require('../models/User');

/**
 * Scheduler Service
 * Manages scheduled execution of data functions using cron.
 *
 * Note: This scheduler now works with data functions (formerly scrapers).
 * The Scraper model has been updated to use the data_functions table.
 */
class Scheduler {
  constructor() {
    this.tasks = new Map(); // Map of functionId -> cron task
    this.adminUserId = null;
  }

  /**
   * Initialize the scheduler with all enabled data functions
   */
  async initialize() {
    console.log('Initializing data function scheduler...');

    // Get first admin user to run data functions as
    const admins = User.getAll().filter((user) => user.role === 'admin');
    if (admins.length === 0) {
      console.warn(
        'No admin users found. Data functions will not be scheduled until an admin exists.'
      );
      return;
    }

    this.adminUserId = admins[0].id;
    console.log(`Data functions will run as user: ${admins[0].email}`);

    // Get all enabled data functions
    const dataFunctions = Scraper.getEnabled();
    console.log(`Found ${dataFunctions.length} enabled data functions`);

    // Schedule each data function
    for (const dataFunction of dataFunctions) {
      this.scheduleDataFunctionTask(dataFunction);
    }

    console.log('Scheduler initialized successfully');
  }

  /**
   * Schedule a data function task
   * @param {Object} dataFunction - Data function object from database
   */
  scheduleDataFunctionTask(dataFunction) {
    // Stop existing task if any
    if (this.tasks.has(dataFunction.id)) {
      this.tasks.get(dataFunction.id).stop();
      this.tasks.delete(dataFunction.id);
    }

    // Validate cron expression
    if (!cron.validate(dataFunction.cron_schedule)) {
      console.error(
        `Invalid cron schedule for data function ${dataFunction.id}: ${dataFunction.cron_schedule}`
      );
      return;
    }

    console.log(
      `Scheduling data function ${dataFunction.id} (${dataFunction.name}) with schedule: ${dataFunction.cron_schedule}`
    );

    // Create new task
    const task = cron.schedule(dataFunction.cron_schedule, async () => {
      console.log(
        `Cron triggered data function ${dataFunction.id} (${dataFunction.name})`
      );
      if (this.adminUserId) {
        try {
          await GetDataService.runFunction(dataFunction.id, this.adminUserId);
        } catch (error) {
          console.error(
            `Failed to run data function ${dataFunction.name}:`,
            error.message
          );
        }
      } else {
        console.error('No admin user available to run data function');
      }
    });

    this.tasks.set(dataFunction.id, task);
  }

  /**
   * Update scheduler for a specific data function (called when config changes)
   * @param {number} functionId - ID of the data function to update
   */
  updateSchedule(functionId) {
    const dataFunction = Scraper.findById(functionId);
    if (!dataFunction) {
      console.error(`Data function ${functionId} not found`);
      return;
    }

    if (dataFunction.enabled) {
      this.scheduleDataFunctionTask(dataFunction);
    } else {
      this.removeSchedule(functionId);
    }
  }

  /**
   * Remove a scheduled task
   * @param {number} functionId - ID of the data function to remove
   */
  removeSchedule(functionId) {
    if (this.tasks.has(functionId)) {
      console.log(`Removing schedule for data function ${functionId}`);
      this.tasks.get(functionId).stop();
      this.tasks.delete(functionId);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    console.log('Stopping all scheduled tasks...');
    for (const [functionId, task] of this.tasks.entries()) {
      task.stop();
      console.log(`Stopped data function ${functionId}`);
    }
    this.tasks.clear();
  }

  // Backward compatibility aliases
  scheduleScraperTask(scraper) {
    return this.scheduleDataFunctionTask(scraper);
  }
}

// Export singleton instance
const scheduler = new Scheduler();
module.exports = scheduler;
