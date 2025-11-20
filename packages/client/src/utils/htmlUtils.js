/**
 * HTML utility functions for rich text editing
 */

/**
 * Strips HTML tags from a string to get plain text
 * @param {string} html - HTML string
 * @returns {string} Plain text without HTML tags
 */
export function stripHtml(html) {
  if (!html) return '';

  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Get text content (this handles entities and nested tags)
  return temp.textContent || temp.innerText || '';
}

/**
 * Counts the visible characters in HTML content (excluding tags)
 * @param {string} html - HTML string
 * @returns {number} Character count
 */
export function countHtmlChars(html) {
  return stripHtml(html).length;
}

/**
 * Converts plain text to HTML paragraphs
 * Preserves line breaks by creating separate paragraphs
 * @param {string} text - Plain text
 * @returns {string} HTML with paragraph tags
 */
export function textToHtml(text) {
  if (!text) return '<p></p>';

  // Split by line breaks and filter empty lines
  const lines = text.split(/\n+/).filter((line) => line.trim());

  if (lines.length === 0) return '<p></p>';

  // Wrap each line in a paragraph tag
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Plain text to escape
 * @returns {string} Escaped text safe for HTML
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Checks if content appears to be HTML (vs plain text)
 * @param {string} content - Content to check
 * @returns {boolean} True if content contains HTML tags
 */
export function isHtml(content) {
  if (!content) return false;

  // Simple check for HTML tags
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

/**
 * Formats a date in short format (e.g., "Nov 14, 2025")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateShort(date) {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  return d.toLocaleDateString('en-US', options);
}

/**
 * Inserts a formatted date at the current cursor position in TipTap
 * @param {Editor} editor - TipTap editor instance
 * @param {Date|string} date - Date to insert
 */
export function insertFormattedDate(editor, date) {
  const formattedDate = formatDateShort(date);

  // Insert the text first
  editor.chain().focus().insertContent(formattedDate).run();

  // Apply the formattedDate mark to the inserted text
  const { from } = editor.state.selection;
  editor
    .chain()
    .setTextSelection({ from: from - formattedDate.length, to: from })
    .setMark('formattedDate')
    .setTextSelection(from)
    .insertContent(' ')
    .run();
}

/**
 * Client-side HTML sanitization (basic)
 * For display purposes only - server-side sanitization is the source of truth
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove script tags and event handlers
  const scripts = temp.querySelectorAll('script');
  scripts.forEach((script) => script.remove());

  // Remove event handler attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return temp.innerHTML;
}
