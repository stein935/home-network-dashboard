import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { marked } from 'marked';
import FormattedDate from './FormattedDateExtension';
import { Dialog } from '@common/Dialog';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Calendar,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
} from 'lucide-react';
import {
  countHtmlChars,
  insertFormattedDate,
  formatDateShort,
} from '@utils/htmlUtils';

/**
 * Detects if pasted text looks like markdown
 * @param {string} text - Text to check
 * @returns {boolean} - True if text looks like markdown
 */
function looksLikeMarkdown(text) {
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headings: # Header
    /\*\*[^*]+\*\*/m, // Bold: **text**
    /\*[^*]+\*/m, // Italic: *text*
    /\[[^\]]+\]\([^)]+\)/m, // Links: [text](url)
    /^[-*+]\s/m, // Unordered lists: - item
    /^\d+\.\s/m, // Ordered lists: 1. item
    /^[-*+]?\s*\[[x\s]\]/m, // Task lists: - [ ] task OR [ ] task (with or without dash)
    /```[\s\S]*```/m, // Code blocks: ```code```
    /`[^`]+`/m, // Inline code: `code`
    /^>\s/m, // Blockquotes: > quote
    /^[-*_]{3,}\s*$/m, // Horizontal rules: ---, ___, ***
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
}

/**
 * Pre-process text to convert non-standard task list format to standard markdown
 * Converts "[ ] Task" to "- [ ] Task"
 * @param {string} text - Text to process
 * @returns {string} - Processed text
 */
function preprocessTaskLists(text) {
  // Split into lines
  const lines = text.split('\n');
  const processedLines = lines.map((line) => {
    // Match task lists that don't start with a dash
    // Pattern: optional whitespace, then [ ] or [x], then space and text
    const taskMatch = line.match(/^(\s*)(\[[x\s]\])(\s+.+)/i);
    if (taskMatch) {
      // Add dash before the checkbox
      const indent = taskMatch[1];
      const checkbox = taskMatch[2];
      const rest = taskMatch[3];
      return `${indent}- ${checkbox}${rest}`;
    }
    return line;
  });

  return processedLines.join('\n');
}

// Configure marked for GitHub-flavored markdown with task lists
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

/**
 * Convert marked's task list HTML to TipTap's expected format
 * @param {string} html - HTML from marked parser
 * @returns {string} - HTML with TipTap task list format
 */
function convertTaskListsToTipTap(html) {
  // Create a temporary DOM element to parse the HTML
  const div = document.createElement('div');
  div.innerHTML = html;

  // Find all list items with checkboxes
  const listItems = div.querySelectorAll('li');
  listItems.forEach((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    if (checkbox) {
      // This is a task list item
      const isChecked = checkbox.checked || checkbox.hasAttribute('checked');

      // Get the parent ul
      const ul = li.parentElement;
      if (ul && ul.tagName === 'UL') {
        // Mark the ul as a task list
        ul.setAttribute('data-type', 'taskList');
      }

      // CRITICAL: Set data-type="taskItem" on the li (required by TipTap schema)
      li.setAttribute('data-type', 'taskItem');

      // Set data-checked attribute on the li
      li.setAttribute('data-checked', isChecked ? 'true' : 'false');

      // Keep the checkbox element but ensure it has the correct checked state
      checkbox.checked = isChecked;
      if (isChecked) {
        checkbox.setAttribute('checked', 'checked');
      } else {
        checkbox.removeAttribute('checked');
      }
    }
  });

  return div.innerHTML;
}

/**
 * Custom extension for handling markdown paste
 */
const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        props: {
          handlePaste(_view, event) {
            const text = event.clipboardData?.getData('text/plain');

            // If we have plain text and it looks like markdown, parse it
            if (text && looksLikeMarkdown(text)) {
              try {
                // Pre-process task lists to add dashes if missing
                const processedText = preprocessTaskLists(text);

                // Convert markdown to HTML using marked (synchronous)
                const parseResult = marked.parse(processedText, {
                  async: false,
                });

                // marked.parse might return a Promise or string depending on config
                // Ensure we have the HTML string
                let html =
                  typeof parseResult === 'string'
                    ? parseResult
                    : String(parseResult);

                // Convert task lists to TipTap format
                html = convertTaskListsToTipTap(html);

                // Insert the HTML content
                editor.commands.insertContent(html);

                return true; // Prevent default paste behavior
              } catch (error) {
                console.error('Error parsing markdown:', error);
                // Fall back to default paste behavior on error
                return false;
              }
            }

            return false; // Allow default paste behavior
          },
        },
      }),
    ];
  },
});

/**
 * Rich text editor component with brutalist toolbar
 * @param {Object} props
 * @param {string} props.content - HTML content
 * @param {Function} props.onChange - Callback with HTML string when content changes
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.maxLength - Maximum character count (default: 5000)
 */
export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  maxLength = 5000,
}) {
  // State to force re-renders when selection changes
  const [, setEditorState] = useState(0);

  // State for date picker dialog
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // State for link dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');

  // Ref to track if we're editing an existing date
  const editingDateElement = useRef(null);
  const editorContainerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-black pl-4 italic',
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'my-4 border-t-2 border-black',
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent1 underline hover:text-accent2',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
        onReadOnlyChecked: () => {
          // This fires when checkbox is clicked in read-only mode
          // We'll handle it in our click handler instead
          return false;
        },
      }),
      FormattedDate,
      MarkdownPaste, // Custom paste handler for markdown detection
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      // Force re-render to update toolbar state
      setEditorState((prev) => prev + 1);
    },
    onSelectionUpdate: () => {
      // Force re-render when selection changes to update toolbar
      setEditorState((prev) => prev + 1);
    },
    editorProps: {
      attributes: {
        class:
          'rich-text-editor-content focus:outline-none min-h-[200px] p-4 border-black',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  // Sync data-checked attributes with TipTap's node state on content load
  useEffect(() => {
    if (!editor || !editorContainerRef.current) return;

    const container = editorContainerRef.current;
    const taskLists = container.querySelectorAll('ul[data-type="taskList"]');

    taskLists.forEach((taskList) => {
      const taskItems = taskList.querySelectorAll('li');
      taskItems.forEach((taskItem) => {
        const checkbox = taskItem.querySelector('input[type="checkbox"]');
        if (checkbox) {
          // Set data-checked based on checkbox checked state
          taskItem.setAttribute(
            'data-checked',
            checkbox.checked ? 'true' : 'false'
          );
        }
      });
    });
  }, [editor, content]);

  // Add click handler to make date pills editable and handle checkbox clicks
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container || !editor) return;

    const handleClick = (e) => {
      const target = e.target;

      // Handle date pill clicks
      if (target.classList.contains('formatted-date')) {
        e.preventDefault();
        e.stopPropagation();

        // Extract date from the clicked element
        const dateText = target.textContent;
        // Parse "Nov 14, 2025" format back to ISO date
        try {
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate.toISOString().split('T')[0]);
            editingDateElement.current = target;
            setShowDatePicker(true);
          }
        } catch (err) {
          console.error('Error parsing date:', err);
        }
      }

      // Handle checkbox clicks - update TipTap's node state
      const taskList = target.closest('ul[data-type="taskList"]');
      if (target.type === 'checkbox' && taskList) {
        e.stopPropagation();

        const taskItem = target.closest('li');
        if (!taskItem) return;

        const newChecked = target.checked;

        // Immediately update the data-checked attribute for instant visual feedback
        taskItem.setAttribute('data-checked', newChecked ? 'true' : 'false');

        // Find all task items in this task list to determine the position
        const allTaskItems = taskList.querySelectorAll('li');
        const taskItemIndex = Array.from(allTaskItems).indexOf(taskItem);

        if (taskItemIndex !== -1) {
          // Update TipTap's document state
          let currentIndex = -1;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'taskItem') {
              currentIndex++;
              if (currentIndex === taskItemIndex) {
                // Update the checked attribute on this node
                const tr = editor.state.tr;
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  checked: newChecked,
                });
                editor.view.dispatch(tr);
                return false; // Stop traversing
              }
            }
          });
        }
      }
    };

    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [editor, onChange]);

  if (!editor) {
    return null;
  }

  const charCount = countHtmlChars(editor.getHTML());
  const isOverLimit = charCount > maxLength;

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
    label,
    disabled,
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border-2 border-black p-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        isActive
          ? 'bg-accent1 text-white'
          : 'hover:bg-neutral1 bg-white text-black'
      } `}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const ToolbarDivider = () => <div className="h-8 w-px bg-black" />;

  /**
   * Validate URL - must start with http:// or https://
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid
   */
  const validateUrl = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkError('');
    setShowLinkDialog(true);
  };

  const handleLinkInsert = () => {
    // Handle empty URL (remove link)
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkError('');
      return;
    }

    // Validate URL
    if (!validateUrl(linkUrl)) {
      setLinkError('URL must start with http:// or https://');
      return;
    }

    // Insert/update link
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkError('');
  };

  const handleLinkDialogClose = () => {
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkError('');
    editor.commands.focus();
  };

  const insertDate = () => {
    // Reset to today's date for new inserts
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    editingDateElement.current = null;
    setShowDatePicker(true);
  };

  const handleDateInsert = () => {
    if (selectedDate) {
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const formattedDate = formatDateShort(dateObj);

      // If editing an existing date, replace it
      if (editingDateElement.current) {
        const dateSpan = editingDateElement.current;

        // Update the text content
        dateSpan.textContent = formattedDate;

        // Trigger editor update to sync the HTML
        const html = editor.getHTML();
        editor.commands.setContent(html);

        editingDateElement.current = null;
      } else {
        // Insert new date
        insertFormattedDate(editor, dateObj);
      }
    }
    setShowDatePicker(false);
  };

  return (
    <div className="border-2 border-black">
      {/* Toolbar */}
      <div className="sticky -top-4 z-10 flex flex-wrap items-center gap-1 border-b-2 border-black bg-neutral-100 p-2 sm:-top-6">
        {/* Text Styling */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Bold (Ctrl+B)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Italic (Ctrl+I)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={UnderlineIcon}
          label="Underline (Ctrl+U)"
        />

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          label="Heading 1"
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          label="Heading 3"
        />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          label="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Numbered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          icon={CheckSquare}
          label="Task List"
        />

        <ToolbarDivider />

        {/* Blockquote & Horizontal Rule */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          label="Blockquote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          icon={Minus}
          label="Horizontal Rule"
        />

        <ToolbarDivider />

        {/* Link & Date */}
        <ToolbarButton
          onClick={toggleLink}
          isActive={editor.isActive('link')}
          icon={LinkIcon}
          label="Insert/Edit Link"
        />
        <ToolbarButton
          onClick={insertDate}
          isActive={false}
          icon={Calendar}
          label="Insert Date"
        />
      </div>

      {/* Editor */}
      <div className="relative" ref={editorContainerRef}>
        <EditorContent editor={editor} />
        {placeholder && !editor.getText() && (
          <div className="text-neutral3 pointer-events-none absolute left-4 top-4">
            {placeholder}
          </div>
        )}
      </div>

      {/* Character Counter */}
      <div
        className={`border-t-2 border-black bg-neutral-100 px-4 py-2 font-mono text-sm ${isOverLimit ? 'bg-red-100 font-bold text-red-700' : 'bg-neutral1 text-neutral4'} `}
      >
        {charCount} / {maxLength} characters
        {isOverLimit && ' (over limit!)'}
      </div>

      {/* Date Picker Dialog */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-display text-xl uppercase">Insert Date</h3>
            <div className="mb-4">
              <label className="mb-2 block font-display text-sm uppercase">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-brutal w-full"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDateInsert}
                className="btn-brutal-primary flex-1"
              >
                Insert
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="btn-brutal flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <Dialog
          title={linkUrl ? 'Edit Link' : 'Insert Link'}
          onClose={handleLinkDialogClose}
          maxWidth="max-w-lg"
          footer={
            <div className="flex gap-3">
              <button
                onClick={handleLinkInsert}
                className="btn-brutal-primary flex-1"
              >
                {linkUrl ? 'Update Link' : 'Insert Link'}
              </button>
              <button
                onClick={handleLinkDialogClose}
                className="btn-brutal flex-1"
              >
                Cancel
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="link-url-input"
                className="mb-2 block font-display text-sm uppercase"
              >
                URL
              </label>
              <input
                id="link-url-input"
                type="text"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setLinkError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkInsert();
                  }
                }}
                className="input-brutal w-full"
                placeholder="https://example.com"
                autoFocus
              />
              {linkError && (
                <p className="mt-2 text-sm font-bold text-red-700">
                  {linkError}
                </p>
              )}
            </div>
            <p className="text-neutral4 text-sm">
              Clear the URL field to remove the link.
            </p>
          </div>
        </Dialog>
      )}
    </div>
  );
}
