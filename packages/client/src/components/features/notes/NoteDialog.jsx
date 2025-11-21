import { useState, useMemo } from 'react';
import { Save, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { NOTE_COLORS, getRandomColor } from '@utils/noteColors';
import { useNotification } from '@hooks/useNotification';
import { Dialog } from '@common/Dialog';
import RichTextEditor from '@common/RichTextEditor';
import { isHtml, textToHtml, countHtmlChars } from '@utils/htmlUtils';

export function NoteDialog({ note, sectionId, onSave, onDelete, onClose }) {
  const { notify, confirm } = useNotification();
  const isCreateMode = note === null;

  // Convert plain text to HTML on first load if needed
  const initialMessage = useMemo(() => {
    if (!note?.message) return '<p></p>';
    return isHtml(note.message) ? note.message : textToHtml(note.message);
  }, [note]);

  // Form state
  const [title, setTitle] = useState(note?.title || '');
  const [message, setMessage] = useState(initialMessage);
  const [dueDate, setDueDate] = useState(
    note?.due_date ? note.due_date.split('T')[0] : ''
  );
  const [color, setColor] = useState(note?.color || getRandomColor());
  const [width, setWidth] = useState(note?.width || 1);
  const [height, setHeight] = useState(note?.height || 1);
  const [more, setMore] = useState(isCreateMode);

  // Track if form has been modified (for edit mode) - use useMemo instead of useEffect
  const isDirty = useMemo(() => {
    if (isCreateMode) return false;
    return (
      title !== note.title ||
      message !== initialMessage ||
      (dueDate || '') !== (note.due_date ? note.due_date.split('T')[0] : '') ||
      color !== note.color ||
      width !== note.width ||
      height !== note.height
    );
  }, [
    title,
    message,
    dueDate,
    color,
    width,
    height,
    note,
    isCreateMode,
    initialMessage,
  ]);

  const handleSave = () => {
    if (!title.trim()) {
      notify.warning('Title is required');
      return;
    }

    // Check if message has actual content (not just empty HTML tags)
    const messageCharCount = countHtmlChars(message);
    if (messageCharCount === 0) {
      notify.warning('Message is required');
      return;
    }

    // Validate character limit (count visible text only)
    if (messageCharCount > 5000) {
      notify.warning('Message exceeds 5000 character limit');
      return;
    }

    const noteData = {
      title: title.trim(),
      message: message, // Keep HTML as-is
      dueDate: dueDate || null,
      color,
      width,
      height,
    };

    if (isCreateMode) {
      noteData.sectionId = sectionId;
    }

    onSave(noteData);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Note',
      message: `Are you sure you want to delete the note "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      onDelete(note.id);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleMore = () => {
    setMore(!more); // Toggles the boolean value of isOn
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div>
        {!isCreateMode && (
          <button
            onClick={handleDelete}
            className="btn-brutal-danger flex min-h-[54px] items-center gap-2"
          >
            <Trash2 size={20} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-brutal">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn-brutal-primary flex items-center gap-2"
          disabled={!isCreateMode && !isDirty}
        >
          <Save size={20} />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>
    </div>
  );

  return (
    <Dialog
      title={isCreateMode ? 'New Note' : 'Note Details'}
      onClose={onClose}
      footer={footer}
      zIndex={50}
    >
      {/* Title */}
      <div>
        <label className="mb-2 block font-display text-sm uppercase">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-brutal w-full"
          placeholder="Enter note title..."
          maxLength={200}
        />
      </div>

      <button
        onClick={toggleMore}
        className="flex w-full items-center justify-between gap-2 border-t-3 border-black pt-3 font-display text-sm uppercase"
      >
        More
        {more ? (
          <ChevronDown size={32} strokeWidth={3} className="text-accent1" />
        ) : (
          <ChevronRight size={32} strokeWidth={3} className="text-accent1" />
        )}
      </button>

      {more && (
        <div className="space-y-4">
          {/* Author (read-only in edit mode) */}
          {!isCreateMode && (
            <div>
              <label className="mb-2 block font-display text-sm uppercase">
                Author
              </label>
              <div className="input-brutal w-full cursor-not-allowed bg-gray-100">
                {note.author_name}
              </div>
            </div>
          )}

          {/* Date Created (read-only in edit mode) */}
          {!isCreateMode && (
            <div>
              <label className="mb-2 block font-display text-sm uppercase">
                Date Created
              </label>
              <div className="input-brutal w-full cursor-not-allowed bg-gray-100">
                {formatDate(note.created_at)}
              </div>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="mb-2 block font-display text-sm uppercase">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-brutal box-border w-full max-w-full text-left"
            />
          </div>

          {/* Size Configuration */}
          <div>
            <label className="mb-2 block font-display text-sm uppercase">
              Size
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs">Width</label>
                <select
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                  className="input-brutal w-full"
                >
                  {[1, 2, 3, 4].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs">Height</label>
                <select
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="input-brutal w-full"
                >
                  {[1, 2, 3].map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      <div className="border-t-3 border-black pt-3">
        <label className="mb-2 block font-display text-sm uppercase">
          Message
        </label>
        <RichTextEditor
          content={message}
          onChange={setMessage}
          placeholder="Enter note message..."
          maxLength={5000}
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="mb-2 block font-display text-sm uppercase">
          Color
        </label>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {NOTE_COLORS.map((noteColor) => (
            <button
              key={noteColor}
              onClick={() => setColor(noteColor)}
              className={`h-12 w-12 border-4 border-black transition-all ${
                color === noteColor
                  ? 'scale-110 shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
                  : 'shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:scale-105'
              }`}
              style={{ backgroundColor: noteColor }}
              aria-label={`Select color ${noteColor}`}
            />
          ))}
        </div>
      </div>
    </Dialog>
  );
}

export default NoteDialog;
