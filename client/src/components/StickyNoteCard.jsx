import { useState } from 'react';
import { Clock, AlertCircle, AlertTriangle, Calendar } from 'lucide-react';
import { getDueDateCategory, formatDueDate, getDueDateBadgeConfig } from '../utils/dateUtils';

export function StickyNoteCard({ note, onEdit, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    if (onEdit) {
      onEdit(note);
    }
  };

  const handleDragStart = (e) => {
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

  // Get icon component based on category
  const getIconComponent = () => {
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
  };

  const IconComponent = getIconComponent();

  return (
    <div
      className={`sticky-note-card relative cursor-pointer select-none ${
        isDragOver ? 'ring-4 ring-accent3' : ''
      }`}
      style={{ backgroundColor: note.color }}
      onClick={handleClick}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
      {/* Due date badge - only show if not 'none' or 'future' */}
      {dueDateCategory !== 'none' && dueDateCategory !== 'future' && (
        <div
          className={`absolute top-2 right-2 ${badgeConfig.bgColor} ${badgeConfig.textColor} px-2 py-1 text-xs font-body font-bold flex items-center gap-1 border-2 border-black z-10`}
        >
          {IconComponent && <IconComponent size={12} />}
          <span>{badgeConfig.label}</span>
        </div>
      )}

      {/* Main content */}
      <div className="p-4 h-full flex flex-col">
        {/* Title */}
        <h3 className="font-display text-lg uppercase text-black mb-2 line-clamp-2 break-words">
          {note.title}
        </h3>

        {/* Author */}
        <p className="font-body text-xs text-black/70 mb-2">
          {note.author_name}
        </p>

        {/* Due date display (for future dates or when no urgent badge) */}
        {note.due_date && (dueDateCategory === 'future' || dueDateCategory === 'none') && (
          <p className="font-body text-xs text-black/60 mb-2 flex items-center gap-1">
            <Calendar size={12} />
            {formattedDueDate}
          </p>
        )}

        {/* Message */}
        <p className="font-body text-sm text-black flex-1 break-words whitespace-pre-wrap truncate">
          {note.message}
        </p>
      </div>

      {/* Folded corner */}
      <div className="sticky-note-corner-outline outline outline-2 outline-black">
        <div className="sticky-note-corner"></div>
      </div>
    </div>
  );
}

export default StickyNoteCard;
