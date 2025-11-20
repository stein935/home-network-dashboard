/**
 * Calendar color utilities for multi-calendar support
 * Provides deterministic color assignment based on calendar ID
 */

// High-contrast color palette for calendar differentiation
// Colors chosen for accessibility (WCAG AA compliant contrast)
export const CALENDAR_COLORS = [
  '#FF00FF', // Neon Magenta
  '#00FF00', // Neon Green
  '#1E90FF', // Dodger Blue
  '#FFD700', // Gold
  '#8A2BE2', // Electric Purple
  '#00FFFF', // Aqua / Cyan
  '#FF4500', // Neon Orange-Red
  '#32CD32', // Lime Green
  '#FF6347', // Tomato Red
  '#FFFF00', // Bright Yellow
];

/**
 * Get a unique color for a calendar based on its index in the card
 * Ensures no duplicate colors within a single card (max 5 calendars, 9 colors available)
 * @param {number} index - Index of the calendar in the card's calendar list (0-4)
 * @returns {string} Hex color code
 */
export function getCalendarColor(index) {
  // Use modulo to handle edge cases, though with max 5 calendars and 9 colors, we shouldn't need it
  const colorIndex = index % CALENDAR_COLORS.length;
  return CALENDAR_COLORS[colorIndex];
}

/**
 * Assign colors to a list of calendar IDs based on their position
 * @param {string[]} calendarIds - Array of calendar IDs
 * @returns {Object} Map of calendar ID to color
 */
export function assignCalendarColors(calendarIds) {
  const colorMap = {};
  calendarIds.forEach((calendarId, index) => {
    colorMap[calendarId] = getCalendarColor(index);
  });
  return colorMap;
}

/**
 * Build calendar metadata with assigned colors
 * @param {Array<{id: string, name: string}>} calendars - Array of calendar objects
 * @param {string[]} configuredIds - Array of configured calendar IDs
 * @returns {Object} Map of calendar ID to metadata {id, name, color}
 */
export function buildCalendarMetadata(calendars, configuredIds) {
  const metadata = {};
  const colorMap = assignCalendarColors(configuredIds);

  configuredIds.forEach((calendarId) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    metadata[calendarId] = {
      id: calendarId,
      name: calendar?.summary || calendar?.name || calendarId,
      color: colorMap[calendarId],
    };
  });

  return metadata;
}

/**
 * Get color for an event based on its calendar ID
 * @param {string} calendarId - Calendar ID from event
 * @param {Object} calendarMetadata - Calendar metadata object
 * @returns {string} Hex color code
 */
export function getEventColor(calendarId, calendarMetadata) {
  return calendarMetadata[calendarId]?.color || CALENDAR_COLORS[0];
}
