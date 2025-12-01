import { useState, useEffect } from 'react';
import { Play, FileText } from 'lucide-react';
import { getDataApi, calendarApi } from '@utils/api';
import { useNotification } from '@hooks/useNotification';
import { Dialog } from '@common/Dialog';

/**
 * GetDataManager Component
 *
 * Manages data functions that fetch data from external APIs
 * and create Google Calendar events. Data functions are hard-coded
 * in the backend - no CRUD operations allowed from the UI.
 *
 * Admin users can:
 * - View all data functions
 * - Manually trigger execution
 * - View execution logs
 */
export function GetDataManager() {
  const { notify } = useNotification();
  const [dataFunctions, setDataFunctions] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [triggering, setTriggering] = useState(null);

  useEffect(() => {
    fetchDataFunctions();
    fetchCalendars();
  }, []);

  const fetchDataFunctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDataApi.getAll();
      setDataFunctions(response.data);
    } catch (err) {
      console.error('Error fetching data functions:', err);
      setError('Failed to load data functions');
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
      // Don't show error to user, just use calendar IDs as fallback
    }
  };

  const getCalendarName = (calendarId) => {
    if (!calendarId) return 'Not configured';
    const calendar = calendars.find((cal) => cal.id === calendarId);
    return calendar ? calendar.summary : calendarId;
  };

  const handleTrigger = async (functionId, functionName) => {
    try {
      setTriggering(functionId);
      const response = await getDataApi.trigger(functionId);
      if (response.data.success) {
        notify.success(
          `${functionName} completed successfully! ${response.data.eventsCreated} events created, ${response.data.eventsDeleted || 0} events deleted.`
        );
      } else {
        notify.error(`${functionName} failed: ${response.data.message}`);
      }
      fetchDataFunctions();
    } catch (err) {
      console.error('Error triggering data function:', err);
      notify.error(
        err.response?.data?.error || 'Failed to trigger data function'
      );
    } finally {
      setTriggering(null);
    }
  };

  const handleViewLogs = async (functionId) => {
    try {
      const response = await getDataApi.getLogs(functionId);
      setLogs(response.data);
      setShowLogs(true);
    } catch (err) {
      console.error('Error fetching logs:', err);
      notify.error('Failed to load logs');
    }
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
    setLogs([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    // Ensure the date string is treated as UTC if it doesn't have timezone info
    let date = new Date(dateString);

    // If the date string doesn't include 'Z' or timezone offset, treat it as UTC
    if (
      typeof dateString === 'string' &&
      !dateString.includes('Z') &&
      !dateString.match(/[+-]\d{2}:\d{2}$/)
    ) {
      date = new Date(dateString + 'Z');
    }

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatSchedule = (cronSchedule) => {
    // Convert common cron expressions to human-readable format
    const cronMap = {
      '0 6 * * *': 'Every day at 6:00 AM',
      '0 18 * * *': 'Every day at 6:00 PM',
      '0 */2 * * *': 'Every 2 hours',
      '0 0 * * *': 'Every day at midnight',
      '0 12 * * *': 'Every day at noon',
    };

    return cronMap[cronSchedule] || cronSchedule;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h2 className="mb-1 w-full font-display text-display-sm uppercase text-text sm:mb-0 sm:w-auto">
          Get Data Functions
        </h2>
        <p className="w-full text-sm text-text/60 sm:w-auto">
          Data functions are hard-coded and cannot be added or edited from the
          UI
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <p className="font-display text-xl uppercase text-accent1">
            Loading Data Functions...
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
                  Function Name
                </th>
                <th className="p-4 text-left font-display uppercase text-text">
                  Target Calendar
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
              {dataFunctions.map((func) => (
                <tr
                  key={func.id}
                  className="border-b-3 border-border last:border-b-0"
                >
                  <td className="p-4">
                    <div className="truncate font-display uppercase">
                      {func.name}
                    </div>
                    {func.function_key && (
                      <div className="mt-1 text-sm text-text/60">
                        Key: {func.function_key}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {getCalendarName(func.calendar_id)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {formatSchedule(func.cron_schedule)}
                    </div>
                    <div className="mt-1 font-mono text-xs text-text/60">
                      {func.cron_schedule}
                    </div>
                  </td>
                  <td className="p-4 text-sm">{formatDate(func.last_run)}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase ${
                        func.enabled
                          ? 'bg-accent1 text-white'
                          : 'bg-text/20 text-text/60'
                      }`}
                    >
                      {func.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleTrigger(func.id, func.name)}
                        disabled={triggering === func.id}
                        className="btn-brutal-sm flex items-center gap-1 hover:opacity-80 disabled:bg-white"
                        title="Trigger now"
                      >
                        <Play size={20} />
                        {triggering === func.id ? 'Running...' : 'Run'}
                      </button>
                      <button
                        onClick={() => handleViewLogs(func.id)}
                        className="btn-brutal-sm flex items-center gap-1 hover:opacity-80"
                        title="View logs"
                      >
                        <FileText size={20} />
                        Logs
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {dataFunctions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text/60">
                    No data functions configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs Dialog */}
      {showLogs && (
        <Dialog
          title="Data Function Logs"
          onClose={handleCloseLogs}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-text/60">
                No logs available for this data function.
              </p>
            ) : (
              logs.slice(0, 10).map((log) => (
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
