import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '@hooks/useNotification';
import { Dialog } from './Dialog';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const NOTIFICATION_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const NOTIFICATION_TITLES = {
  success: 'Success!',
  error: 'Error',
  warning: 'Warning',
  info: 'Notice',
};

export function NotificationContainer() {
  const {
    notifications,
    dismissNotification,
    confirmDialog,
    handleConfirm,
    handleCancel,
  } = useNotification();

  // Get the first notification (only show one at a time)
  const currentNotification = notifications[0];

  // Auto-dismiss success/info notifications after 5 seconds
  useEffect(() => {
    if (!currentNotification?.autoDismiss) return;

    const timer = setTimeout(() => {
      dismissNotification(currentNotification.id);
    }, currentNotification.duration || 5000);

    return () => clearTimeout(timer);
  }, [currentNotification, dismissNotification]);

  return (
    <>
      {/* Notification dialog */}
      {currentNotification &&
        createPortal(
          <Dialog
            title={NOTIFICATION_TITLES[currentNotification.type]}
            icon={(() => {
              const IconComponent =
                NOTIFICATION_ICONS[currentNotification.type];
              return <IconComponent className="h-8 w-8" />;
            })()}
            onClose={() => dismissNotification(currentNotification.id)}
            preventBackdropClose={true}
            maxWidth="max-w-md"
            footer={
              <div className="flex justify-end">
                <button
                  onClick={() => dismissNotification(currentNotification.id)}
                  className="btn-brutal-primary"
                >
                  Dismiss
                </button>
              </div>
            }
          >
            <p className="text-gray-800">{currentNotification.message}</p>
          </Dialog>,
          document.body
        )}

      {/* Confirmation dialog */}
      {confirmDialog?.isOpen &&
        createPortal(
          <Dialog
            title={confirmDialog.title}
            icon={
              confirmDialog.confirmVariant === 'danger' ? (
                <AlertTriangle className="h-8 w-8" />
              ) : null
            }
            onClose={handleCancel}
            preventBackdropClose={true}
            maxWidth="max-w-md"
            footer={
              <div className="flex justify-end gap-3">
                <button onClick={handleCancel} className="btn-brutal">
                  {confirmDialog.cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={
                    confirmDialog.confirmVariant === 'danger'
                      ? 'btn-brutal-danger'
                      : 'btn-brutal-primary'
                  }
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            }
          >
            <p className="text-gray-800">{confirmDialog.message}</p>
          </Dialog>,
          document.body
        )}
    </>
  );
}
