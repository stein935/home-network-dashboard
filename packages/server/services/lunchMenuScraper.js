const puppeteer = require('puppeteer');

class LunchMenuScraper {
  /**
   * Scrape lunch menu from LinqConnect
   * @param {string} url - The LinqConnect menu URL
   * @returns {Promise<Array>} - Array of menu items: [{ date, hot, bistro }]
   */
  static async scrape(url) {
    let browser;
    try {
      console.log('Launching Puppeteer browser...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      console.log(`Navigating to ${url}...`);

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      console.log('Page loaded, waiting for calendar content...');

      // Wait for the menu container to load
      await page.waitForSelector('.menu-container-group', { timeout: 10000 });

      // Additional wait for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('Extracting menu data...');

      // Extract menu data from the page
      const menuData = await page.evaluate(() => {
        const items = [];

        // Find the menu container
        const menuContainer = document.querySelector('.menu-container-group');
        if (!menuContainer) {
          return items;
        }

        // Get all direct children (all cells in the grid)
        const allCells = Array.from(menuContainer.children);

        if (allCells.length === 0) {
          return items;
        }

        // The layout is a grid with 5 columns (Mon-Fri)
        // Structure repeats: weekday headers, dates, HOT LUNCH, BISTRO, (possibly other rows)
        // We need to find ALL date rows and process each week

        const COLUMNS = 5; // Monday through Friday

        // Find ALL date rows (rows that contain only numbers)
        const dateRowIndices = [];
        for (let i = 0; i < allCells.length; i += COLUMNS) {
          const rowCells = allCells.slice(i, i + COLUMNS);

          // Skip if we don't have a full row
          if (rowCells.length < COLUMNS) continue;

          const allNumbers = rowCells.every((cell) => {
            const text = cell.textContent.trim();
            return /^\d{1,2}$/.test(text);
          });

          if (allNumbers) {
            dateRowIndices.push(i);
          }
        }

        if (dateRowIndices.length === 0) {
          return items;
        }

        // Process each week
        for (const dateRowIndex of dateRowIndices) {
          // Extract dates from this week's date row
          const dates = allCells
            .slice(dateRowIndex, dateRowIndex + COLUMNS)
            .map((cell) => cell.textContent.trim());

          // Initialize arrays for this week's menu items
          const hotLunchItems = Array(COLUMNS).fill('Not Available');
          const bistroItems = Array(COLUMNS).fill('Not Available');

          // Look for HOT LUNCH row (typically next row after dates)
          const hotLunchRowStart = dateRowIndex + COLUMNS;

          // Extract HOT LUNCH items
          for (let col = 0; col < COLUMNS; col++) {
            const cellIndex = hotLunchRowStart + col;
            if (cellIndex < allCells.length) {
              const cell = allCells[cellIndex];
              const text = cell.textContent.trim();

              if (text.includes('HOT LUNCH')) {
                // Extract the item after "HOT LUNCH"
                const hotLunchMatch = text.match(/HOT LUNCH\s+([^]+?)(?:\s+(?:FRUIT|WITH|VEGETABLE|DESSERT|EXTRA ITEM|$))/);
                if (hotLunchMatch && hotLunchMatch[1]) {
                  hotLunchItems[col] = hotLunchMatch[1].trim();
                }
              }
            }
          }

          // Look for BISTRO row (typically two rows after dates)
          const bistroRowStart = dateRowIndex + COLUMNS * 2;

          // Extract BISTRO items
          for (let col = 0; col < COLUMNS; col++) {
            const cellIndex = bistroRowStart + col;
            if (cellIndex < allCells.length) {
              const cell = allCells[cellIndex];
              const text = cell.textContent.trim();

              if (text.includes('BISTRO')) {
                // Extract the item after "BISTRO"
                const bistroMatch = text.match(/BISTRO\s+(.+)/);
                if (bistroMatch && bistroMatch[1]) {
                  bistroItems[col] = bistroMatch[1].trim();
                }
              }
            }
          }

          // Combine dates with menu items for this week
          for (let i = 0; i < COLUMNS; i++) {
            if (dates[i]) {
              items.push({
                dateStr: dates[i],
                hot: hotLunchItems[i],
                bistro: bistroItems[i],
              });
            }
          }
        }

        return items;
      });

      console.log(`Extracted ${menuData.length} menu items from page`);
      if (menuData.length > 0) {
        console.log(
          'Sample data:',
          JSON.stringify(menuData.slice(0, 3), null, 2)
        );
      }

      // Parse dates and structure the data
      const structuredData = this.parseMenuData(menuData);

      console.log(
        `Structured ${structuredData.length} menu items with valid dates`
      );

      return structuredData;
    } catch (error) {
      console.error('Error scraping lunch menu:', error);
      throw new Error(`Failed to scrape lunch menu: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Parse extracted menu data and normalize dates
   * @param {Array} menuData - Raw menu data from page
   * @returns {Array} - Structured menu data with proper dates
   */
  static parseMenuData(menuData) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    return menuData
      .map((item) => {
        try {
          // Parse the date number
          const day = parseInt(item.dateStr, 10);

          if (isNaN(day) || day < 1 || day > 31) {
            console.warn(`Invalid day number: ${item.dateStr}`);
            return null;
          }

          // Create date for current month
          const date = new Date(currentYear, currentMonth, day);

          return {
            date: date.toISOString().split('T')[0], // YYYY-MM-DD format
            hot: this.cleanMenuText(item.hot),
            bistro: this.cleanMenuText(item.bistro),
          };
        } catch (error) {
          console.error('Error parsing menu item:', error);
          return null;
        }
      })
      .filter((item) => item !== null);
  }

  /**
   * Clean up menu text
   * @param {string} text - Raw menu text
   * @returns {string} - Cleaned text
   */
  static cleanMenuText(text) {
    if (!text || text === 'Not Available') return text;

    // Remove common prefixes, but preserve "Bistro Box" and "Bistro Variety"
    return text
      .replace(/^(hot lunch|hot):?\s*/i, '') // Remove "Hot Lunch" or "Hot" prefix
      .replace(/^bistro\s+(?!box|variety)/i, '') // Remove standalone "Bistro" but keep "Bistro Box" and "Bistro Variety"
      .replace(/^\*/, '') // Remove leading asterisks
      .replace(/\^/g, '') // Remove carets
      .trim();
  }
}

module.exports = LunchMenuScraper;
