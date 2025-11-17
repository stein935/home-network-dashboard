import { X } from 'lucide-react';

/**
 * Unified Dialog component with blue header, content section, and optional footer
 *
 * @param {string} title - Dialog title displayed in the header
 * @param {function} onClose - Handler called when dialog is closed
 * @param {ReactNode} children - Content section of the dialog
 * @param {ReactNode} footer - Optional footer with action buttons
 * @param {string} maxWidth - Max width class (default: 'max-w-2xl')
 * @param {string} contentClassName - Additional classes for content section
 * @param {number} zIndex - Z-index for dialog (default: 50)
 */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  contentClassName = '',
  zIndex = 50,
}) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 p-4`}
      style={{ zIndex: zIndex === 9999 ? 9999 : zIndex }}
      onClick={handleBackdropClick}
    >
      <div
        className={`border-5 border-border bg-surface shadow-brutal ${maxWidth} w-full`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-border bg-accent1 p-4 text-white sm:p-6">
          <h2 className="font-display text-xl uppercase sm:text-2xl md:text-3xl">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 transition-colors hover:bg-accent1/20"
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div
          className={`max-h-[70vh] space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6 ${contentClassName}`}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t-4 border-border p-4 sm:p-6">{footer}</div>
        )}
      </div>
    </div>
  );
}

export default Dialog;
