import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import FormattedDate from './FormattedDateExtension';
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
} from 'lucide-react';
import {
  countHtmlChars,
  insertFormattedDate,
  formatDateShort,
} from '@utils/htmlUtils';

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

  // Ref to track if we're editing an existing date
  const editingDateElement = useRef(null);
  const editorContainerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
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

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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
      <div className="bg-neutral1 flex flex-wrap items-center gap-1 border-b-2 border-black p-2">
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
        className={`border-t-2 border-black px-4 py-2 font-mono text-sm ${isOverLimit ? 'bg-red-100 font-bold text-red-700' : 'bg-neutral1 text-neutral4'} `}
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
    </div>
  );
}
