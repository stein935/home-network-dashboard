import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { sectionsApi } from '@utils/api';
import { Dialog } from '@common/Dialog';

export function SectionManager() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_order: '',
    is_collapsed_by_default: false,
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sectionsApi.getAll();
      setSections(response.data);
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingSection(null);
    const nextOrder =
      sections.length > 0
        ? Math.max(...sections.map((s) => s.display_order)) + 1
        : 1;
    setFormData({
      name: '',
      display_order: nextOrder,
      is_collapsed_by_default: false,
    });
    setShowForm(true);
    setFormError(null);
  };

  const handleEditClick = (section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      display_order: section.display_order,
      is_collapsed_by_default: section.is_collapsed_by_default || false,
    });
    setShowForm(true);
    setFormError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSection(null);
    setFormData({
      name: '',
      display_order: '',
      is_collapsed_by_default: false,
    });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      const submitData = {
        name: formData.name.trim(),
        display_order: parseInt(formData.display_order, 10),
        is_collapsed_by_default: formData.is_collapsed_by_default,
      };

      if (editingSection) {
        await sectionsApi.update(editingSection.id, submitData);
      } else {
        await sectionsApi.create(submitData);
      }

      handleCloseForm();
      fetchSections();
    } catch (err) {
      console.error('Error saving section:', err);
      setFormError(err.response?.data?.error || 'Failed to save section');
    }
  };

  const handleDelete = async (section) => {
    if (section.is_default) {
      alert('Cannot delete the default section');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${section.name}"? Services in this section will be moved to the default section.`
      )
    ) {
      return;
    }

    try {
      await sectionsApi.delete(section.id);
      fetchSections();
    } catch (err) {
      console.error('Error deleting section:', err);
      alert(err.response?.data?.error || 'Failed to delete section');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h2 className="mb-1 w-full font-display text-display-sm uppercase text-text sm:mb-0 sm:w-auto">
          Manage Sections
        </h2>
        <button
          onClick={handleAddClick}
          className="btn-brutal-primary flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          <Plus size={20} />
          Add Section
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <p className="font-display text-xl uppercase text-accent1">
            Loading Sections...
          </p>
        </div>
      ) : error ? (
        <div className="border-3 border-error bg-surface p-4">
          <p className="text-error">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-5 border-border bg-surface shadow-brutal">
          <table className="w-full">
            <thead className="border-b-3 border-border">
              <tr>
                <th className="p-4 text-left font-display uppercase text-text">
                  Order
                </th>
                <th className="p-4 text-left font-display uppercase text-text">
                  Name
                </th>
                <th className="p-4 text-right font-display uppercase text-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr
                  key={section.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="p-4 font-body text-text">
                    {section.display_order}
                  </td>
                  <td className="p-4 font-body text-text">{section.name}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleEditClick(section)}
                        className="text-accent1 hover:opacity-80"
                        aria-label="Edit section"
                      >
                        <Edit size={20} />
                      </button>
                      {!section.is_default && (
                        <button
                          onClick={() => handleDelete(section)}
                          className="text-error hover:opacity-80"
                          aria-label="Delete section"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section Form Modal */}
      {showForm && (
        <Dialog
          title={editingSection ? 'Edit Section' : 'Add Section'}
          onClose={handleCloseForm}
          maxWidth="max-w-md"
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-brutal-primary flex-1"
              >
                {editingSection ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCloseForm}
                className="btn-brutal flex-1"
              >
                Cancel
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block font-display text-sm uppercase text-text"
              >
                Section Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-background w-full border-3 border-border px-4 py-2 text-text focus:border-accent1 focus:outline-none"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label
                htmlFor="display_order"
                className="mb-2 block font-display text-sm uppercase text-text"
              >
                Display Order
              </label>
              <input
                type="number"
                id="display_order"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: e.target.value })
                }
                className="bg-background w-full border-3 border-border px-4 py-2 text-text focus:border-accent1 focus:outline-none"
                required
                min="0"
              />
            </div>

            <div>
              <label className="mb-2 block font-display text-sm uppercase text-text">
                Collapse Default
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="collapse_default"
                    checked={!formData.is_collapsed_by_default}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        is_collapsed_by_default: false,
                      })
                    }
                    className="h-5 w-5 border-3 border-border text-accent1 focus:ring-accent1"
                  />
                  <span className="font-body text-text">Open</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="collapse_default"
                    checked={formData.is_collapsed_by_default}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        is_collapsed_by_default: true,
                      })
                    }
                    className="h-5 w-5 border-3 border-border text-accent1 focus:ring-accent1"
                  />
                  <span className="font-body text-text">Closed</span>
                </label>
              </div>
            </div>

            {formError && (
              <div className="border-2 border-error bg-error/10 p-3">
                <p className="text-sm text-error">{formError}</p>
              </div>
            )}
          </form>
        </Dialog>
      )}
    </div>
  );
}

export default SectionManager;
