import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Remove a notification
  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Add a notification to the queue
  const addNotification = useCallback(
    (type, message, autoDismiss = true, duration = 5000) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const notification = { id, type, message, autoDismiss, duration };

      setNotifications((prev) => {
        // Limit to 5 notifications max
        const updated = [...prev, notification];
        return updated.slice(-5);
      });

      // Auto-dismiss if enabled
      if (autoDismiss) {
        setTimeout(() => {
          dismissNotification(id);
        }, duration);
      }

      return id;
    },
    [dismissNotification]
  );

  // Notification helpers
  const notify = {
    success: useCallback(
      (message) => {
        return addNotification('success', message, true, 5000);
      },
      [addNotification]
    ),

    error: useCallback(
      (message) => {
        return addNotification('error', message, false);
      },
      [addNotification]
    ),

    warning: useCallback(
      (message) => {
        return addNotification('warning', message, false);
      },
      [addNotification]
    ),

    info: useCallback(
      (message) => {
        return addNotification('info', message, true, 5000);
      },
      [addNotification]
    ),
  };

  // Confirmation dialog (promise-based)
  const confirm = useCallback(
    ({
      title = 'Are you sure?',
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = 'primary',
    }) => {
      return new Promise((resolve) => {
        setConfirmDialog({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          confirmVariant,
          resolve,
        });
      });
    },
    []
  );

  // Handle confirm dialog response
  const handleConfirm = useCallback(() => {
    if (confirmDialog?.resolve) {
      confirmDialog.resolve(true);
    }
    setConfirmDialog(null);
  }, [confirmDialog]);

  const handleCancel = useCallback(() => {
    if (confirmDialog?.resolve) {
      confirmDialog.resolve(false);
    }
    setConfirmDialog(null);
  }, [confirmDialog]);

  const value = {
    notifications,
    dismissNotification,
    notify,
    confirm,
    confirmDialog,
    handleConfirm,
    handleCancel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
