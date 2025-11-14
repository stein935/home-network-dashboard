import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import {
  getDueDateCategory,
  formatDueDate,
  getDueDateBadgeConfig,
} from '../utils/dateUtils';
import { sanitizeHtml } from '../utils/htmlUtils';

export function StickyNoteCard({
  note,
  onEdit,
  onCheckboxToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragHandleHovered, setIsDragHandleHovered] = useState(false);
  const messageRef = useRef(null);
  const cardRef = useRef(null);

  const handleClick = (e) => {
    // Don't open edit dialog if clicking on links or checkboxes
    if (e.target.tagName === 'A' || e.target.tagName === 'INPUT') {
      return;
    }

    if (onEdit) {
      onEdit(note);
    }
  };

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

  const handleDragStart = (e) => {
    // Set the drag image to the entire card
    if (cardRef.current) {
      e.dataTransfer.setDragImage(cardRef.current, 50, 50);
    }
    if (onDragStart) {
      onDragStart(e, note);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e, note);
    }
  };

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
    <div
      ref={cardRef}
      className={`sticky-note-card relative cursor-pointer select-none ${
        isDragOver ? 'ring-4 ring-accent3' : ''
      } ${isDragHandleHovered ? 'sticky-note-card-hover' : ''}`}
      style={{ backgroundColor: note.color }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Drag handle icon */}
      <div
        className="absolute right-[-25px] top-[-20px] z-20 flex h-[80px] w-[80px] cursor-move items-center justify-center"
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
      {/* Due date badge - only show if not 'none' or 'future' */}
      {dueDateCategory !== 'none' && dueDateCategory !== 'future' && (
        <div
          className={`absolute left-2 top-2 ${badgeConfig.bgColor} ${badgeConfig.textColor} z-10 flex items-center gap-1 border-2 border-black px-2 py-1 font-body text-xs font-bold`}
        >
          {IconComponent && <IconComponent size={12} />}
          <span>{badgeConfig.label}</span>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-full flex-col p-4">
        {/* Title */}
        <h3 className="mb-2 line-clamp-2 break-words font-display text-lg uppercase text-black">
          {note.title}
        </h3>

        {/* Author */}
        <p className="mb-2 font-body text-xs text-black/70">
          {note.author_name}
        </p>

        {/* Due date display (for future dates or when no urgent badge) */}
        {note.due_date &&
          (dueDateCategory === 'future' || dueDateCategory === 'none') && (
            <p className="mb-2 flex items-center gap-1 font-body text-xs text-black/60">
              <Calendar size={12} />
              {formattedDueDate}
            </p>
          )}

        {/* Message */}
        <div
          ref={messageRef}
          className="note-message-content flex-1 overflow-hidden font-body text-sm text-black"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.message) }}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        />
      </div>

      {/* Folded corner */}
      <div className="sticky-note-corner-outline outline outline-2 outline-black">
        <div className="sticky-note-corner"></div>
      </div>
    </div>
  );
}

export default StickyNoteCard;
