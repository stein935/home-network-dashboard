const cron = require('node-cron');
const Scraper = require('../models/Scraper');
const ScraperService = require('./scraperService');
const User = require('../models/User');

class Scheduler {
  constructor() {
    this.tasks = new Map(); // Map of scraperId -> cron task
    this.adminUserId = null;
  }

  /**
   * Initialize the scheduler with all enabled scrapers
   */
  async initialize() {
    console.log('Initializing scraper scheduler...');

    // Get first admin user to run scrapers as
    const admins = User.getAll().filter((user) => user.role === 'admin');
    if (admins.length === 0) {
      console.warn(
        'No admin users found. Scrapers will not be scheduled until an admin exists.'
      );
      return;
    }

    this.adminUserId = admins[0].id;
    console.log(`Scrapers will run as user: ${admins[0].email}`);

    // Get all enabled scrapers
    const scrapers = Scraper.getEnabled();
    console.log(`Found ${scrapers.length} enabled scrapers`);

    // Schedule each scraper
    for (const scraper of scrapers) {
      this.scheduleScraperTask(scraper);
    }

    console.log('Scheduler initialized successfully');
  }

  /**
   * Schedule a scraper task
   * @param {Object} scraper - Scraper object from database
   */
  scheduleScraperTask(scraper) {
    // Stop existing task if any
    if (this.tasks.has(scraper.id)) {
      this.tasks.get(scraper.id).stop();
      this.tasks.delete(scraper.id);
    }

    // Validate cron expression
    if (!cron.validate(scraper.cron_schedule)) {
      console.error(
        `Invalid cron schedule for scraper ${scraper.id}: ${scraper.cron_schedule}`
      );
      return;
    }

    console.log(
      `Scheduling scraper ${scraper.id} (${scraper.name}) with schedule: ${scraper.cron_schedule}`
    );

    // Create new task
    const task = cron.schedule(scraper.cron_schedule, async () => {
      console.log(`Cron triggered scraper ${scraper.id} (${scraper.name})`);
      if (this.adminUserId) {
        await ScraperService.runScraper(scraper.id, this.adminUserId);
      } else {
        console.error('No admin user available to run scraper');
      }
    });

    this.tasks.set(scraper.id, task);
  }

  /**
   * Update scheduler for a specific scraper (called when config changes)
   * @param {number} scraperId - ID of the scraper to update
   */
  updateSchedule(scraperId) {
    const scraper = Scraper.findById(scraperId);
    if (!scraper) {
      console.error(`Scraper ${scraperId} not found`);
      return;
    }

    if (scraper.enabled) {
      this.scheduleScraperTask(scraper);
    } else {
      this.removeSchedule(scraperId);
    }
  }

  /**
   * Remove a scheduled task
   * @param {number} scraperId - ID of the scraper to remove
   */
  removeSchedule(scraperId) {
    if (this.tasks.has(scraperId)) {
      console.log(`Removing schedule for scraper ${scraperId}`);
      this.tasks.get(scraperId).stop();
      this.tasks.delete(scraperId);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    console.log('Stopping all scheduled tasks...');
    for (const [scraperId, task] of this.tasks.entries()) {
      task.stop();
      console.log(`Stopped scraper ${scraperId}`);
    }
    this.tasks.clear();
  }
}

// Export singleton instance
const scheduler = new Scheduler();
module.exports = scheduler;
