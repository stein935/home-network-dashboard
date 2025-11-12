import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { NOTE_COLORS, getRandomColor } from '../utils/noteColors';

export function NoteDialog({ note, sectionId, onSave, onDelete, onClose }) {
  const isCreateMode = note === null;

  // Form state
  const [title, setTitle] = useState(note?.title || '');
  const [message, setMessage] = useState(note?.message || '');
  const [dueDate, setDueDate] = useState(note?.due_date ? note.due_date.split('T')[0] : '');
  const [color, setColor] = useState(note?.color || getRandomColor());
  const [isDirty, setIsDirty] = useState(false);

  // Track if form has been modified (for edit mode)
  useEffect(() => {
    if (!isCreateMode) {
      const hasChanged =
        title !== note.title ||
        message !== note.message ||
        (dueDate || '') !== (note.due_date ? note.due_date.split('T')[0] : '') ||
        color !== note.color;
      setIsDirty(hasChanged);
    }
  }, [title, message, dueDate, color, note, isCreateMode]);

  const handleSave = () => {
    if (!title.trim() || !message.trim()) {
      alert('Title and message are required');
      return;
    }

    const noteData = {
      title: title.trim(),
      message: message.trim(),
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface border-5 border-border shadow-brutal max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-border bg-accent1 text-white">
          <h2 className="font-display text-3xl uppercase">
            {isCreateMode ? 'New Note' : 'Note Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent1/20 transition-colors"
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="font-display text-sm uppercase mb-2 block">Title</label>
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
              <label className="font-display text-sm uppercase mb-2 block">Author</label>
              <div className="input-brutal w-full bg-gray-100 cursor-not-allowed">
                {note.author_name}
              </div>
            </div>
          )}

          {/* Date Created (read-only in edit mode) */}
          {!isCreateMode && (
            <div>
              <label className="font-display text-sm uppercase mb-2 block">Date Created</label>
              <div className="input-brutal w-full bg-gray-100 cursor-not-allowed">
                {formatDate(note.created_at)}
              </div>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="font-display text-sm uppercase mb-2 block">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-brutal w-full"
            />
          </div>

          {/* Message */}
          <div>
            <label className="font-display text-sm uppercase mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-brutal w-full min-h-[150px] resize-y"
              placeholder="Enter note message..."
              maxLength={5000}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="font-display text-sm uppercase mb-2 block">Color</label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {NOTE_COLORS.map((noteColor) => (
                <button
                  key={noteColor}
                  onClick={() => setColor(noteColor)}
                  className={`w-12 h-12 border-4 border-black transition-all ${
                    color === noteColor
                      ? 'shadow-[4px_4px_0_0_rgba(0,0,0,1)] scale-110'
                      : 'shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:scale-105'
                  }`}
                  style={{ backgroundColor: noteColor }}
                  aria-label={`Select color ${noteColor}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t-4 border-border">
          <div>
            {!isCreateMode && (
              <button
                onClick={handleDelete}
                className="btn-brutal-danger flex items-center gap-2 min-h-[54px]"
              >
                <Trash2 size={20} />
                <span className="hidden sm:visible">Delete</span>
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
              <span className="hidden sm:visible">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteDialog;
