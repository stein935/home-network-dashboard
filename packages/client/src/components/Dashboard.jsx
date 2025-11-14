import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, StickyNote, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sectionsApi, notesApi, servicesApi } from '../utils/api';
import ServiceCard from './ServiceCard';
import StickyNoteCard from './StickyNoteCard';
import NoteDialog from './NoteDialog';

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [sectionsWithServices, setSectionsWithServices] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [draggedNote, setDraggedNote] = useState(null);
  const [draggedService, setDraggedService] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sectionsResponse, notesResponse] = await Promise.all([
        sectionsApi.getAllWithServices(),
        notesApi.getAll(),
      ]);
      setSectionsWithServices(sectionsResponse.data);
      setNotes(notesResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await notesApi.getAll();
      setNotes(response.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const totalServices = sectionsWithServices.reduce(
    (total, section) => total + section.services.length,
    0
  );

  // Note handlers
  const handleNewNote = (sectionId) => {
    setSelectedNote(null);
    setSelectedSectionId(sectionId);
    setNoteDialogOpen(true);
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setSelectedSectionId(note.section_id);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (selectedNote) {
        // Update existing note
        await notesApi.update(selectedNote.id, noteData);
      } else {
        // Create new note
        await notesApi.create(noteData);
      }
      await fetchNotes();
      setNoteDialogOpen(false);
      setSelectedNote(null);
      setSelectedSectionId(null);
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notesApi.delete(noteId);
      await fetchNotes();
      setNoteDialogOpen(false);
      setSelectedNote(null);
      setSelectedSectionId(null);
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    }
  };

  const handleCloseDialog = () => {
    setNoteDialogOpen(false);
    setSelectedNote(null);
    setSelectedSectionId(null);
  };

  const handleCheckboxToggle = async (noteId, checkboxIndex, checked) => {
    try {
      // Find the note
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      // Parse HTML and update checkbox state
      const parser = new DOMParser();
      const doc = parser.parseFromString(note.message, 'text/html');

      // Get all task lists and find all task items
      const taskLists = doc.querySelectorAll('ul[data-type="taskList"]');
      let allTaskItems = [];
      taskLists.forEach((taskList) => {
        const items = taskList.querySelectorAll('li');
        allTaskItems = allTaskItems.concat(Array.from(items));
      });

      if (allTaskItems[checkboxIndex]) {
        const taskItem = allTaskItems[checkboxIndex];
        const checkbox = taskItem.querySelector('input[type="checkbox"]');

        // Update the data-checked attribute on the li
        taskItem.setAttribute('data-checked', checked ? 'true' : 'false');

        // Update the checked attribute on the input
        if (checkbox) {
          if (checked) {
            checkbox.setAttribute('checked', 'checked');
          } else {
            checkbox.removeAttribute('checked');
          }
        }
      }

      // Serialize back to HTML
      const updatedMessage = doc.body.innerHTML;

      // Update the note via API
      await notesApi.update(noteId, { message: updatedMessage });

      // Refresh notes
      await fetchNotes();
    } catch (err) {
      console.error('Error toggling checkbox:', err);
    }
  };

  // Get notes for a specific section
  const getSectionNotes = (sectionId) => {
    return notes.filter((note) => note.section_id === sectionId);
  };

  // Drag and drop handlers
  const handleDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleNoteDropOnNote = async (e, targetNote) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNote || draggedNote.id === targetNote.id) {
      setDraggedNote(null);
      return;
    }

    const targetSectionId = targetNote.section_id;
    const targetNotes = getSectionNotes(targetSectionId);
    const targetIndex = targetNotes.findIndex(
      (note) => note.id === targetNote.id
    );

    // Call handleDrop with the target index
    await handleDrop(e, targetSectionId, targetIndex);
  };

  const handleDrop = async (e, targetSectionId, dropIndex = null) => {
    e.preventDefault();

    if (!draggedNote) return;

    const targetNotes = getSectionNotes(targetSectionId);
    const isSameSection = draggedNote.section_id === targetSectionId;

    try {
      if (targetNotes.length === 0) {
        // Target section is empty, just move the note
        await notesApi.reorder([
          {
            id: draggedNote.id,
            sectionId: targetSectionId,
            displayOrder: 0,
          },
        ]);
        await fetchNotes();
      } else if (isSameSection) {
        // Reordering within the same section
        // Get the current index of the dragged note
        const currentIndex = targetNotes.findIndex(
          (note) => note.id === draggedNote.id
        );
        const targetIndex = dropIndex !== null ? dropIndex : 0;

        if (currentIndex !== targetIndex) {
          // Remove the dragged note from its current position
          const reorderedNotes = targetNotes.filter(
            (note) => note.id !== draggedNote.id
          );
          // Insert it at the target position
          reorderedNotes.splice(targetIndex, 0, draggedNote);

          // Create updates with new display orders
          const updates = reorderedNotes.map((note, index) => ({
            id: note.id,
            sectionId: targetSectionId,
            displayOrder: index,
          }));

          await notesApi.reorder(updates);
          await fetchNotes();
        }
      } else {
        // Moving to a different section, place at the beginning
        const updates = targetNotes.map((note, index) => ({
          id: note.id,
          sectionId: targetSectionId,
          displayOrder: index + 1,
        }));
        updates.unshift({
          id: draggedNote.id,
          sectionId: targetSectionId,
          displayOrder: 0,
        });

        await notesApi.reorder(updates);
        await fetchNotes();
      }
    } catch (err) {
      console.error('Error reordering notes:', err);
      alert('Failed to reorder notes');
    }

    setDraggedNote(null);
  };

  // Service drag and drop handlers
  const handleServiceDragStart = (e, service) => {
    setDraggedService(service);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleServiceDragEnd = () => {
    setDraggedService(null);
  };

  const handleServiceDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleServiceDropOnService = async (e, targetService) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedService || draggedService.id === targetService.id) {
      setDraggedService(null);
      return;
    }

    // Only allow reordering within the same section
    if (draggedService.section_id !== targetService.section_id) {
      setDraggedService(null);
      return;
    }

    const targetSectionId = targetService.section_id;
    const section = sectionsWithServices.find((s) => s.id === targetSectionId);
    if (!section) {
      setDraggedService(null);
      return;
    }

    const sectionServices = section.services;
    const currentIndex = sectionServices.findIndex(
      (s) => s.id === draggedService.id
    );
    const targetIndex = sectionServices.findIndex(
      (s) => s.id === targetService.id
    );

    if (currentIndex !== targetIndex) {
      try {
        // Save scroll position
        const scrollY = window.scrollY;

        // Remove the dragged service from its current position
        const reorderedServices = sectionServices.filter(
          (s) => s.id !== draggedService.id
        );
        // Insert it at the target position
        reorderedServices.splice(targetIndex, 0, draggedService);

        // Create updates with new display orders
        const updates = reorderedServices.map((service, index) => ({
          id: service.id,
          displayOrder: index,
        }));

        await servicesApi.reorder(updates);
        await fetchData();

        // Restore scroll position
        window.scrollTo(0, scrollY);
      } catch (err) {
        console.error('Error reordering services:', err);
        alert('Failed to reorder services');
      }
    }

    setDraggedService(null);
  };

  return (
    <div className="min-h-screen px-6 pb-0 pt-6 md:px-12 md:pt-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-3 flex flex-wrap items-start justify-between gap-4 sm:mb-6">
          <div>
            <h1 className="mb-2 font-display text-display-sm uppercase text-text sm:text-display-lg">
              THE
              <span className="text-accent1"> STEINECKS</span>
            </h1>
            <p className="font-body text-xl text-text/80">
              Welcome, {user?.name || user?.email}
            </p>
          </div>
        </header>

        {/* Sections with Services */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block border-5 border-border bg-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-accent1">
                Loading Services...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <div className="inline-block border-5 border-error bg-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-error">
                {error}
              </p>
            </div>
          </div>
        ) : totalServices === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-block border-5 border-border bg-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-text">
                No Services Available
              </p>
              {isAdmin && (
                <p className="mt-4 font-body text-text/70">
                  Click Admin to add services
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {sectionsWithServices
              .filter((section) => section.services.length > 0)
              .map((section) => (
                <div key={section.id} className="">
                  {/* Section Header */}
                  <div className="flex items-center justify-between border-t-5 border-black py-6">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex flex-1 items-center justify-between transition-colors hover:text-accent1"
                      aria-label={`Toggle ${section.name} section`}
                    >
                      <h2 className="font-display text-display-sm uppercase text-text">
                        {section.name}
                      </h2>
                      {collapsedSections[section.id] ? (
                        <ChevronRight
                          size={32}
                          strokeWidth={3}
                          className="text-accent1"
                        />
                      ) : (
                        <ChevronDown
                          size={32}
                          strokeWidth={3}
                          className="text-accent1"
                        />
                      )}
                    </button>
                  </div>

                  {/* Section Content */}
                  {!collapsedSections[section.id] && (
                    <div className="space-y-8 pb-6">
                      {/* Services Grid */}
                      {section.services.length > 0 && (
                        <div>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {section.services.map((service) => (
                              <ServiceCard
                                key={service.id}
                                service={service}
                                onDragStart={handleServiceDragStart}
                                onDragEnd={handleServiceDragEnd}
                                onDragOver={handleServiceDragOver}
                                onDrop={handleServiceDropOnService}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes Grid */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, section.id)}
                        className={`min-h-[100px] ${
                          getSectionNotes(section.id).length === 0
                            ? 'relative flex items-center justify-center rounded border-3 border-dashed border-border/30'
                            : ''
                        }`}
                      >
                        {getSectionNotes(section.id).length > 0 ? (
                          <div>
                            <div className="flex w-full items-center justify-between">
                              <h3 className="mb-4 font-display text-xl uppercase text-text/70">
                                Notes
                              </h3>
                            </div>
                            {/* <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,280px))] gap-6"> */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                              {getSectionNotes(section.id).map((note) => (
                                <StickyNoteCard
                                  key={note.id}
                                  note={note}
                                  onEdit={handleEditNote}
                                  onCheckboxToggle={handleCheckboxToggle}
                                  onDragStart={handleDragStart}
                                  onDragEnd={handleDragEnd}
                                  onDrop={handleNoteDropOnNote}
                                />
                              ))}
                              <button
                                onClick={() => handleNewNote(section.id)}
                                className="group min-h-[100px] rounded border-3 border-dashed border-border/30 transition-colors hover:text-accent1"
                                aria-label="Add new note"
                                title="Add new note"
                              >
                                <StickyNote size={36} className="inline" />
                                <Plus
                                  size={18}
                                  className="-ml-[40px] inline h-[20px] w-[20px] rounded-full border-2 border-border bg-white group-hover:border-accent1 group-hover:bg-accent1 group-hover:text-white"
                                />
                              </button>
                            </div>
                          </div>
                        ) : draggedNote ? (
                          <p className="text-center font-body text-text/50">
                            Drop note here
                          </p>
                        ) : (
                          <button
                            onClick={() => handleNewNote(section.id)}
                            className="group absolute h-full w-full transition-colors hover:text-accent1"
                            aria-label="Add new note"
                            title="Add new note"
                          >
                            <StickyNote size={36} className="inline" />
                            <Plus
                              size={18}
                              className="-ml-[40px] inline h-[20px] w-[20px] rounded-full border-2 border-border bg-white group-hover:border-accent1 group-hover:bg-accent1 group-hover:text-white"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Note Dialog */}
        {noteDialogOpen && (
          <NoteDialog
            note={selectedNote}
            sectionId={selectedSectionId}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            onClose={handleCloseDialog}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
