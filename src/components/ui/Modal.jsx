import { memo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SIZES = {
  xs: "max-w-sm",
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

/**
 * Generic modal with portal, Escape-close, backdrop-close, and body-scroll lock.
 *
 * @param {boolean}    open       - controlled visibility
 * @param {function}   onClose    - called on Escape / backdrop click
 * @param {string}     title      - optional header title
 * @param {ReactNode}  children   - body content
 * @param {ReactNode}  footer     - optional sticky footer (for action buttons)
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'full'} size
 * @param {boolean}    closable   - show the × button (default true)
 */
const Modal = memo(function Modal({ open, onClose, title, children, footer, size = "md", closable = true })
{
  /* Escape key */
  useEffect(() =>
  {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* Body-scroll lock */
  useEffect(() =>
  {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closable ? onClose : undefined} aria-hidden="true" />

      {/* Panel */}
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${SIZES[size] ?? SIZES.md} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            {title && <h2 className="text-sm font-semibold text-gray-800">{title}</h2>}
            {closable && (
              <button
                onClick={onClose}
                className="ml-auto p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/70 rounded-b-xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
});

export default Modal;
