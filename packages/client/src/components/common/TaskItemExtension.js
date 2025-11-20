import TaskItem from '@tiptap/extension-task-item';

/**
 * Custom TaskItem extension that ensures data-checked attribute is properly set
 */
const CustomTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      checked: {
        default: false,
        parseHTML: (element) => {
          // Parse both data-checked attribute and checked input
          const dataChecked = element.getAttribute('data-checked');
          if (dataChecked) {
            return dataChecked === 'true';
          }
          // Fallback to checking the input element
          const checkbox = element.querySelector('input[type="checkbox"]');
          return checkbox?.checked || false;
        },
        renderHTML: (attributes) => {
          return {
            'data-checked': attributes.checked ? 'true' : 'false',
          };
        },
        keepOnSplit: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'li[data-type="taskItem"]',
        priority: 51,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      {
        ...HTMLAttributes,
        'data-type': 'taskItem',
        'data-checked': node.attrs.checked ? 'true' : 'false',
      },
      [
        'label',
        [
          'input',
          {
            type: 'checkbox',
            checked: node.attrs.checked ? 'checked' : null,
          },
        ],
        ['span', 0],
      ],
    ];
  },
});

export default CustomTaskItem;
