import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  StickyNote,
  Plus,
  CornerDownLeft,
} from 'lucide-react';
import Sortable from 'sortablejs';
import { useAuth } from '@hooks/useAuth';
import { sectionsApi, notesApi, servicesApi } from '@utils/api';
import { getRandomGreeting } from '@utils/greetings';
import ServiceCard from '@features/services/ServiceCard';
import StickyNoteCard from '@features/notes/StickyNoteCard';
import Footer from '@layout/Footer';
import NoteDialog from '@features/notes/NoteDialog';

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
  const sortableRefs = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize Sortable for services and notes grids
  useEffect(() => {
    if (loading) return;

    // Cleanup existing instances first
    Object.keys(sortableRefs.current).forEach((key) => {
      const sortable = sortableRefs.current[key];
      if (sortable && typeof sortable.destroy === 'function') {
        try {
          sortable.destroy();
        } catch {
          // Silently ignore
        }
      }
    });
    sortableRefs.current = {};

    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      // Initialize sortable for each section's services
      sectionsWithServices.forEach((section) => {
        // Skip collapsed sections - their DOM elements don't exist yet
        if (collapsedSections[section.id]) return;

        const servicesKey = `services-${section.id}`;
        const servicesGrid = document.querySelector(
          `[data-services-section="${section.id}"]`
        );

        if (servicesGrid && section.services.length > 0) {
          sortableRefs.current[servicesKey] = new Sortable(servicesGrid, {
            animation: 150,
            handle: '.sortable-handle',
            ghostClass: 'opacity-50',
            onEnd: async (evt) => {
              if (evt.oldIndex === evt.newIndex) return;

              const scrollY = window.scrollY;
              const sectionServices =
                sectionsWithServices.find((s) => s.id === section.id)
                  ?.services || [];
              const reorderedServices = Array.from(sectionServices);
              const [movedService] = reorderedServices.splice(evt.oldIndex, 1);
              reorderedServices.splice(evt.newIndex, 0, movedService);

              const updates = reorderedServices.map((service, index) => ({
                id: service.id,
                displayOrder: index,
              }));

              try {
                await servicesApi.reorder(updates);
                await fetchServices();
                window.scrollTo(0, scrollY);
              } catch (err) {
                console.error('Error reordering services:', err);
                alert('Failed to reorder services');
              }
            },
          });
        }

        // Initialize sortable for each section's notes
        const notesKey = `notes-${section.id}`;
        const notesGrid = document.querySelector(
          `[data-notes-section="${section.id}"]`
        );
        const sectionNotes = notes.filter((n) => n.section_id === section.id);

        if (notesGrid && sectionNotes.length > 0) {
          sortableRefs.current[notesKey] = new Sortable(notesGrid, {
            animation: 150,
            handle: '.sortable-handle',
            ghostClass: 'opacity-50',
            onEnd: async (evt) => {
              if (evt.oldIndex === evt.newIndex) return;

              const scrollY = window.scrollY;
              const currentSectionNotes = notes.filter(
                (n) => n.section_id === section.id
              );
              const reorderedNotes = Array.from(currentSectionNotes);
              const [movedNote] = reorderedNotes.splice(evt.oldIndex, 1);
              reorderedNotes.splice(evt.newIndex, 0, movedNote);

              const updates = reorderedNotes.map((note, index) => ({
                id: note.id,
                sectionId: section.id,
                displayOrder: index,
              }));

              try {
                await notesApi.reorder(updates);
                await fetchNotes();
                window.scrollTo(0, scrollY);
              } catch (err) {
                console.error('Error reordering notes:', err);
                alert('Failed to reorder notes');
              }
            },
          });
        }
      });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup sortable instances
      Object.keys(sortableRefs.current).forEach((key) => {
        const sortable = sortableRefs.current[key];
        if (sortable && typeof sortable.destroy === 'function') {
          try {
            sortable.destroy();
          } catch {
            // Silently ignore
          }
        }
      });
      sortableRefs.current = {};
    };
  }, [loading, sectionsWithServices, notes, collapsedSections]);

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

      // Initialize collapsed sections based on default values
      const initialCollapsedState = {};
      sectionsResponse.data.forEach((section) => {
        initialCollapsedState[section.id] =
          section.is_collapsed_by_default || false;
      });
      setCollapsedSections(initialCollapsedState);
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

  const fetchServices = async () => {
    try {
      const response = await sectionsApi.getAllWithServices();
      setSectionsWithServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
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

  return (
    <div className="min-h-screen px-6 pb-0 pt-6 md:px-12 md:pt-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-3 flex flex-wrap items-start justify-between sm:mb-6">
          <h1 className="mb-2 inline font-display text-display-sm uppercase text-text sm:text-display-lg">
            THE
            <span className="text-accent1"> STEINECKS</span>
          </h1>
          <p className="inline font-accent text-accent-sm text-accent2 sm:text-accent-md">
            {getRandomGreeting() || 'Hello'}, {user?.name || user?.email}!
            <CornerDownLeft
              size={32}
              strokeWidth={3}
              className="-mt-2 ml-4 inline text-accent3"
            />
          </p>
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
          <div className="">
            {sectionsWithServices
              .filter(
                (section) =>
                  !(section.name === 'Default' && section.services.length === 0)
              )
              .map((section) => (
                <div
                  key={section.id}
                  className={`${collapsedSections[section.id] ? '' : 'mb-8'}`}
                >
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
                          <div
                            data-services-section={section.id}
                            className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4"
                          >
                            {section.services.map((service) => (
                              <ServiceCard key={service.id} service={service} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes Grid */}
                      <div
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
                            <div
                              data-notes-section={section.id}
                              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
                            >
                              {getSectionNotes(section.id).map((note) => (
                                <StickyNoteCard
                                  key={note.id}
                                  note={note}
                                  onEdit={handleEditNote}
                                  onCheckboxToggle={handleCheckboxToggle}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => handleNewNote(section.id)}
                              className="group mt-6 min-h-[100px] w-full rounded border-3 border-dashed border-border/30 transition-colors hover:text-accent1"
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

        <Footer />

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
