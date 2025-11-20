import { useState, useMemo, useRef, useEffect } from 'react';
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

export function StickyNoteCard({ note, onEdit, onCheckboxToggle }) {
  const [isDragHandleHovered, setIsDragHandleHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const messageRef = useRef(null);
  const titleRef = useRef(null);

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
            className="note-message-content flex-1 overflow-hidden border-t-2 border-black pt-2 font-body text-sm text-black"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.message) }}
            style={{
              overflow: 'hidden',
              lineHeight: '1.5em',
              maskImage:
                'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
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
        />
      )}
    </>
  );
}

export default StickyNoteCard;
