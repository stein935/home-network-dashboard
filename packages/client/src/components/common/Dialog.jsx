import { useEffect, useRef } from 'react';
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
  const mouseDownTargetRef = useRef(null);

  // Lock body scroll when dialog is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Track where mousedown occurred
  const handleMouseDown = (e) => {
    mouseDownTargetRef.current = e.target;
  };

  // Only close if both mousedown and mouseup occurred on the backdrop
  // This allows text selection to extend outside the dialog without closing it
  const handleMouseUp = (e) => {
    if (
      e.target === e.currentTarget &&
      mouseDownTargetRef.current === e.currentTarget
    ) {
      onClose();
    }
    mouseDownTargetRef.current = null;
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 sm:flex sm:items-center sm:justify-center sm:p-4`}
      style={{ zIndex: zIndex === 9999 ? 9999 : zIndex }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`flex h-screen w-screen flex-col border-5 border-border bg-surface shadow-brutal sm:h-auto sm:w-full ${maxWidth}`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b-4 border-border bg-accent1 p-4 text-white sm:p-6">
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
          className={`flex-1 space-y-4 overflow-y-auto p-4 sm:max-h-[70vh] sm:flex-none sm:space-y-6 sm:p-6 ${contentClassName}`}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t-4 border-border p-4 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dialog;
