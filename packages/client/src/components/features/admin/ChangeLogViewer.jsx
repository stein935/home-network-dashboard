import { useState, useEffect } from 'react';
import { changeLogsApi } from '@utils/api';
import { Dialog } from '@common/Dialog';

/**
 * ChangeLogViewer Component
 *
 * Displays audit trail of all user-initiated changes to the dashboard.
 * Admin-only view showing create/update/delete operations with before/after details.
 */
export function ChangeLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await changeLogsApi.getAll();
      setLogs(response.data.logs);
    } catch (err) {
      console.error('Error fetching change logs:', err);
      setError('Failed to load change logs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedLog(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const getActionBadgeClass = (action) => {
    const baseClasses = 'inline-block px-2 py-1 font-display text-xs uppercase';
    switch (action) {
      case 'create':
        return `${baseClasses} bg-green-500 text-white`;
      case 'update':
        return `${baseClasses} bg-accent1 text-white`;
      case 'delete':
        return `${baseClasses} bg-error text-white`;
      case 'trigger':
        return `${baseClasses} bg-purple-500 text-white`;
      default:
        return `${baseClasses} bg-gray-500 text-white`;
    }
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'service':
        return '🔗';
      case 'section':
        return '📁';
      case 'note':
        return '📝';
      case 'user':
        return '👤';
      case 'data_function':
        return '🤖';
      default:
        return '❓';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-1 font-display text-display-sm uppercase text-text">
          Change Log
        </h2>
        <p className="text-sm text-text/60">
          Audit trail of all user-initiated changes (retained for 7 days)
        </p>
      </div>

      {loading && (
        <div className="py-8 text-center text-text/60">
          Loading change logs...
        </div>
      )}

      {error && (
        <div className="rounded border-2 border-error bg-red-50 px-4 py-3 text-error">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="py-8 text-center text-text/60">
          No change logs yet. Changes made by users will appear here.
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-black text-left text-white">
                <th className="border-2 border-black px-3 py-2 font-display text-xs uppercase">
                  Timestamp
                </th>
                <th className="border-2 border-black px-3 py-2 font-display text-xs uppercase">
                  User
                </th>
                <th className="border-2 border-black px-3 py-2 font-display text-xs uppercase">
                  Action
                </th>
                <th className="border-2 border-black px-3 py-2 font-display text-xs uppercase">
                  Entity Type
                </th>
                <th className="border-2 border-black px-3 py-2 font-display text-xs uppercase">
                  Entity Name
                </th>
                <th className="border-2 border-black px-3 py-2 font-display text-xs uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="border-2 border-black px-3 py-2 text-sm">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="border-2 border-black px-3 py-2 text-sm">
                    <div className="font-medium">{log.user_name}</div>
                    <div className="text-xs text-text/60">{log.user_email}</div>
                  </td>
                  <td className="border-2 border-black px-3 py-2">
                    <span className={getActionBadgeClass(log.action_type)}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="border-2 border-black px-3 py-2 text-sm">
                    <span className="mr-1">
                      {getEntityIcon(log.entity_type)}
                    </span>
                    {log.entity_type}
                  </td>
                  <td className="border-2 border-black px-3 py-2 text-sm font-medium">
                    {log.entity_name}
                  </td>
                  <td className="border-2 border-black px-3 py-2 text-center">
                    <button
                      onClick={() => handleViewDetails(log)}
                      className="border-2 border-black bg-white px-3 py-1 font-display text-xs uppercase transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-accent1 hover:text-white"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetails && selectedLog && (
        <Dialog
          title="Change Details"
          onClose={handleCloseDetails}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold uppercase text-text/60">
                  Action
                </div>
                <div className="mt-1">
                  <span
                    className={getActionBadgeClass(selectedLog.action_type)}
                  >
                    {selectedLog.action_type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-text/60">
                  Entity
                </div>
                <div className="mt-1 font-medium">
                  <span className="mr-1">
                    {getEntityIcon(selectedLog.entity_type)}
                  </span>
                  {selectedLog.entity_type}: {selectedLog.entity_name}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-text/60">
                  User
                </div>
                <div className="mt-1">
                  <div className="font-medium">{selectedLog.user_name}</div>
                  <div className="text-sm text-text/60">
                    {selectedLog.user_email}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-text/60">
                  Timestamp
                </div>
                <div className="mt-1 text-sm">
                  {formatDate(selectedLog.created_at)}
                </div>
              </div>
            </div>

            {/* Details JSON */}
            {selectedLog.details && (
              <div>
                <div className="mb-2 text-xs font-bold uppercase text-text/60">
                  Change Details
                </div>
                <pre className="overflow-x-auto rounded border-2 border-black bg-gray-50 p-3 text-xs">
                  {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
