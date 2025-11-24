import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  MoreVertical,
  Edit2,
  Maximize2,
} from 'lucide-react';
import {
  getDueDateCategory,
  formatDueDate,
  getDueDateBadgeConfig,
} from '@utils/dateUtils';
import { sanitizeHtml } from '@utils/htmlUtils';
import { NoteDetailModal } from './NoteDetailModal';

export function StickyNoteCard({
  note,
  onEdit,
  onCheckboxToggle,
  onTaskDelete,
  onTaskAdd,
}) {
  const [isDragHandleHovered, setIsDragHandleHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const messageRef = useRef(null);
  const titleRef = useRef(null);
  const inputRef = useRef(null);

  // Detect content overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (!messageRef.current || !titleRef.current) return;

      // Check if title is clamped (line-clamp-2)
      const titleOverflow =
        titleRef.current.scrollHeight > titleRef.current.clientHeight;

      // Check if message is clamped (WebkitLineClamp: 6)
      const messageOverflow =
        messageRef.current.scrollHeight > messageRef.current.clientHeight;

      setHasOverflow(titleOverflow || messageOverflow);
    };

    checkOverflow();
    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [note.title, note.message]);

  // Sync checkbox states based on data-checked attribute
  useEffect(() => {
    if (!messageRef.current) return;

    const taskLists = messageRef.current.querySelectorAll(
      'ul[data-type="taskList"]'
    );
    taskLists.forEach((taskList) => {
      const taskItems = taskList.querySelectorAll('li');
      taskItems.forEach((taskItem) => {
        const checkbox = taskItem.querySelector('input[type="checkbox"]');
        if (checkbox) {
          const isChecked = taskItem.getAttribute('data-checked') === 'true';
          checkbox.checked = isChecked;
        }
      });
    });
  }, [note.message]);

  // Handle checkbox clicks
  useEffect(() => {
    if (!messageRef.current || !onCheckboxToggle) return;

    const handleCheckboxClick = (e) => {
      if (e.target.type === 'checkbox') {
        e.stopPropagation(); // Prevent edit dialog from opening

        // Find the task item element
        const taskList = e.target.closest('ul[data-type="taskList"]');
        if (!taskList) return;

        const taskItem = e.target.closest('li');
        if (!taskItem) return;

        // Toggle checkbox state
        const newChecked = e.target.checked;

        // Immediately update the data-checked attribute for instant visual feedback
        taskItem.setAttribute('data-checked', newChecked ? 'true' : 'false');

        // Get all task items from ALL task lists to find the global index
        const allTaskLists = messageRef.current.querySelectorAll(
          'ul[data-type="taskList"]'
        );
        let allTaskItems = [];
        allTaskLists.forEach((tl) => {
          const items = tl.querySelectorAll('li');
          allTaskItems = allTaskItems.concat(Array.from(items));
        });
        const checkboxIndex = allTaskItems.indexOf(taskItem);

        // Call callback with note ID, checkbox index, and new state
        onCheckboxToggle(note.id, checkboxIndex, newChecked);
      }
    };

    const messageEl = messageRef.current;
    messageEl.addEventListener('click', handleCheckboxClick);

    return () => {
      messageEl.removeEventListener('click', handleCheckboxClick);
    };
  }, [note.id, onCheckboxToggle, note.message]);

  // Handle task addition - define before useEffect that uses it
  const handleAddTask = useCallback(async () => {
    if (!inputRef.current || isSaving) return;

    const taskText = inputRef.current.value.trim();
    if (!taskText) return;

    setIsSaving(true);
    try {
      await onTaskAdd(note.id, activeInputIndex, taskText);
      // Keep input open for rapid entry (clear value)
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onTaskAdd, note.id, activeInputIndex]);

  const handleCancelInput = useCallback(() => {
    setActiveInputIndex(null);
  }, []);

  const handleInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTask();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelInput();
      }
    },
    [handleAddTask, handleCancelInput]
  );

  // Inject delete buttons for task items
  useEffect(() => {
    const messageEl = messageRef.current;
    if (!messageEl || !onTaskDelete) return;

    const taskLists = messageEl.querySelectorAll('ul[data-type="taskList"]');

    // Get all task items to calculate global indices
    let allTaskItems = [];
    taskLists.forEach((taskList) => {
      const items = taskList.querySelectorAll('li');
      allTaskItems = allTaskItems.concat(Array.from(items));
    });

    // Inject delete button for each task item
    allTaskItems.forEach((taskItem, globalIndex) => {
      // Skip if delete button already exists
      if (taskItem.querySelector('.task-delete-btn')) return;

      // Make task item a flex container for button positioning
      taskItem.style.display = 'flex';
      taskItem.style.alignItems = 'center';
      taskItem.style.gap = '0.5rem';

      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className =
        'task-delete-btn ml-auto flex-shrink-0 flex h-4 w-4 items-center justify-center text-black border border-1 border-black rounded-full bg-white/20 hover:bg-white/30';
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
        </svg>
      `;
      deleteBtn.setAttribute('aria-label', 'Delete task');

      // Handle click
      deleteBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent edit dialog from opening
        e.preventDefault();

        // Get checked state
        const isChecked = taskItem.getAttribute('data-checked') === 'true';

        // Call delete handler
        onTaskDelete(note.id, globalIndex, isChecked);
      };

      // Append button to task item
      taskItem.appendChild(deleteBtn);
    });

    // Cleanup function to remove buttons
    return () => {
      const buttons = messageEl?.querySelectorAll('.task-delete-btn');
      buttons?.forEach((btn) => btn.remove());
    };
  }, [note.id, note.message, onTaskDelete]);

  // Inject + buttons and input below task lists
  useEffect(() => {
    const messageEl = messageRef.current;
    if (!messageEl || !onTaskAdd) return;

    const taskLists = messageEl.querySelectorAll('ul[data-type="taskList"]');

    taskLists.forEach((taskList, listIndex) => {
      // Remove existing containers first
      const existingContainer = taskList.nextElementSibling;
      if (existingContainer?.classList.contains('task-add-btn-container')) {
        existingContainer.remove();
      }

      // Create container
      const container = document.createElement('div');
      container.className = 'task-add-btn-container mt-1';

      // <div class="task-add-btn-container mt-1"><div class="flex items-center bg-none"><input type="text" class="flex-1 px-2 py-1 border-2 border-black text-sm bg-none" placeholder="New task..."></div></div>

      // Show input if this list is active
      if (activeInputIndex === listIndex) {
        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'flex items-center mb-[8px]';
        inputContainer.onclick = (e) => e.stopPropagation();

        const input = document.createElement('input');
        input.type = 'text';
        input.className =
          'flex-1 px-2 py-1 border border-1 border-black text-sm outline-none rounded-sm';
        input.placeholder = 'New task...';
        input.disabled = isSaving;

        input.onkeydown = handleInputKeyDown;
        input.onblur = () => {
          // Delay to allow button clicks
          setTimeout(() => {
            if (activeInputIndex === listIndex) {
              handleCancelInput();
            }
          }, 200);
        };

        // Set ref for focus management
        if (inputRef.current !== input) {
          inputRef.current = input;
          setTimeout(() => input.focus(), 0);
        }

        inputContainer.appendChild(input);
        container.appendChild(inputContainer);
      } else {
        // Create + button
        const addBtn = document.createElement('button');
        addBtn.className =
          'task-add-btn flex items-center gap-1 text-xs mb-3 border border-1 border-black rounded-md py-1 px-2 bg-white/20 hover:bg-white/30';
        addBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          <span>Add task</span>
        `;
        addBtn.setAttribute('aria-label', 'Add task to list');

        addBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          setActiveInputIndex(listIndex);
        };

        container.appendChild(addBtn);
      }

      taskList.parentNode.insertBefore(container, taskList.nextSibling);
    });

    // Cleanup function
    return () => {
      const containers = messageEl?.querySelectorAll('.task-add-btn-container');
      containers?.forEach((container) => {
        // Detach event handlers before removing to prevent blur from triggering
        const input = container.querySelector('input');
        if (input) {
          input.onblur = null;
          input.onkeydown = null;
        }
        container.remove();
      });
    };
  }, [
    note.message,
    onTaskAdd,
    activeInputIndex,
    isSaving,
    handleInputKeyDown,
    handleCancelInput,
  ]);

  // Focus input when it becomes active
  useEffect(() => {
    if (activeInputIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeInputIndex]);

  const dueDateCategory = getDueDateCategory(note.due_date);
  const formattedDueDate = formatDueDate(note.due_date);
  const badgeConfig = getDueDateBadgeConfig(dueDateCategory);

  // Get icon component based on category - memoized to prevent recreation on each render
  const IconComponent = useMemo(() => {
    switch (badgeConfig.icon) {
      case 'Clock':
        return Clock;
      case 'AlertCircle':
        return AlertCircle;
      case 'AlertTriangle':
        return AlertTriangle;
      case 'Calendar':
        return Calendar;
      default:
        return null;
    }
  }, [badgeConfig.icon]);

  return (
    <>
      <div
        className={`sticky-note-card relative select-none ${isDragHandleHovered ? 'sticky-note-card-hover' : ''}`}
        style={{ backgroundColor: note.color }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag handle icon */}
        <div
          className="sortable-handle absolute right-[-25px] top-[-20px] z-20 flex h-[80px] w-[80px] cursor-move items-center justify-center"
          onMouseEnter={() => setIsDragHandleHovered(true)}
          onMouseLeave={() => setIsDragHandleHovered(false)}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking drag handle
          }}
        >
          <MoreVertical
            size={20}
            className="text-black/40 transition-colors hover:text-black/70"
          />
        </div>

        {/* Main content */}
        <div
          className={`flex h-full flex-col p-4 pb-8 sm:p-4 ${isHovered ? 'sm:pb-8' : ''}`}
        >
          {/* Title */}
          <h3
            ref={titleRef}
            className="mb-1 line-clamp-2 break-words font-display text-lg uppercase text-black"
          >
            {note.title}
          </h3>

          <div className="mb-2 flex items-end justify-between">
            {/* Author */}
            <p className="font-body text-xs text-black/70">
              From: {note.author_name}
            </p>

            {/* Due date display (for future dates or when no urgent badge) */}
            {note.due_date &&
              (dueDateCategory === 'future' || dueDateCategory === 'none') && (
                <p className="flex items-center gap-1 font-body text-xs text-black/60">
                  <Calendar size={12} />
                  {formattedDueDate}
                </p>
              )}
            {/* Due date badge - only show if not 'none' or 'future' */}
            {dueDateCategory !== 'none' && dueDateCategory !== 'future' && (
              <div
                className={`${badgeConfig.bgColor} ${badgeConfig.textColor} -mt-12 flex items-center gap-1 border-2 border-black px-2 py-1 font-body text-xs font-bold`}
              >
                {IconComponent && <IconComponent size={12} />}
                <span>{badgeConfig.label}</span>
              </div>
            )}
          </div>

          {/* Message */}
          <div
            ref={messageRef}
            className="note-message-content no-scrollbar flex-1 overflow-y-scroll border-t-2 border-black pt-2 font-body text-sm text-black"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.message) }}
            style={{
              // overflow: 'hidden',
              // lineHeight: '1.5em',
              maskImage:
                'linear-gradient(to top, transparent 0%, black 100px, black 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
            }}
          />
        </div>

        {/* Button cluster */}
        <div
          className={`absolute bottom-0 left-0 right-[25px] flex gap-[1px] transition-opacity duration-200 md:opacity-0 ${
            isHovered ? 'md:opacity-100' : ''
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(note);
            }}
            className="flex flex-1 items-center justify-center gap-1 bg-black/10 px-3 py-1.5 font-body text-xs text-black transition-colors hover:bg-black/20"
            aria-label="Edit note"
          >
            <Edit2 size={14} />
            <span>Edit</span>
          </button>
          {hasOverflow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailView(true);
              }}
              className="flex flex-1 items-center justify-center gap-1 bg-black/10 px-3 py-1.5 font-body text-xs text-black transition-colors hover:bg-black/20"
              aria-label="See more"
            >
              <Maximize2 size={14} />
              <span>See more</span>
            </button>
          )}
        </div>

        {/* Folded corner */}
        <div className="sticky-note-corner-outline bg-black/20 outline outline-2 outline-black">
          <div className="sticky-note-corner"></div>
        </div>
      </div>

      {/* Detail View Modal */}
      {showDetailView && (
        <NoteDetailModal
          note={note}
          onClose={() => setShowDetailView(false)}
          onEdit={onEdit}
          onCheckboxToggle={onCheckboxToggle}
          onTaskDelete={onTaskDelete}
          onTaskAdd={onTaskAdd}
        />
      )}
    </>
  );
}

export default StickyNoteCard;
