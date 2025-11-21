import { useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Edit2,
  X,
} from 'lucide-react';
import {
  getDueDateCategory,
  formatDueDate,
  getDueDateBadgeConfig,
} from '../../../utils/dateUtils';
import { sanitizeHtml } from '../../../utils/htmlUtils';

export function NoteDetailModal({ note, onClose, onEdit }) {
  const dueDateCategory = getDueDateCategory(note.due_date);
  const formattedDueDate = formatDueDate(note.due_date);
  const badgeConfig = getDueDateBadgeConfig(dueDateCategory);

  // Get icon component based on category
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative h-full w-full max-w-2xl overflow-y-auto border-4 border-black p-6 shadow-brutal sm:max-h-[90vh]"
        style={{ backgroundColor: note.color }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-black/10 transition-colors hover:bg-black/20"
          aria-label="Close"
        >
          <X size={20} className="text-black" />
        </button>

        {/* Title */}
        <h3 className="mb-3 break-words font-display text-2xl uppercase text-black">
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

        {/* Full message content */}
        <div
          className="note-message-content mb-6 border-t-2 border-black pt-2 font-body text-base text-black"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.message) }}
        />

        {/* Action buttons */}
        <div className="left flex gap-[1px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              if (onEdit) onEdit(note);
            }}
            className="flex items-center gap-1 bg-black/10 px-4 py-2 font-body text-sm text-black transition-colors hover:bg-black/20"
          >
            <Edit2 size={16} />
            <span>Edit</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1 bg-black/10 px-4 py-2 font-body text-sm text-black transition-colors hover:bg-black/20"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
