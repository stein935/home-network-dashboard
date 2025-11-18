const Scraper = require('../models/Scraper');
const ScraperLog = require('../models/ScraperLog');
const CalendarService = require('./calendarService');
const LunchMenuScraper = require('./lunchMenuScraper');

class ScraperService {
  /**
   * Run a scraper by ID
   * @param {number} scraperId - The ID of the scraper to run
   * @param {number} userId - The user ID to use for calendar access
   * @returns {Promise<Object>} - Result of the scraper run
   */
  static async runScraper(scraperId, userId) {
    console.log(`Running scraper ${scraperId}...`);

    try {
      // Get scraper config
      const scraper = Scraper.findById(scraperId);
      if (!scraper) {
        throw new Error(`Scraper ${scraperId} not found`);
      }

      console.log(`Scraping ${scraper.name} from ${scraper.url}...`);

      // Run the lunch menu scraper
      const menuData = await LunchMenuScraper.scrape(scraper.url);

      console.log(`Scraped ${menuData.length} days of menu data`);

      // Get existing events to check for duplicates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const existingEvents = await CalendarService.getEvents(
        userId,
        scraper.calendar_id,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );

      console.log(`Found ${existingEvents.length} existing events in calendar`);

      let eventsCreated = 0;
      let eventsUpdated = 0;

      // Create or update events for each day's menu
      for (const item of menuData) {
        // Skip days with no menu
        if (item.hot === 'Not Available' && item.bistro === 'Not Available') {
          continue;
        }

        // Create Hot event (only if available)
        if (item.hot !== 'Not Available') {
          const hotEventResult = await this.createOrUpdateEvent(
            userId,
            scraper.calendar_id,
            item.date,
            'Hot',
            item.hot,
            existingEvents
          );
          if (hotEventResult.created) eventsCreated++;
          if (hotEventResult.updated) eventsUpdated++;
        }

        // Create Bistro event (only if available)
        if (item.bistro !== 'Not Available') {
          const bistroEventResult = await this.createOrUpdateEvent(
            userId,
            scraper.calendar_id,
            item.date,
            'Bistro',
            item.bistro,
            existingEvents
          );
          if (bistroEventResult.created) eventsCreated++;
          if (bistroEventResult.updated) eventsUpdated++;
        }
      }

      // Update last_run timestamp
      Scraper.updateLastRun(scraperId);

      // Log success
      ScraperLog.create(
        scraperId,
        'success',
        `Created ${eventsCreated} events, updated ${eventsUpdated} events`,
        eventsCreated,
        eventsUpdated
      );

      console.log(
        `Scraper ${scraperId} completed successfully: ${eventsCreated} created, ${eventsUpdated} updated`
      );

      return {
        success: true,
        eventsCreated,
        eventsUpdated,
        message: `Successfully processed ${menuData.length} days`,
      };
    } catch (error) {
      console.error(`Scraper ${scraperId} failed:`, error);

      // Log error
      ScraperLog.create(scraperId, 'error', error.message, 0, 0);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Create or update a calendar event
   * @param {number} userId - User ID for calendar access
   * @param {string} calendarId - Calendar ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} type - Event type (Hot or Bistro)
   * @param {string} menuItem - Menu item description
   * @param {Array} existingEvents - Existing calendar events
   * @returns {Promise<Object>} - Result with created/updated flags
   */
  static async createOrUpdateEvent(
    userId,
    calendarId,
    date,
    type,
    menuItem,
    existingEvents
  ) {
    const eventSummary = `${type == 'Hot' ? '🔥 ' + type : '🍱 ' + type}: ${menuItem}`;

    // Check if event already exists
    const existing = existingEvents.find((event) => {
      return (
        event.start.startsWith(date) && event.summary.startsWith(`${type}:`)
      );
    });

    // For all-day events, end date must be exclusive (next day)
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const eventData = {
      summary: eventSummary,
      description: `School lunch menu - ${type == 'Hot' ? '🔥 ' + type : '🍱 ' + type} option`,
      start: {
        date: date, // All-day event (YYYY-MM-DD)
      },
      end: {
        date: endDate.toISOString().split('T')[0], // Exclusive end date (next day)
      },
    };

    if (existing) {
      // Update if menu item changed
      if (existing.summary !== eventSummary) {
        await CalendarService.updateEvent(
          userId,
          calendarId,
          existing.id,
          eventData
        );
        return { created: false, updated: true };
      }
      return { created: false, updated: false };
    } else {
      // Create new event
      await CalendarService.createEvent(userId, calendarId, eventData);
      return { created: true, updated: false };
    }
  }

  /**
   * Run all enabled scrapers
   * @param {number} userId - User ID to use for calendar access (typically admin)
   * @returns {Promise<Array>} - Results for all scrapers
   */
  static async runAllScrapers(userId) {
    const scrapers = Scraper.getEnabled();
    console.log(`Running ${scrapers.length} enabled scrapers...`);

    const results = [];
    for (const scraper of scrapers) {
      const result = await this.runScraper(scraper.id, userId);
      results.push({
        scraperId: scraper.id,
        scraperName: scraper.name,
        ...result,
      });
    }

    return results;
  }
}

module.exports = ScraperService;
