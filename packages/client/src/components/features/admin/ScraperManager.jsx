import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, FileText } from 'lucide-react';
import { scraperApi, calendarApi } from '@utils/api';
import { Dialog } from '@common/Dialog';

export function ScraperManager() {
  const [scrapers, setScrapers] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingScraper, setEditingScraper] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    calendar_id: '',
    cron_schedule: '0 6 * * *',
    enabled: true,
  });
  const [formError, setFormError] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [triggering, setTriggering] = useState(null);

  useEffect(() => {
    fetchScrapers();
    fetchCalendars();
  }, []);

  const fetchScrapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scraperApi.getAll();
      setScrapers(response.data);
    } catch (err) {
      console.error('Error fetching scrapers:', err);
      setError('Failed to load scrapers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await calendarApi.getCalendars();
      setCalendars(response.data);
    } catch (err) {
      console.error('Error fetching calendars:', err);
    }
  };

  const handleAddClick = () => {
    setEditingScraper(null);
    setFormData({
      name: '',
      url: '',
      calendar_id: '',
      cron_schedule: '0 6 * * *',
      enabled: true,
    });
    setShowForm(true);
    setFormError(null);
  };

  const handleEditClick = (scraper) => {
    setEditingScraper(scraper);
    setFormData({
      name: scraper.name,
      url: scraper.url,
      calendar_id: scraper.calendar_id,
      cron_schedule: scraper.cron_schedule,
      enabled: Boolean(scraper.enabled),
    });
    setShowForm(true);
    setFormError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingScraper(null);
    setFormData({
      name: '',
      url: '',
      calendar_id: '',
      cron_schedule: '0 6 * * *',
      enabled: true,
    });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      const submitData = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        calendar_id: formData.calendar_id.trim(),
        cron_schedule: formData.cron_schedule.trim(),
        enabled: formData.enabled,
      };

      if (editingScraper) {
        await scraperApi.update(editingScraper.id, submitData);
      } else {
        await scraperApi.create(submitData);
      }

      handleCloseForm();
      fetchScrapers();
    } catch (err) {
      console.error('Error saving scraper:', err);
      setFormError(err.response?.data?.error || 'Failed to save scraper');
    }
  };

  const handleDelete = async (scraper) => {
    if (
      !confirm(
        `Are you sure you want to delete "${scraper.name}"? This will also delete all associated logs.`
      )
    ) {
      return;
    }

    try {
      await scraperApi.delete(scraper.id);
      fetchScrapers();
    } catch (err) {
      console.error('Error deleting scraper:', err);
      alert(err.response?.data?.error || 'Failed to delete scraper');
    }
  };

  const handleTrigger = async (scraperId) => {
    try {
      setTriggering(scraperId);
      const response = await scraperApi.trigger(scraperId);
      if (response.data.success) {
        alert(
          `Scraper triggered successfully!\n${response.data.eventsCreated} events created, ${response.data.eventsUpdated} events updated.`
        );
      } else {
        alert(`Scraper failed: ${response.data.message}`);
      }
      fetchScrapers();
    } catch (err) {
      console.error('Error triggering scraper:', err);
      alert(err.response?.data?.error || 'Failed to trigger scraper');
    } finally {
      setTriggering(null);
    }
  };

  const handleViewLogs = async (scraperId) => {
    try {
      const response = await scraperApi.getLogs(scraperId);
      setLogs(response.data);
      setShowLogs(true);
    } catch (err) {
      console.error('Error fetching logs:', err);
      alert('Failed to load logs');
    }
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
    setLogs([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h2 className="mb-1 w-full font-display text-display-sm uppercase text-text sm:mb-0 sm:w-auto">
          Manage Scrapers
        </h2>
        <button
          onClick={handleAddClick}
          className="btn-brutal-primary flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          <Plus size={20} />
          Add Scraper
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <p className="font-display text-xl uppercase text-accent1">
            Loading Scrapers...
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
                  Name
                </th>
                <th className="p-4 text-left font-display uppercase text-text">
                  Schedule
                </th>
                <th className="p-4 text-left font-display uppercase text-text">
                  Last Run
                </th>
                <th className="p-4 text-left font-display uppercase text-text">
                  Status
                </th>
                <th className="p-4 text-right font-display uppercase text-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {scrapers.map((scraper) => (
                <tr
                  key={scraper.id}
                  className="border-b-3 border-border last:border-b-0"
                >
                  <td className="p-4">
                    <div className="font-display uppercase">{scraper.name}</div>
                    <div className="mt-1 text-sm text-text/60">
                      {scraper.url}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-sm">
                      {scraper.cron_schedule}
                    </div>
                  </td>
                  <td className="p-4 text-sm">{formatDate(scraper.last_run)}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase ${
                        scraper.enabled
                          ? 'bg-accent1 text-white'
                          : 'bg-text/20 text-text/60'
                      }`}
                    >
                      {scraper.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleTrigger(scraper.id)}
                        disabled={triggering === scraper.id}
                        className="btn-brutal-sm flex items-center gap-1"
                        title="Trigger now"
                      >
                        <Play size={16} />
                        {triggering === scraper.id ? 'Running...' : 'Run'}
                      </button>
                      <button
                        onClick={() => handleViewLogs(scraper.id)}
                        className="btn-brutal-sm flex items-center gap-1"
                        title="View logs"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleEditClick(scraper)}
                        className="btn-brutal-sm flex items-center gap-1"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(scraper)}
                        className="btn-brutal-sm flex items-center gap-1 border-error text-error hover:bg-error hover:text-white"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {scrapers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text/60">
                    No scrapers configured. Click &quot;Add Scraper&quot; to
                    create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      {showForm && (
        <Dialog
          title={editingScraper ? 'Edit Scraper' : 'Add Scraper'}
          onClose={handleCloseForm}
          footer={
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="btn-brutal-primary"
                type="submit"
              >
                {editingScraper ? 'Update' : 'Create'}
              </button>
              <button onClick={handleCloseForm} className="btn-brutal">
                Cancel
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="border-3 border-error bg-error/10 p-3">
                <p className="text-sm text-error">{formError}</p>
              </div>
            )}

            <div>
              <label className="mb-2 block font-display uppercase text-text">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-brutal w-full"
                placeholder="School Lunch Menu"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-display uppercase text-text">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="input-brutal w-full"
                placeholder="https://linqconnect.com/..."
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-display uppercase text-text">
                Target Calendar
              </label>
              <select
                value={formData.calendar_id}
                onChange={(e) =>
                  setFormData({ ...formData, calendar_id: e.target.value })
                }
                className="input-brutal w-full"
                required
              >
                <option value="">Select a calendar</option>
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-display uppercase text-text">
                Schedule (Cron Expression)
              </label>
              <input
                type="text"
                value={formData.cron_schedule}
                onChange={(e) =>
                  setFormData({ ...formData, cron_schedule: e.target.value })
                }
                className="input-brutal w-full font-mono"
                placeholder="0 6 * * *"
                required
              />
              <p className="mt-1 text-xs text-text/60">
                Default: 0 6 * * * (daily at 6:00 AM)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="h-5 w-5"
              />
              <label
                htmlFor="enabled"
                className="font-display uppercase text-text"
              >
                Enabled
              </label>
            </div>
          </form>
        </Dialog>
      )}

      {/* Logs Dialog */}
      {showLogs && (
        <Dialog
          title="Scraper Logs"
          onClose={handleCloseLogs}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-text/60">
                No logs available for this scraper.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`border-3 p-4 ${
                    log.status === 'success'
                      ? 'border-accent1 bg-accent1/10'
                      : 'border-error bg-error/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase ${
                            log.status === 'success'
                              ? 'bg-accent1 text-white'
                              : 'bg-error text-white'
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="text-sm text-text/60">
                          {formatDate(log.run_at)}
                        </span>
                      </div>
                      {log.message && (
                        <p className="mt-2 text-sm">{log.message}</p>
                      )}
                      {log.status === 'success' && (
                        <p className="mt-1 text-xs text-text/60">
                          Created: {log.events_created} | Updated:{' '}
                          {log.events_updated}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
