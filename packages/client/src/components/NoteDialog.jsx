import { useState, useMemo } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { NOTE_COLORS, getRandomColor } from '../utils/noteColors';
import { Dialog } from './Dialog';
import RichTextEditor from './RichTextEditor';
import { isHtml, textToHtml, countHtmlChars } from '../utils/htmlUtils';

export function NoteDialog({ note, sectionId, onSave, onDelete, onClose }) {
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

  // Track if form has been modified (for edit mode) - use useMemo instead of useEffect
  const isDirty = useMemo(() => {
    if (isCreateMode) return false;
    return (
      title !== note.title ||
      message !== initialMessage ||
      (dueDate || '') !== (note.due_date ? note.due_date.split('T')[0] : '') ||
      color !== note.color
    );
  }, [title, message, dueDate, color, note, isCreateMode, initialMessage]);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    // Check if message has actual content (not just empty HTML tags)
    const messageCharCount = countHtmlChars(message);
    if (messageCharCount === 0) {
      alert('Message is required');
      return;
    }

    // Validate character limit (count visible text only)
    if (messageCharCount > 5000) {
      alert('Message exceeds 5000 character limit');
      return;
    }

    const noteData = {
      title: title.trim(),
      message: message, // Keep HTML as-is
      dueDate: dueDate || null,
      color,
    };

    if (isCreateMode) {
      noteData.sectionId = sectionId;
    }

    onSave(noteData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
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
          className="input-brutal w-full"
        />
      </div>

      {/* Message */}
      <div>
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
