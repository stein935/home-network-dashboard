import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap extension for formatted date pills
 */
const FormattedDate = Mark.create({
  name: 'formattedDate',

  // Allow formatted-date class
  addAttributes() {
    return {
      class: {
        default: 'formatted-date',
        parseHTML: (element) => element.getAttribute('class'),
        renderHTML: (attributes) => {
          return {
            class: attributes.class,
          };
        },
      },
    };
  },

  // Parse HTML <span class="formatted-date">
  parseHTML() {
    return [
      {
        tag: 'span.formatted-date',
        getAttrs: (element) => {
          return element.classList.contains('formatted-date') ? {} : false;
        },
      },
    ];
  },

  // Render as <span class="formatted-date">
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: 'formatted-date' }),
      0,
    ];
  },

  // Make it non-inclusive so typing after date pill doesn't go inside it
  inclusive: false,
});

export default FormattedDate;
